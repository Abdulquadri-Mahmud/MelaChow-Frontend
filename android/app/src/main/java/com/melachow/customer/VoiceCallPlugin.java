package com.melachow.customer;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.List;

@CapacitorPlugin(
    name = "VoiceCall",
    permissions = {
        @Permission(alias = "audio", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class VoiceCallPlugin extends Plugin {
    private static final String TAG = "VoiceCallPlugin";
    private static volatile VoiceCallPlugin activeInstance;
    private static volatile JSObject pendingCallAction;

    private AudioFocusRequest audioFocusRequest;
    private ConnectivityManager.NetworkCallback networkCallback;
    private String lastNetworkType = "";

    private final AudioManager.OnAudioFocusChangeListener audioFocusChangeListener = focusChange -> {
        JSObject payload = new JSObject();
        if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
            payload.put("focus", "gain");
        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
            payload.put("focus", "loss");
        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT
            || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
            payload.put("focus", "loss_transient");
        } else {
            return;
        }
        notifyListeners("audioFocusChange", payload, false);
    };

    @Override
    public void load() {
        super.load();
        activeInstance = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (activeInstance == this) {
            activeInstance = null;
        }
        unregisterNetworkMonitor();
        releaseAudioFocus();
        super.handleOnDestroy();
    }

    public static void storeOrDispatchCallAction(String action, String callId, String callerName, String orderCode) {
        if (callId == null || callId.isEmpty()) return;
        JSObject payload = new JSObject();
        payload.put("action", action != null ? action : "open");
        payload.put("callId", callId);
        if (callerName != null) payload.put("callerName", callerName);
        if (orderCode != null) payload.put("orderCode", orderCode);

        VoiceCallPlugin instance = activeInstance;
        if (instance != null && instance.hasListeners("callAction")) {
            pendingCallAction = null;
            instance.notifyListeners("callAction", payload, false);
        } else {
            pendingCallAction = payload;
            if (instance != null) {
                instance.notifyListeners("callAction", payload, true);
            }
        }
    }

    @PluginMethod
    public void consumePendingCallAction(PluginCall call) {
        JSObject payload = pendingCallAction;
        pendingCallAction = null;
        if (payload != null) {
            call.resolve(payload);
        } else {
            call.resolve(new JSObject());
        }
    }

    @PluginMethod
    public void requestAudioPermission(PluginCall call) {
        if (getPermissionState("audio") == PermissionState.GRANTED
            || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("audio", call, "audioPermissionCallback");
    }

    @PermissionCallback
    private void audioPermissionCallback(PluginCall call) {
        boolean granted = getPermissionState("audio") == PermissionState.GRANTED
            || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void setAudioMode(PluginCall call) {
        String mode = call.getString("mode", "normal");
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            if ("in_call".equals(mode)) {
                requestVoiceAudioFocus(audioManager);
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                registerNetworkMonitor();
            } else {
                unregisterNetworkMonitor();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    audioManager.clearCommunicationDevice();
                } else {
                    try {
                        audioManager.stopBluetoothSco();
                        audioManager.setBluetoothScoOn(false);
                    } catch (Exception ignored) {}
                    audioManager.setSpeakerphoneOn(false);
                }
                audioManager.setMode(AudioManager.MODE_NORMAL);
                releaseAudioFocus();
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void setSpeakerphone(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                List<AudioDeviceInfo> devices = audioManager.getAvailableCommunicationDevices();
                AudioDeviceInfo preferred = null;
                if (enabled) {
                    for (AudioDeviceInfo dev : devices) {
                        if (dev.getType() == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
                            preferred = dev;
                            break;
                        }
                    }
                } else {
                    // Priority: Bluetooth headset -> Wired/USB headset -> Built-in earpiece
                    for (AudioDeviceInfo dev : devices) {
                        int type = dev.getType();
                        if (type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
                            || type == AudioDeviceInfo.TYPE_BLE_HEADSET) {
                            preferred = dev;
                            break;
                        }
                    }
                    if (preferred == null) {
                        for (AudioDeviceInfo dev : devices) {
                            int type = dev.getType();
                            if (type == AudioDeviceInfo.TYPE_WIRED_HEADSET
                                || type == AudioDeviceInfo.TYPE_USB_HEADSET) {
                                preferred = dev;
                                break;
                            }
                        }
                    }
                    if (preferred == null) {
                        for (AudioDeviceInfo dev : devices) {
                            if (dev.getType() == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE) {
                                preferred = dev;
                                break;
                            }
                        }
                    }
                }
                if (preferred != null) {
                    audioManager.setCommunicationDevice(preferred);
                } else {
                    audioManager.clearCommunicationDevice();
                }
            } else {
                if (enabled) {
                    try {
                        audioManager.stopBluetoothSco();
                        audioManager.setBluetoothScoOn(false);
                    } catch (Exception ignored) {}
                    audioManager.setSpeakerphoneOn(true);
                } else {
                    audioManager.setSpeakerphoneOn(false);
                    if (audioManager.isBluetoothScoAvailableOffCall()) {
                        try {
                            audioManager.startBluetoothSco();
                            audioManager.setBluetoothScoOn(true);
                        } catch (Exception ignored) {}
                    }
                }
            }
        }
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void startCallService(PluginCall call) {
        String callId = call.getString("callId", "");
        String callerName = call.getString("callerName", "MelaChow Call");
        String status = call.getString("status", "ringing");
        Long connectedAtObj = call.getLong("connectedAtMs", 0L);
        long connectedAtMs = connectedAtObj != null ? connectedAtObj : 0L;
        Context ctx = getContext();

        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            call.resolve();
            return;
        }

        Intent serviceIntent = new Intent(ctx, VoiceCallForegroundService.class);
        serviceIntent.setAction(VoiceCallForegroundService.ACTION_START);
        serviceIntent.putExtra("callId", callId);
        serviceIntent.putExtra("callerName", callerName);
        serviceIntent.putExtra("status", status);
        serviceIntent.putExtra("connectedAtMs", connectedAtMs);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(serviceIntent);
            } else {
                ctx.startService(serviceIntent);
            }
            registerNetworkMonitor();
        } catch (Exception ex) {
            Log.w(TAG, "Failed to start call foreground service: " + ex.getMessage());
        }
        call.resolve();
    }

    @PluginMethod
    public void updateCallService(PluginCall call) {
        String callId = call.getString("callId", "");
        String callerName = call.getString("callerName", "MelaChow Call");
        String status = call.getString("status", "connected");
        Long connectedAtObj = call.getLong("connectedAtMs", 0L);
        long connectedAtMs = connectedAtObj != null ? connectedAtObj : 0L;
        Context ctx = getContext();

        Intent serviceIntent = new Intent(ctx, VoiceCallForegroundService.class);
        serviceIntent.setAction(VoiceCallForegroundService.ACTION_UPDATE);
        serviceIntent.putExtra("callId", callId);
        serviceIntent.putExtra("callerName", callerName);
        serviceIntent.putExtra("status", status);
        serviceIntent.putExtra("connectedAtMs", connectedAtMs);
        try {
            ctx.startService(serviceIntent);
        } catch (Exception ex) {
            Log.w(TAG, "Failed to update call foreground service: " + ex.getMessage());
        }
        call.resolve();
    }

    @PluginMethod
    public void stopCallService(PluginCall call) {
        unregisterNetworkMonitor();
        Context ctx = getContext();
        try {
            ctx.stopService(new Intent(ctx, VoiceCallForegroundService.class));
        } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void dismissIncomingCallNotification(PluginCall call) {
        String callId = call.getString("callId", "");
        NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(VoiceCallFirebaseMessagingService.INCOMING_CALL_NOTIFICATION_ID);
            if (!callId.isEmpty()) {
                nm.cancel(callId.hashCode());
            }
        }
        call.resolve();
    }

    private void registerNetworkMonitor() {
        if (networkCallback != null || Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return;
        ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return;

        lastNetworkType = resolveActiveNetworkType(cm);
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(@NonNull Network network) {
                emitNetworkChange(cm, true);
            }

            @Override
            public void onCapabilitiesChanged(@NonNull Network network, @NonNull NetworkCapabilities caps) {
                String nextType = classifyCapabilities(caps);
                if (!nextType.equals(lastNetworkType)) {
                    lastNetworkType = nextType;
                    JSObject payload = new JSObject();
                    payload.put("connected", true);
                    payload.put("type", nextType);
                    notifyListeners("networkChange", payload, false);
                }
            }

            @Override
            public void onLost(@NonNull Network network) {
                emitNetworkChange(cm, false);
            }
        };
        try {
            cm.registerDefaultNetworkCallback(networkCallback);
        } catch (Exception ex) {
            Log.w(TAG, "Could not register network monitor: " + ex.getMessage());
            networkCallback = null;
        }
    }

    private void emitNetworkChange(ConnectivityManager cm, boolean connected) {
        String nextType = resolveActiveNetworkType(cm);
        lastNetworkType = nextType;
        JSObject payload = new JSObject();
        payload.put("connected", connected);
        payload.put("type", nextType);
        notifyListeners("networkChange", payload, false);
    }

    private String resolveActiveNetworkType(ConnectivityManager cm) {
        try {
            Network active = cm.getActiveNetwork();
            if (active == null) return "none";
            NetworkCapabilities caps = cm.getNetworkCapabilities(active);
            return classifyCapabilities(caps);
        } catch (Exception ignored) {
            return "unknown";
        }
    }

    private String classifyCapabilities(NetworkCapabilities caps) {
        if (caps == null) return "none";
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return "wifi";
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) return "cellular";
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return "ethernet";
        return "other";
    }

    private void unregisterNetworkMonitor() {
        if (networkCallback == null) return;
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                cm.unregisterNetworkCallback(networkCallback);
            }
        } catch (Exception ignored) {}
        networkCallback = null;
        lastNetworkType = "";
    }

    private void requestVoiceAudioFocus(AudioManager audioManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                .setAudioAttributes(attrs)
                .setOnAudioFocusChangeListener(audioFocusChangeListener)
                .setAcceptsDelayedFocusGain(false)
                .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(
                audioFocusChangeListener,
                AudioManager.STREAM_VOICE_CALL,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE
            );
        }
    }

    private void releaseAudioFocus() {
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
                audioFocusRequest = null;
            }
        } else {
            audioManager.abandonAudioFocus(audioFocusChangeListener);
        }
    }
}
