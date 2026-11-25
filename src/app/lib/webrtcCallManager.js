"use client";

import { nativeVoiceCall } from "./nativeVoiceCall";

const DEFAULT_STUN = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

/**
 * Reusable WebRTC audio-only peer connection manager.
 * Handles microphone acquisition, ICE server setup, SDP offer/answer,
 * ICE candidate buffering, reconnect recovery, ringtone synthesis, and cleanup.
 */
export class WebRTCCallManager {
  constructor({ onLocalIceCandidate, onConnectionStateChange, onError }) {
    this.onLocalIceCandidate = onLocalIceCandidate;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onError = onError;

    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.remoteAudioEl = null;
    this.pendingIceCandidates = [];
    this.remoteDescriptionSet = false;
    this.isMuted = false;
    this.isSpeakerOn = false;
    this.ringtoneTimer = null;
    this.audioCtx = null;
  }

  async acquireMicrophone() {
    const perm = await nativeVoiceCall.requestAudioPermission();
    if (perm && perm.granted === false) {
      const err = new Error("Microphone permission is required to make voice calls.");
      err.code = "MIC_PERMISSION_DENIED";
      throw err;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const err = new Error("Voice calling is not supported on this device or browser.");
      err.code = "MIC_UNAVAILABLE";
      throw err;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
      return this.localStream;
    } catch (rawErr) {
      const denied =
        rawErr?.name === "NotAllowedError" || rawErr?.name === "PermissionDeniedError";
      const err = new Error(
        denied
          ? "Microphone permission was denied. Please enable microphone access in your device settings."
          : "Unable to access your microphone. Please check if another app is using it."
      );
      err.code = denied ? "MIC_PERMISSION_DENIED" : "MIC_UNAVAILABLE";
      throw err;
    }
  }

  async initializePeerConnection(iceServers) {
    this.stopRingtone();
    await nativeVoiceCall.setAudioMode("in_call");
    await nativeVoiceCall.setSpeakerphone(this.isSpeakerOn);

    if (!this.localStream) {
      await this.acquireMicrophone();
    }

    const config = {
      iceServers: Array.isArray(iceServers) && iceServers.length > 0 ? iceServers : DEFAULT_STUN,
      iceCandidatePoolSize: 4,
    };

    const pc = new RTCPeerConnection(config);
    this.pc = pc;
    this.remoteDescriptionSet = false;
    this.pendingIceCandidates = [];

    // Add local audio tracks
    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream);
    });

    // Attach remote audio stream
    this.remoteStream = new MediaStream();
    pc.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream) {
        this.attachRemoteAudio(stream);
      } else if (event.track) {
        this.remoteStream.addTrack(event.track);
        this.attachRemoteAudio(this.remoteStream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onLocalIceCandidate?.(event.candidate.toJSON ? event.candidate.toJSON() : event.candidate);
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === "connected" || state === "completed") {
        this.onConnectionStateChange?.("connected");
      } else if (state === "disconnected") {
        this.onConnectionStateChange?.("reconnecting");
      } else if (state === "failed") {
        this.onConnectionStateChange?.("failed");
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        this.onConnectionStateChange?.("connected");
      } else if (state === "connecting") {
        this.onConnectionStateChange?.("connecting");
      } else if (state === "failed") {
        this.onConnectionStateChange?.("failed");
      }
    };

    return pc;
  }

  attachRemoteAudio(stream) {
    if (typeof document === "undefined") return;
    if (!this.remoteAudioEl) {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.playsInline = true;
      audio.style.display = "none";
      document.body.appendChild(audio);
      this.remoteAudioEl = audio;
    }
    this.remoteAudioEl.srcObject = stream;
    this.remoteAudioEl.play().catch(() => {});
  }

  async createOffer() {
    if (!this.pc) throw new Error("Peer connection not initialized");
    const offer = await this.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async handleOfferAndCreateAnswer(remoteSdp) {
    if (!this.pc) throw new Error("Peer connection not initialized");
    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
    this.remoteDescriptionSet = true;
    await this.flushBufferedIceCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(remoteSdp) {
    if (!this.pc) return;
    if (this.pc.signalingState === "stable") return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
    this.remoteDescriptionSet = true;
    await this.flushBufferedIceCandidates();
  }

  async addIceCandidate(candidate) {
    if (!candidate) return;
    if (!this.pc || !this.remoteDescriptionSet) {
      this.pendingIceCandidates.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("[WebRTC] Ignored ICE candidate error:", err?.message);
    }
  }

  async flushBufferedIceCandidates() {
    if (!this.pc || !this.remoteDescriptionSet) return;
    const queued = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    for (const candidate of queued) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[WebRTC] Buffered ICE candidate error:", err?.message);
      }
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
    }
    return this.isMuted;
  }

  async setSpeakerphone(enabled) {
    this.isSpeakerOn = Boolean(enabled);
    await nativeVoiceCall.setSpeakerphone(this.isSpeakerOn);
    return this.isSpeakerOn;
  }

  startRingtone(mode = "outgoing") {
    this.stopRingtone();
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const playToneBurst = () => {
      try {
        if (!this.audioCtx) this.audioCtx = new AudioContextClass();
        if (this.audioCtx.state === "suspended") this.audioCtx.resume().catch(() => {});
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(mode === "incoming" ? 520 : 440, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(mode === "incoming" ? 0.14 : 0.06, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.9);
      } catch {
        // Autoplay restriction before user interaction is non-fatal
      }
    };

    playToneBurst();
    this.ringtoneTimer = setInterval(playToneBurst, mode === "incoming" ? 1800 : 2800);
  }

  stopRingtone() {
    if (this.ringtoneTimer) {
      clearInterval(this.ringtoneTimer);
      this.ringtoneTimer = null;
    }
  }

  cleanup() {
    this.stopRingtone();
    this.pendingIceCandidates = [];
    this.remoteDescriptionSet = false;
    this.isMuted = false;
    this.isSpeakerOn = false;

    if (this.pc) {
      try {
        this.pc.ontrack = null;
        this.pc.onicecandidate = null;
        this.pc.oniceconnectionstatechange = null;
        this.pc.onconnectionstatechange = null;
        this.pc.close();
      } catch {}
      this.pc = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.localStream = null;
    }

    if (this.remoteAudioEl) {
      try {
        this.remoteAudioEl.pause();
        this.remoteAudioEl.srcObject = null;
        this.remoteAudioEl.remove();
      } catch {}
      this.remoteAudioEl = null;
    }

    this.remoteStream = null;
    nativeVoiceCall.setSpeakerphone(false).catch(() => {});
    nativeVoiceCall.setAudioMode("normal").catch(() => {});
    nativeVoiceCall.stopCallService().catch(() => {});
  }
}
