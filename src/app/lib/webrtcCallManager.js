"use client";

import { nativeVoiceCall } from "./nativeVoiceCall.js";

const DEFAULT_STUN = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun.cloudflare.com:3478",
    ],
  },
];

const DISCONNECT_STABILIZE_MS = 3500;
const RECOVERY_TIMEOUT_MS = 28000;
const MAX_ICE_RESTARTS = 3;
const ICE_RESTART_BACKOFF_MS = [0, 5000, 10000];
const STATS_POLL_INTERVAL_MS = 3000;
const MEDIA_STALL_TICKS_THRESHOLD = 3; // 9 seconds of 0 inbound packets after media flowed

/**
 * Production WebRTC audio-only peer connection manager.
 * Handles microphone lifecycle, ICE/TURN configuration & refresh, Perfect Negotiation
 * glare resolution, bounded ICE restart recovery, getStats() media health monitoring,
 * ringtone synthesis, and idempotent cleanup.
 */
export class WebRTCCallManager {
  constructor({
    isPolite = false,
    onLocalIceCandidate,
    onConnectionStateChange,
    onIceRestartOffer,
    onRequestFreshIceServers,
    onQualityChange,
    onAudioTrackStateChange,
    onDiagnostic,
    onError,
  } = {}) {
    this.isPolite = Boolean(isPolite);
    this.onLocalIceCandidate = onLocalIceCandidate;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onIceRestartOffer = onIceRestartOffer;
    this.onRequestFreshIceServers = onRequestFreshIceServers;
    this.onQualityChange = onQualityChange;
    this.onAudioTrackStateChange = onAudioTrackStateChange;
    this.onDiagnostic = onDiagnostic;
    this.onError = onError;

    this.pc = null;
    this.pcGeneration = 0;
    this.iceGeneration = 0;
    this.localStream = null;
    this.remoteStream = null;
    this.remoteAudioEl = null;
    this.pendingIceCandidates = [];
    this.remoteDescriptionSet = false;
    this.isMuted = false;
    this.isSpeakerOn = false;
    this.ringtoneTimer = null;
    this.audioCtx = null;

    // Signaling serialization & glare control
    this.signalingChain = Promise.resolve();
    this.makingOffer = false;
    this.ignoreOffer = false;

    // Connection health & bounded recovery state
    this.hasConnectedOnce = false;
    this.lastReportedState = "idle";
    this.isRecovering = false;
    this.recoveryAttempts = 0;
    this.totalIceRestarts = 0;
    this.disconnectStabilizeTimer = null;
    this.recoveryRetryTimer = null;
    this.recoveryHardTimeoutTimer = null;
    this.politeRestartDelayTimer = null;
    this.latestIceMeta = { hasTurn: false, iceTransportPolicy: "all" };

    // Media statistics monitor
    this.statsTimer = null;
    this.prevStatsSnapshot = null;
    this.consecutiveStallTicks = 0;
    this.hasReceivedMediaPackets = false;
    this.lastQuality = "good";
    this.lastMetrics = null;
    this.cleanedUp = false;
  }

  setPolite(isPolite) {
    this.isPolite = Boolean(isPolite);
  }

  _emitDiagnostic(event, extra = {}) {
    if (typeof this.onDiagnostic !== "function") return;
    try {
      this.onDiagnostic(event, {
        connectionState: this.pc?.connectionState || "none",
        iceConnectionState: this.pc?.iceConnectionState || "none",
        signalingState: this.pc?.signalingState || "none",
        iceGatheringState: this.pc?.iceGatheringState || "none",
        iceRestartCount: this.totalIceRestarts,
        recoveryAttempt: this.recoveryAttempts,
        ...(this.lastMetrics || {}),
        ...extra,
      });
    } catch {
      // Never let diagnostics affect call flow
    }
  }

  _enqueueSignaling(task) {
    const run = this.signalingChain.then(task, task);
    this.signalingChain = run.catch(() => {});
    return run;
  }

  _hasLiveLocalAudioTrack() {
    if (!this.localStream) return false;
    return this.localStream
      .getAudioTracks()
      .some((track) => track.readyState === "live");
  }

  async acquireMicrophone() {
    if (this._hasLiveLocalAudioTrack()) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
      return this.localStream;
    }

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      this.localStream = stream;
      this._attachLocalTrackListeners(stream);
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
      return stream;
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

  _attachLocalTrackListeners(stream) {
    stream.getAudioTracks().forEach((track) => {
      track.onmute = () => {
        this._emitDiagnostic("local_audio_track_muted", { reason: "os_or_device" });
        this.onAudioTrackStateChange?.({
          kind: "local",
          muted: true,
          readyState: track.readyState,
        });
      };
      track.onunmute = () => {
        this._emitDiagnostic("local_audio_track_unmuted");
        this.onAudioTrackStateChange?.({
          kind: "local",
          muted: false,
          readyState: track.readyState,
        });
      };
      track.onended = () => {
        this._emitDiagnostic("local_audio_track_ended");
        this.onAudioTrackStateChange?.({
          kind: "local",
          muted: true,
          readyState: "ended",
        });
        if (!this.cleanedUp && this.pc && this.pc.connectionState !== "closed") {
          void this.recoverMicrophoneTrack();
        }
      };
    });
  }

  async recoverMicrophoneTrack() {
    if (this.cleanedUp || !this.pc || this.pc.connectionState === "closed") return false;
    try {
      const oldStream = this.localStream;
      this.localStream = null;
      const freshStream = await this.acquireMicrophone();
      const freshTrack = freshStream.getAudioTracks()[0];
      if (!freshTrack) return false;

      const audioSender = this.pc
        .getSenders()
        .find((sender) => sender.track?.kind === "audio" || !sender.track);
      if (audioSender) {
        await audioSender.replaceTrack(freshTrack);
      } else {
        this.pc.addTrack(freshTrack, freshStream);
      }
      if (oldStream) {
        oldStream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
      }
      this._emitDiagnostic("local_audio_track_recovered");
      return true;
    } catch (err) {
      this._emitDiagnostic("local_audio_track_recovery_failed", {
        reason: err?.code || err?.message || "unknown",
      });
      return false;
    }
  }

  _closePeerConnectionOnly() {
    this._clearRecoveryTimers();
    this._stopStatsMonitor();
    if (this.pc) {
      try {
        this.pc.ontrack = null;
        this.pc.onicecandidate = null;
        this.pc.oniceconnectionstatechange = null;
        this.pc.onconnectionstatechange = null;
        this.pc.onsignalingstatechange = null;
        this.pc.onicegatheringstatechange = null;
        this.pc.close();
      } catch {}
      this.pc = null;
    }
  }

  async initializePeerConnection(iceConfigOrServers) {
    this.cleanedUp = false;
    this.stopRingtone();

    // Prevent duplicate peer connections
    if (this.pc) {
      this._closePeerConnectionOnly();
    }

    await nativeVoiceCall.setAudioMode("in_call");
    await nativeVoiceCall.setSpeakerphone(this.isSpeakerOn);

    if (!this._hasLiveLocalAudioTrack()) {
      await this.acquireMicrophone();
    }

    const normalized = this._normalizeIceConfig(iceConfigOrServers);
    this.latestIceMeta = {
      hasTurn: normalized.hasTurn,
      iceTransportPolicy: normalized.iceTransportPolicy,
    };

    const config = {
      iceServers: normalized.iceServers,
      iceTransportPolicy: normalized.iceTransportPolicy,
      iceCandidatePoolSize: 4,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    };

    const generation = ++this.pcGeneration;
    this.iceGeneration = 0;
    const pc = new RTCPeerConnection(config);
    this.pc = pc;
    this.remoteDescriptionSet = false;
    this.pendingIceCandidates = [];
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.isRecovering = false;
    this.recoveryAttempts = 0;
    this.consecutiveStallTicks = 0;
    this.hasReceivedMediaPackets = false;
    this.prevStatsSnapshot = null;

    // Add local audio tracks
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
      pc.addTrack(track, this.localStream);
    });

    // Attach remote audio stream
    this.remoteStream = new MediaStream();
    pc.ontrack = (event) => {
      if (this.pcGeneration !== generation) return;
      const stream = event.streams?.[0];
      if (event.track) {
        event.track.onunmute = () => {
          this.ensureRemoteAudioPlaying();
          this.onAudioTrackStateChange?.({
            kind: "remote",
            muted: false,
            readyState: event.track.readyState,
          });
        };
        event.track.onmute = () => {
          this.onAudioTrackStateChange?.({
            kind: "remote",
            muted: true,
            readyState: event.track.readyState,
          });
        };
      }
      if (stream) {
        this.attachRemoteAudio(stream);
      } else if (event.track) {
        this.remoteStream.addTrack(event.track);
        this.attachRemoteAudio(this.remoteStream);
      }
    };

    pc.onicecandidate = (event) => {
      if (this.pcGeneration !== generation) return;
      if (event.candidate) {
        this.onLocalIceCandidate?.(
          event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
          { generation: this.iceGeneration }
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (this.pcGeneration !== generation) return;
      this._emitDiagnostic("ice_state_change");
      this._evaluateConnectionHealth("iceConnectionState");
    };

    pc.onconnectionstatechange = () => {
      if (this.pcGeneration !== generation) return;
      this._emitDiagnostic("peer_connection_state_change");
      this._evaluateConnectionHealth("connectionState");
    };

    pc.onsignalingstatechange = () => {
      if (this.pcGeneration !== generation) return;
      this._emitDiagnostic("signaling_state_change");
    };

    pc.onicegatheringstatechange = () => {
      if (this.pcGeneration !== generation) return;
      this._emitDiagnostic("ice_gathering_state_change");
    };

    this._emitDiagnostic("peer_connection_initialized", {
      hasTurn: normalized.hasTurn,
      iceTransportPolicy: normalized.iceTransportPolicy,
    });

    return pc;
  }

  _normalizeIceConfig(iceConfigOrServers) {
    if (Array.isArray(iceConfigOrServers)) {
      const iceServers =
        iceConfigOrServers.length > 0 ? iceConfigOrServers : DEFAULT_STUN;
      const hasTurn = iceServers.some((s) => {
        const urls = Array.isArray(s?.urls) ? s.urls : [s?.urls];
        return urls.some((u) => /^turns?:/i.test(String(u || "")));
      });
      return { iceServers, hasTurn, iceTransportPolicy: "all" };
    }
    const iceServers =
      Array.isArray(iceConfigOrServers?.iceServers) &&
      iceConfigOrServers.iceServers.length > 0
        ? iceConfigOrServers.iceServers
        : DEFAULT_STUN;
    const hasTurn = Boolean(iceConfigOrServers?.hasTurn);
    const iceTransportPolicy =
      hasTurn && iceConfigOrServers?.iceTransportPolicy === "relay"
        ? "relay"
        : "all";
    return { iceServers, hasTurn, iceTransportPolicy };
  }

  _isHealthy() {
    if (!this.pc) return false;
    const conn = this.pc.connectionState;
    const ice = this.pc.iceConnectionState;
    if (conn === "closed" || ice === "closed") return false;
    if (conn === "failed" || ice === "failed") return false;
    if (conn === "connected") return true;
    // Some WebViews lag connectionState behind iceConnectionState
    if ((ice === "connected" || ice === "completed") && conn !== "disconnected") {
      return true;
    }
    return false;
  }

  _evaluateConnectionHealth(trigger) {
    if (!this.pc || this.cleanedUp) return;
    const conn = this.pc.connectionState;
    const ice = this.pc.iceConnectionState;

    if (conn === "closed" || ice === "closed") {
      this._clearRecoveryTimers();
      this._stopStatsMonitor();
      return;
    }

    if (this._isHealthy()) {
      const wasRecovering = this.isRecovering;
      this._clearRecoveryTimers();
      this.isRecovering = false;
      this.recoveryAttempts = 0;
      this.consecutiveStallTicks = 0;
      this.hasConnectedOnce = true;

      this.ensureRemoteAudioPlaying();
      this._startStatsMonitor();

      if (wasRecovering) {
        this._emitDiagnostic("ice_recovery_succeeded", { reason: trigger });
      }
      if (this.lastReportedState !== "connected") {
        this.lastReportedState = "connected";
        this.onConnectionStateChange?.("connected", {
          recovered: wasRecovering,
          metrics: this.lastMetrics,
        });
      }
      return;
    }

    // Hard failure: attempt controlled ICE recovery before declaring terminal failure
    if (conn === "failed" || ice === "failed") {
      this._clearDisconnectStabilizeTimer();
      this._beginRecovery(`webrtc_${trigger}_failed`, true);
      return;
    }

    // Transient disconnect: allow brief stabilization window before disrupting call
    if (conn === "disconnected" || ice === "disconnected") {
      if (this.isRecovering) return;
      if (!this.disconnectStabilizeTimer) {
        this.disconnectStabilizeTimer = setTimeout(() => {
          this.disconnectStabilizeTimer = null;
          if (this.cleanedUp || !this.pc || this._isHealthy()) return;
          this._beginRecovery(`webrtc_${trigger}_disconnected`, false);
        }, DISCONNECT_STABILIZE_MS);
      }
      return;
    }

    if (
      (conn === "connecting" || ice === "checking") &&
      !this.hasConnectedOnce &&
      this.lastReportedState !== "connecting"
    ) {
      this.lastReportedState = "connecting";
      this.onConnectionStateChange?.("connecting", { reason: trigger });
    }
  }

  _clearDisconnectStabilizeTimer() {
    if (this.disconnectStabilizeTimer) {
      clearTimeout(this.disconnectStabilizeTimer);
      this.disconnectStabilizeTimer = null;
    }
  }

  _clearRecoveryTimers() {
    this._clearDisconnectStabilizeTimer();
    if (this.recoveryRetryTimer) {
      clearTimeout(this.recoveryRetryTimer);
      this.recoveryRetryTimer = null;
    }
    if (this.recoveryHardTimeoutTimer) {
      clearTimeout(this.recoveryHardTimeoutTimer);
      this.recoveryHardTimeoutTimer = null;
    }
    if (this.politeRestartDelayTimer) {
      clearTimeout(this.politeRestartDelayTimer);
      this.politeRestartDelayTimer = null;
    }
  }

  _beginRecovery(reason, immediate = false) {
    if (this.cleanedUp || !this.pc || this.pc.connectionState === "closed") return;

    if (!this.isRecovering) {
      this.isRecovering = true;
      this.recoveryAttempts = 0;
      this._emitDiagnostic("recovery_started", { reason });

      if (this.lastReportedState !== "reconnecting") {
        this.lastReportedState = "reconnecting";
        this.onConnectionStateChange?.("reconnecting", {
          reason,
          attempt: 1,
        });
      }

      // Hard recovery ceiling so calls never hang indefinitely in reconnecting
      this.recoveryHardTimeoutTimer = setTimeout(() => {
        this.recoveryHardTimeoutTimer = null;
        if (this.cleanedUp || !this.pc || this._isHealthy()) return;
        this._failRecovery("recovery_timeout");
      }, RECOVERY_TIMEOUT_MS);
    }

    this._scheduleNextIceRestart(reason, immediate);
  }

  _scheduleNextIceRestart(reason, immediate = false) {
    if (this.cleanedUp || !this.pc || this._isHealthy()) return;
    if (this.recoveryRetryTimer || this.politeRestartDelayTimer) return;

    if (this.recoveryAttempts >= MAX_ICE_RESTARTS) {
      // Wait for in-flight attempt until hard recovery timeout expires
      return;
    }

    const baseDelay = immediate && this.recoveryAttempts === 0
      ? 0
      : ICE_RESTART_BACKOFF_MS[
          Math.min(this.recoveryAttempts, ICE_RESTART_BACKOFF_MS.length - 1)
        ];

    // Give the impolite peer (caller) a brief head start so both peers don't collide
    const politeOffset = this.isPolite ? 2500 : 0;
    const totalDelay = baseDelay + politeOffset;

    const triggerRestart = async () => {
      this.recoveryRetryTimer = null;
      this.politeRestartDelayTimer = null;
      if (this.cleanedUp || !this.pc || this._isHealthy()) return;

      const attemptNum = ++this.recoveryAttempts;
      this.totalIceRestarts += 1;

      this.onConnectionStateChange?.("reconnecting", {
        reason,
        attempt: attemptNum,
      });

      const ok = await this.performIceRestart({
        reason,
        attempt: attemptNum,
        preferRelayFallback:
          attemptNum === MAX_ICE_RESTARTS && this.latestIceMeta.hasTurn,
      });

      if (!ok && this.recoveryAttempts < MAX_ICE_RESTARTS && !this._isHealthy()) {
        this._scheduleNextIceRestart("ice_restart_retry", false);
      } else if (
        this.recoveryAttempts < MAX_ICE_RESTARTS &&
        !this._isHealthy()
      ) {
        // Schedule follow-up check in case the restart offer doesn't converge
        this.recoveryRetryTimer = setTimeout(() => {
          this.recoveryRetryTimer = null;
          if (!this.cleanedUp && this.pc && !this._isHealthy()) {
            this._scheduleNextIceRestart("ice_restart_no_convergence", false);
          }
        }, ICE_RESTART_BACKOFF_MS[Math.min(this.recoveryAttempts, ICE_RESTART_BACKOFF_MS.length - 1)] || 6000);
      }
    };

    if (totalDelay <= 0) {
      void triggerRestart();
    } else if (this.isPolite) {
      this.politeRestartDelayTimer = setTimeout(() => void triggerRestart(), totalDelay);
    } else {
      this.recoveryRetryTimer = setTimeout(() => void triggerRestart(), totalDelay);
    }
  }

  async performIceRestart({ reason = "network_recovery", attempt = 1, preferRelayFallback = false } = {}) {
    return this._enqueueSignaling(async () => {
      if (this.cleanedUp || !this.pc || this.pc.connectionState === "closed") {
        return false;
      }
      if (this._isHealthy() && reason !== "network_switch") {
        return true;
      }
      if (this.makingOffer) {
        return false;
      }

      try {
        // Refresh short-lived TURN credentials before ICE restart so expired creds never fail recovery
        if (typeof this.onRequestFreshIceServers === "function") {
          try {
            const fresh = await this.onRequestFreshIceServers();
            if (fresh && this.pc && typeof this.pc.setConfiguration === "function") {
              const normalized = this._normalizeIceConfig(fresh);
              this.latestIceMeta = {
                hasTurn: normalized.hasTurn,
                iceTransportPolicy: normalized.iceTransportPolicy,
              };
              const policy =
                preferRelayFallback && normalized.hasTurn
                  ? "relay"
                  : normalized.iceTransportPolicy;
              this.pc.setConfiguration({
                iceServers: normalized.iceServers,
                iceTransportPolicy: policy,
                iceCandidatePoolSize: 4,
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require",
              });
            }
          } catch {
            // Proceed with existing ICE servers if refresh fails transiently
          }
        }

        if (!this.pc || this.pc.connectionState === "closed") return false;

        // Rollback unfinished local/remote offer if stuck in non-stable state
        if (this.pc.signalingState !== "stable") {
          try {
            await this.pc.setLocalDescription({ type: "rollback" });
          } catch {
            // Non-fatal; proceed if browser doesn't need rollback
          }
        }

        this.makingOffer = true;
        this.iceGeneration += 1;
        if (typeof this.pc.restartIce === "function") {
          this.pc.restartIce();
        }
        const offer = await this.pc.createOffer({
          iceRestart: true,
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await this.pc.setLocalDescription(offer);

        this._emitDiagnostic("ice_restart_initiated", {
          reason,
          attempt,
          preferRelayFallback,
        });

        await this.onIceRestartOffer?.(offer, {
          iceRestart: true,
          generation: this.iceGeneration,
          attempt,
          reason,
        });
        return true;
      } catch (err) {
        this._emitDiagnostic("ice_restart_failed", {
          reason: err?.message || "offer_error",
          attempt,
        });
        return false;
      } finally {
        this.makingOffer = false;
      }
    });
  }

  /**
   * Called by CallContext when the OS/browser reports a network switch (Wi-Fi <-> Mobile Data)
   * or connectivity restoration while a call is active.
   */
  triggerNetworkRecovery(reason = "network_change") {
    if (this.cleanedUp || !this.pc || this.pc.connectionState === "closed") return;
    this._emitDiagnostic("network_change_detected", { reason });

    // Re-ensure audio playback & check whether ICE degraded or stalled
    this.ensureRemoteAudioPlaying();

    if (!this._isHealthy()) {
      this._beginRecovery(reason, true);
    } else if (this.hasConnectedOnce) {
      // Even if connectionState hasn't flipped yet on Android network handoff,
      // check stats after 1.5s and restart ICE if media stopped flowing.
      setTimeout(async () => {
        if (this.cleanedUp || !this.pc) return;
        if (!this._isHealthy()) {
          this._beginRecovery(reason, true);
          return;
        }
        const metrics = await this._collectStatsOnce();
        if (metrics && metrics.deltaPacketsReceived === 0 && this.hasReceivedMediaPackets) {
          this._beginRecovery(`${reason}_media_stalled`, true);
        }
      }, 1500);
    }
  }

  _failRecovery(reason) {
    this._clearRecoveryTimers();
    this._stopStatsMonitor();
    this.isRecovering = false;
    this._emitDiagnostic("ice_recovery_failed", { reason });
    if (this.lastReportedState !== "failed") {
      this.lastReportedState = "failed";
      this.onConnectionStateChange?.("failed", {
        reason,
        metrics: this.lastMetrics,
      });
    }
  }

  _startStatsMonitor() {
    if (this.statsTimer || !this.pc || typeof this.pc.getStats !== "function") return;
    this.statsTimer = setInterval(() => {
      void this._pollStats();
    }, STATS_POLL_INTERVAL_MS);
  }

  _stopStatsMonitor() {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  }

  async _collectStatsOnce() {
    if (!this.pc || this.cleanedUp || typeof this.pc.getStats !== "function") {
      return null;
    }
    try {
      const report = await this.pc.getStats();
      let inboundAudio = null;
      let outboundAudio = null;
      let selectedPair = null;
      const candidates = new Map();

      report.forEach((stat) => {
        if (stat.type === "inbound-rtp" && stat.kind === "audio") {
          inboundAudio = stat;
        } else if (stat.type === "outbound-rtp" && stat.kind === "audio") {
          outboundAudio = stat;
        } else if (stat.type === "candidate-pair") {
          if (stat.nominated && stat.state === "succeeded") {
            selectedPair = stat;
          } else if (!selectedPair && stat.state === "succeeded") {
            selectedPair = stat;
          }
        } else if (stat.type === "local-candidate" || stat.type === "remote-candidate") {
          candidates.set(stat.id, stat);
        }
      });

      const packetsReceived = Number(inboundAudio?.packetsReceived || 0);
      const packetsLost = Number(inboundAudio?.packetsLost || 0);
      const bytesReceived = Number(inboundAudio?.bytesReceived || 0);
      const jitterMs = Number(inboundAudio?.jitter || 0) * 1000;
      const packetsSent = Number(outboundAudio?.packetsSent || 0);
      const rttMs =
        selectedPair?.currentRoundTripTime != null
          ? Number(selectedPair.currentRoundTripTime) * 1000
          : null;

      const localCand = selectedPair?.localCandidateId
        ? candidates.get(selectedPair.localCandidateId)
        : null;
      const remoteCand = selectedPair?.remoteCandidateId
        ? candidates.get(selectedPair.remoteCandidateId)
        : null;

      const prev = this.prevStatsSnapshot;
      const deltaPacketsReceived = prev
        ? Math.max(0, packetsReceived - prev.packetsReceived)
        : packetsReceived;
      const deltaPacketsLost = prev
        ? Math.max(0, packetsLost - prev.packetsLost)
        : 0;
      const deltaTotal = deltaPacketsReceived + deltaPacketsLost;
      const packetLossPct = deltaTotal > 0 ? (deltaPacketsLost / deltaTotal) * 100 : 0;

      this.prevStatsSnapshot = { packetsReceived, packetsLost, packetsSent };
      if (packetsReceived > 0) {
        this.hasReceivedMediaPackets = true;
      }

      const quality =
        (rttMs != null && rttMs > 400) || packetLossPct > 8 || jitterMs > 60
          ? "poor"
          : "good";

      const metrics = {
        packetsReceived,
        packetsSent,
        bytesReceived,
        deltaPacketsReceived,
        packetLossPct: Math.round(packetLossPct * 100) / 100,
        jitterMs: Math.round(jitterMs * 10) / 10,
        rttMs: rttMs != null ? Math.round(rttMs) : undefined,
        localCandidateType: localCand?.candidateType || undefined,
        remoteCandidateType: remoteCand?.candidateType || undefined,
        candidateProtocol: localCand?.protocol || undefined,
        quality,
      };
      this.lastMetrics = metrics;
      return metrics;
    } catch {
      return null;
    }
  }

  async _pollStats() {
    const metrics = await this._collectStatsOnce();
    if (!metrics || this.cleanedUp) return;

    if (metrics.quality !== this.lastQuality) {
      this.lastQuality = metrics.quality;
      this.onQualityChange?.(metrics.quality, metrics);
      this._emitDiagnostic("connection_quality_change", { quality: metrics.quality });
    }

    // Detect silent/frozen media when WebRTC still reports connected
    if (this._isHealthy() && this.hasReceivedMediaPackets) {
      if (metrics.deltaPacketsReceived === 0) {
        this.consecutiveStallTicks += 1;
        if (this.consecutiveStallTicks >= MEDIA_STALL_TICKS_THRESHOLD && !this.isRecovering) {
          this.consecutiveStallTicks = 0;
          this._emitDiagnostic("media_stall_detected");
          this._beginRecovery("media_stalled", true);
        }
      } else {
        this.consecutiveStallTicks = 0;
      }
    }
  }

  attachRemoteAudio(stream) {
    if (typeof document === "undefined") return;
    if (!this.remoteAudioEl) {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.playsInline = true;
      audio.setAttribute("playsinline", "true");
      audio.style.display = "none";
      document.body.appendChild(audio);
      this.remoteAudioEl = audio;
    }
    if (this.remoteAudioEl.srcObject !== stream) {
      this.remoteAudioEl.srcObject = stream;
    }
    this.ensureRemoteAudioPlaying();
  }

  ensureRemoteAudioPlaying() {
    if (!this.remoteAudioEl || !this.remoteAudioEl.srcObject) return;
    try {
      this.remoteAudioEl.muted = false;
      this.remoteAudioEl.volume = 1.0;
      if (this.remoteAudioEl.paused) {
        const playPromise = this.remoteAudioEl.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch((err) => {
            this._emitDiagnostic("remote_audio_play_deferred", {
              reason: err?.name || "autoplay_blocked",
            });
          });
        }
      }
    } catch {}
  }

  async createOffer({ iceRestart = false } = {}) {
    return this._enqueueSignaling(async () => {
      if (!this.pc) throw new Error("Peer connection not initialized");
      this.makingOffer = true;
      try {
        const offer = await this.pc.createOffer({
          iceRestart: Boolean(iceRestart),
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await this.pc.setLocalDescription(offer);
        return offer;
      } finally {
        this.makingOffer = false;
      }
    });
  }

  async handleOfferAndCreateAnswer(remoteSdp, meta = {}) {
    return this._enqueueSignaling(async () => {
      if (!this.pc) throw new Error("Peer connection not initialized");

      const offerCollision =
        this.makingOffer || this.pc.signalingState !== "stable";

      this.ignoreOffer = !this.isPolite && offerCollision;
      if (this.ignoreOffer) {
        this._emitDiagnostic("offer_glare_ignored", {
          iceRestart: Boolean(meta?.iceRestart),
        });
        return null;
      }

      if (offerCollision && this.pc.signalingState === "have-local-offer") {
        await this.pc.setLocalDescription({ type: "rollback" });
      }

      // Cancel pending polite restart timer since peer already sent an ICE restart offer
      if (meta?.iceRestart && this.politeRestartDelayTimer) {
        clearTimeout(this.politeRestartDelayTimer);
        this.politeRestartDelayTimer = null;
      }

      if (Number.isInteger(meta?.generation) && meta.generation > this.iceGeneration) {
        this.iceGeneration = meta.generation;
      }

      await this.pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
      this.remoteDescriptionSet = true;
      await this._flushBufferedIceCandidatesInternal();

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      return answer;
    });
  }

  async handleAnswer(remoteSdp, meta = {}) {
    return this._enqueueSignaling(async () => {
      if (!this.pc) return false;
      if (this.pc.signalingState !== "have-local-offer") {
        this._emitDiagnostic("stale_answer_ignored", {
          signalingState: this.pc.signalingState,
        });
        return false;
      }
      if (Number.isInteger(meta?.generation) && meta.generation < this.iceGeneration) {
        this._emitDiagnostic("outdated_generation_answer_ignored");
        return false;
      }
      await this.pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
      this.remoteDescriptionSet = true;
      await this._flushBufferedIceCandidatesInternal();
      return true;
    });
  }

  async addIceCandidate(candidate, meta = {}) {
    if (!candidate) return;
    return this._enqueueSignaling(async () => {
      if (this.ignoreOffer) return;
      if (
        Number.isInteger(meta?.generation) &&
        meta.generation < this.iceGeneration
      ) {
        return;
      }
      if (!this.pc || !this.remoteDescriptionSet) {
        if (this.pendingIceCandidates.length < 120) {
          this.pendingIceCandidates.push(candidate);
        }
        return;
      }
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        this._emitDiagnostic("ice_candidate_ignored", {
          reason: err?.name || "add_failed",
        });
      }
    });
  }

  async _flushBufferedIceCandidatesInternal() {
    if (!this.pc || !this.remoteDescriptionSet) return;
    const queued = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    for (const candidate of queued) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Non-fatal stale candidate
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
    return this.isActuallyMuted();
  }

  isActuallyMuted() {
    if (!this.localStream) return this.isMuted;
    const tracks = this.localStream.getAudioTracks();
    if (tracks.length === 0) return this.isMuted;
    return tracks.every((track) => !track.enabled);
  }

  async setSpeakerphone(enabled) {
    this.isSpeakerOn = Boolean(enabled);
    const res = await nativeVoiceCall.setSpeakerphone(this.isSpeakerOn);
    if (res && typeof res.enabled === "boolean") {
      this.isSpeakerOn = res.enabled;
    }
    return this.isSpeakerOn;
  }

  async reapplyAudioRouting() {
    await nativeVoiceCall.setAudioMode("in_call");
    await nativeVoiceCall.setSpeakerphone(this.isSpeakerOn);
    this.ensureRemoteAudioPlaying();
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
    }
  }

  startRingtone(mode = "outgoing") {
    this.stopRingtone();
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const playToneBurst = () => {
      try {
        if (!this.audioCtx || this.audioCtx.state === "closed") {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === "suspended") {
          this.audioCtx.resume().catch(() => {});
        }
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

  getDiagnosticSummary() {
    return {
      connectionState: this.pc?.connectionState || "closed",
      iceConnectionState: this.pc?.iceConnectionState || "closed",
      signalingState: this.pc?.signalingState || "closed",
      iceRestartCount: this.totalIceRestarts,
      ...(this.lastMetrics || {}),
    };
  }

  cleanup() {
    if (this.cleanedUp) return;
    this.cleanedUp = true;
    this.pcGeneration += 1;

    this.stopRingtone();
    this._closePeerConnectionOnly();

    if (this.audioCtx) {
      try {
        if (this.audioCtx.state !== "closed") {
          void this.audioCtx.close();
        }
      } catch {}
      this.audioCtx = null;
    }

    this.pendingIceCandidates = [];
    this.remoteDescriptionSet = false;
    this.isMuted = false;
    this.isSpeakerOn = false;
    this.isRecovering = false;
    this.recoveryAttempts = 0;
    this.hasConnectedOnce = false;
    this.lastReportedState = "idle";

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.onended = null;
          track.onmute = null;
          track.onunmute = null;
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
