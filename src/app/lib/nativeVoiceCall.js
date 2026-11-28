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

  async startCallService({ callId, callerName, status = "ringing", connectedAtMs = 0 }) {
    if (!VoiceCallNative) return;
    try {
      await VoiceCallNative.startCallService({
        callId: String(callId || ""),
        callerName: String(callerName || "MelaChow Call"),
        status: String(status || "ringing"),
        connectedAtMs: Number(connectedAtMs) || 0,
      });
    } catch (err) {
      console.warn("[VoiceCall] startCallService failed:", err?.message || err);
    }
  },

  async updateCallService({ callId, callerName, status = "connected", connectedAtMs = 0 }) {
    if (!VoiceCallNative) return;
    try {
      if (typeof VoiceCallNative.updateCallService === "function") {
        await VoiceCallNative.updateCallService({
          callId: String(callId || ""),
          callerName: String(callerName || "MelaChow Call"),
          status: String(status || "connected"),
          connectedAtMs: Number(connectedAtMs) || 0,
        });
      } else {
        await VoiceCallNative.startCallService({
          callId: String(callId || ""),
          callerName: String(callerName || "MelaChow Call"),
          status: String(status || "connected"),
          connectedAtMs: Number(connectedAtMs) || 0,
        });
      }
    } catch (err) {
      console.warn("[VoiceCall] updateCallService failed:", err?.message || err);
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

  async addAudioFocusListener(callback) {
    if (!VoiceCallNative) return { remove: () => {} };
    try {
      return await VoiceCallNative.addListener("audioFocusChange", callback);
    } catch {
      return { remove: () => {} };
    }
  },

  async addNetworkChangeListener(callback) {
    if (!VoiceCallNative) return { remove: () => {} };
    try {
      return await VoiceCallNative.addListener("networkChange", callback);
    } catch {
      return { remove: () => {} };
    }
  },
};
