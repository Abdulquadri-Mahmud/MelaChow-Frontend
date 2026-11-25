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
import android.os.Build;
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
    private static volatile VoiceCallPlugin activeInstance;
    private static volatile JSObject pendingCallAction;

    private AudioFocusRequest audioFocusRequest;

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

        pendingCallAction = payload;
        VoiceCallPlugin instance = activeInstance;
        if (instance != null) {
            instance.notifyListeners("callAction", payload, true);
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
            } else {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    audioManager.clearCommunicationDevice();
                } else {
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
                    // Prefer Bluetooth SCO if connected, otherwise built-in earpiece
                    for (AudioDeviceInfo dev : devices) {
                        if (dev.getType() == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
                            || dev.getType() == AudioDeviceInfo.TYPE_BLE_HEADSET) {
                            preferred = dev;
                            break;
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
                audioManager.setSpeakerphoneOn(enabled);
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
        Context ctx = getContext();
        Intent serviceIntent = new Intent(ctx, VoiceCallForegroundService.class);
        serviceIntent.putExtra("callId", callId);
        serviceIntent.putExtra("callerName", callerName);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(serviceIntent);
        } else {
            ctx.startService(serviceIntent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopCallService(PluginCall call) {
        Context ctx = getContext();
        ctx.stopService(new Intent(ctx, VoiceCallForegroundService.class));
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

    private void requestVoiceAudioFocus(AudioManager audioManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                .setAudioAttributes(attrs)
                .setAcceptsDelayedFocusGain(false)
                .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        }
    }

    private void releaseAudioFocus() {
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioFocusRequest = null;
        }
    }
}
