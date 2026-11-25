package com.melachow.customer;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Extends Capacitor's PushNotifications MessagingService to intercept
 * high-priority data-only incoming call FCM payloads when the app is
 * backgrounded or terminated, while delegating all standard order pushes.
 */
public class VoiceCallFirebaseMessagingService extends MessagingService {
    public static final String INCOMING_CALL_CHANNEL_ID = "melachow_incoming_voice_calls";
    public static final int INCOMING_CALL_NOTIFICATION_ID = 42002;

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (data != null && data.containsKey("type")) {
            String type = data.get("type");
            String callId = data.get("callId");

            if ("incoming_call".equals(type) && callId != null && !callId.isEmpty()) {
                String callerName = data.get("callerName");
                String orderCode = data.get("orderCode");
                showIncomingCallNotification(callId, callerName, orderCode);
                VoiceCallPlugin.storeOrDispatchCallAction("open", callId, callerName, orderCode);
                return;
            }

            if ("call_cancelled".equals(type) || "call_ended".equals(type) || "call_answered".equals(type)) {
                dismissIncomingCallNotification(callId);
                return;
            }
        }

        super.onMessageReceived(remoteMessage);
    }

    private void showIncomingCallNotification(String callId, String callerName, String orderCode) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        ensureIncomingCallChannel(nm);

        String displayCaller = (callerName != null && !callerName.isEmpty()) ? callerName : "Delivery Rider";
        String subtitle = (orderCode != null && !orderCode.isEmpty())
            ? "Order #" + orderCode + " • In-App Voice Call"
            : "MelaChow In-App Voice Call";

        PendingIntent fullScreenIntent = buildCallActionIntent("open", callId, displayCaller, orderCode, 100);
        PendingIntent acceptIntent = buildCallActionIntent("accept", callId, displayCaller, orderCode, 101);
        PendingIntent declineIntent = buildCallActionIntent("reject", callId, displayCaller, orderCode, 102);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, INCOMING_CALL_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Incoming Call • " + displayCaller)
            .setContentText(subtitle)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(true)
            .setTimeoutAfter(35000L)
            .setFullScreenIntent(fullScreenIntent, true)
            .setContentIntent(fullScreenIntent)
            .addAction(android.R.drawable.ic_menu_call, "Accept", acceptIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", declineIntent);

        nm.notify(INCOMING_CALL_NOTIFICATION_ID, builder.build());
    }

    private PendingIntent buildCallActionIntent(
        String action,
        String callId,
        String callerName,
        String orderCode,
        int requestCode
    ) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("callAction", action);
        intent.putExtra("callId", callId);
        intent.putExtra("callerName", callerName);
        if (orderCode != null) intent.putExtra("orderCode", orderCode);

        return PendingIntent.getActivity(
            this,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private void ensureIncomingCallChannel(NotificationManager nm) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel existing = nm.getNotificationChannel(INCOMING_CALL_CHANNEL_ID);
            if (existing != null) return;

            NotificationChannel channel = new NotificationChannel(
                INCOMING_CALL_CHANNEL_ID,
                "Incoming Voice Calls",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Full-screen incoming in-app voice calls from your rider");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[] { 0, 500, 300, 500 });
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            AudioAttributes audioAttrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), audioAttrs);
            nm.createNotificationChannel(channel);
        }
    }

    private void dismissIncomingCallNotification(String callId) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(INCOMING_CALL_NOTIFICATION_ID);
            if (callId != null && !callId.isEmpty()) {
                nm.cancel(callId.hashCode());
            }
        }
    }
}
