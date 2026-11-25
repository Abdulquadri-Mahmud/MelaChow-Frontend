"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

const VoiceCallNative = Capacitor.isNativePlatform()
  ? registerPlugin("VoiceCall")
  : null;

export const nativeVoiceCall = {
  isNative() {
    return Capacitor.isNativePlatform();
  },

  async requestAudioPermission() {
    if (!VoiceCallNative) return { granted: true };
    try {
      return await VoiceCallNative.requestAudioPermission();
    } catch (err) {
      console.warn("[VoiceCall] Native permission request failed:", err?.message || err);
      return { granted: false };
    }
  },

  async setAudioMode(mode = "normal") {
    if (!VoiceCallNative) return;
    try {
      await VoiceCallNative.setAudioMode({ mode });
    } catch (err) {
      console.warn("[VoiceCall] setAudioMode failed:", err?.message || err);
    }
  },

  async setSpeakerphone(enabled) {
    if (!VoiceCallNative) return { enabled: Boolean(enabled) };
    try {
      return await VoiceCallNative.setSpeakerphone({ enabled: Boolean(enabled) });
    } catch (err) {
      console.warn("[VoiceCall] setSpeakerphone failed:", err?.message || err);
      return { enabled: Boolean(enabled) };
    }
  },

  async startCallService({ callId, callerName }) {
    if (!VoiceCallNative) return;
    try {
      await VoiceCallNative.startCallService({
        callId: String(callId || ""),
        callerName: String(callerName || "MelaChow Call"),
      });
    } catch (err) {
      console.warn("[VoiceCall] startCallService failed:", err?.message || err);
    }
  },

  async stopCallService() {
    if (!VoiceCallNative) return;
    try {
      await VoiceCallNative.stopCallService();
    } catch (err) {
      console.warn("[VoiceCall] stopCallService failed:", err?.message || err);
    }
  },

  async dismissIncomingCallNotification(callId) {
    if (!VoiceCallNative) return;
    try {
      await VoiceCallNative.dismissIncomingCallNotification({
        callId: String(callId || ""),
      });
    } catch (err) {
      console.warn("[VoiceCall] dismissIncomingCallNotification failed:", err?.message || err);
    }
  },

  async consumePendingCallAction() {
    if (!VoiceCallNative) return null;
    try {
      const result = await VoiceCallNative.consumePendingCallAction();
      return result && result.callId ? result : null;
    } catch {
      return null;
    }
  },

  async addCallActionListener(callback) {
    if (!VoiceCallNative) return { remove: () => {} };
    try {
      return await VoiceCallNative.addListener("callAction", callback);
    } catch {
      return { remove: () => {} };
    }
  },
};
