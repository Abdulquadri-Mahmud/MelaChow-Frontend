package com.melachow.customer;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

public class VoiceCallForegroundService extends Service {
    private static final String TAG = "VoiceCallFgService";
    public static final String CHANNEL_ID = "melachow_active_voice_call";
    public static final int NOTIFICATION_ID = 42001;

    public static final String ACTION_START = "com.melachow.customer.action.CALL_SERVICE_START";
    public static final String ACTION_UPDATE = "com.melachow.customer.action.CALL_SERVICE_UPDATE";
    public static final String ACTION_END_CALL = "com.melachow.customer.action.CALL_SERVICE_END";

    private static final long WAKE_LOCK_TIMEOUT_MS = 40 * 60 * 1000L;

    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;
    private boolean isForegroundActive = false;
    private String currentCallId = "";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;

        if (ACTION_END_CALL.equals(action)) {
            String targetCallId = intent != null ? intent.getStringExtra("callId") : currentCallId;
            if (targetCallId == null || targetCallId.isEmpty()) targetCallId = currentCallId;
            VoiceCallPlugin.storeOrDispatchCallAction("end", targetCallId, null, null);
            stopSelf();
            return START_NOT_STICKY;
        }

        String callId = intent != null ? intent.getStringExtra("callId") : currentCallId;
        if (callId != null && !callId.isEmpty()) {
            currentCallId = callId;
        }
        String callerName = intent != null ? intent.getStringExtra("callerName") : "Delivery Rider";
        if (callerName == null || callerName.isEmpty()) callerName = "Delivery Rider";
        String status = intent != null ? intent.getStringExtra("status") : "connected";
        long connectedAtMs = intent != null ? intent.getLongExtra("connectedAtMs", 0L) : 0L;

        createChannel();
        Notification notification = buildOngoingNotification(currentCallId, callerName, status, connectedAtMs);

        if (ACTION_UPDATE.equals(action) && isForegroundActive) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(NOTIFICATION_ID, notification);
            }
            acquireLocks();
            return START_NOT_STICKY;
        }

        // Android 14+ (API 34+) requires RECORD_AUDIO permission before starting a microphone FGS
        boolean hasMicPerm = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED;

        if (!hasMicPerm) {
            Log.w(TAG, "Skipping microphone foreground service start: RECORD_AUDIO not granted");
            stopSelf();
            return START_NOT_STICKY;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                );
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
            isForegroundActive = true;
            acquireLocks();
        } catch (SecurityException | IllegalStateException ex) {
            Log.e(TAG, "Unable to start voice call foreground service: " + ex.getMessage());
            stopSelf();
        }

        return START_NOT_STICKY;
    }

    private Notification buildOngoingNotification(
        String callId,
        String callerName,
        String status,
        long connectedAtMs
    ) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent endIntent = new Intent(this, VoiceCallForegroundService.class);
        endIntent.setAction(ACTION_END_CALL);
        endIntent.putExtra("callId", callId);
        PendingIntent endPendingIntent = PendingIntent.getService(
            this,
            1,
            endIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String contentText;
        if ("ringing".equals(status)) {
            contentText = "Calling " + callerName + "...";
        } else if ("connecting".equals(status)) {
            contentText = "Connecting with " + callerName + "...";
        } else if ("reconnecting".equals(status)) {
            contentText = "Reconnecting with " + callerName + "...";
        } else {
            contentText = "In call with " + callerName;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("MelaChow In-App Call")
            .setContentText(contentText)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setOngoing(true)
            .setSilent(true)
            .setOnlyAlertOnce(true)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setContentIntent(contentIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "End Call", endPendingIntent);

        if (connectedAtMs > 0L && ("connected".equals(status) || "reconnecting".equals(status))) {
            builder.setWhen(connectedAtMs)
                .setShowWhen(true)
                .setUsesChronometer(true);
        } else {
            builder.setShowWhen(false)
                .setUsesChronometer(false);
        }

        return builder.build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Ongoing Voice Calls",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps MelaChow in-app voice calls active when screen is locked");
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private void acquireLocks() {
        try {
            if (wakeLock == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MelaChow::VoiceCallWakeLock");
                    wakeLock.setReferenceCounted(false);
                }
            }
            if (wakeLock != null) {
                wakeLock.acquire(WAKE_LOCK_TIMEOUT_MS);
            }
        } catch (Exception ignored) {}

        try {
            if (wifiLock == null) {
                WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                if (wm != null) {
                    int mode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                        ? WifiManager.WIFI_MODE_FULL_LOW_LATENCY
                        : WifiManager.WIFI_MODE_FULL_HIGH_PERF;
                    wifiLock = wm.createWifiLock(mode, "MelaChow::VoiceCallWifiLock");
                    wifiLock.setReferenceCounted(false);
                }
            }
            if (wifiLock != null && !wifiLock.isHeld()) {
                wifiLock.acquire();
            }
        } catch (Exception ignored) {}
    }

    private void releaseLocks() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
        wakeLock = null;

        if (wifiLock != null && wifiLock.isHeld()) {
            try {
                wifiLock.release();
            } catch (Exception ignored) {}
        }
        wifiLock = null;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        isForegroundActive = false;
        releaseLocks();
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
