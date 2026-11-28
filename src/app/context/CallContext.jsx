"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import customerApi from "@/app/lib/customerApi";
import socketService from "@/app/lib/socketService";
import { useSocket } from "@/app/context/SocketContext";
import { TokenManager } from "@/app/lib/auth-token";
import { WebRTCCallManager } from "@/app/lib/webrtcCallManager";
import { nativeVoiceCall } from "@/app/lib/nativeVoiceCall";

const CallContext = createContext(null);

const TERMINAL_STATUSES = new Set(["rejected", "missed", "ended", "failed", "cancelled"]);

function friendlyEndMessage(status, endReason) {
  if (status === "rejected") return "Rider declined the call.";
  if (status === "missed") return "Rider did not answer. Please try again shortly.";
  if (status === "cancelled") return "Call cancelled.";
  if (status === "failed") {
    if (endReason === "connection_timeout") return "Could not establish audio connection.";
    if (endReason === "recovery_timeout") return "Call ended because the connection could not be restored.";
    if (endReason?.includes("disconnected")) return "Call ended due to internet disconnection.";
    return "Call connection failed. Please check your internet connection.";
  }
  if (endReason === "max_duration_reached") return "Call reached the maximum duration limit.";
  if (endReason === "order_delivered") return "Call ended because the order was delivered.";
  if (endReason === "order_cancelled") return "Call ended because the order was cancelled.";
  if (endReason === "rider_reassigned") return "Call ended because a new rider was assigned.";
  return "Call ended.";
}

export function CallProvider({ children }) {
  const { socket, isConnected } = useSocket();
  const [callSession, setCallSession] = useState(null);
  const [callState, setCallState] = useState("idle"); // idle | initiating | ringing | incoming | connecting | connected | reconnecting
  const [connectionQuality, setConnectionQuality] = useState("good"); // good | poor
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);

  const sessionRef = useRef(null);
  const stateRef = useRef("idle");
  const rtcRef = useRef(null);
  const durationTimerRef = useRef(null);
  const offerSentRef = useRef(false);
  const connectedAtMsRef = useRef(null);
  const serverClockOffsetMsRef = useRef(0);
  const callAttemptIdRef = useRef(0);
  const acceptingCallIdRef = useRef(null);
  const endingCallIdRef = useRef(null);
  const wasSocketConnectedRef = useRef(false);

  useEffect(() => {
    sessionRef.current = callSession;
  }, [callSession]);

  useEffect(() => {
    stateRef.current = callState;
  }, [callState]);

  const syncServerClockOffset = useCallback((serverNowIso) => {
    if (!serverNowIso) return;
    const serverMs = Date.parse(serverNowIso);
    if (!Number.isNaN(serverMs)) {
      serverClockOffsetMsRef.current = serverMs - Date.now();
    }
  }, []);

  const computeElapsedSeconds = useCallback(() => {
    if (connectedAtMsRef.current == null) return 0;
    const authoritativeNowMs = Date.now() + serverClockOffsetMsRef.current;
    return Math.max(0, Math.floor((authoritativeNowMs - connectedAtMsRef.current) / 1000));
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const ensureDurationTicker = useCallback(() => {
    if (connectedAtMsRef.current == null) return;
    setDurationSeconds(computeElapsedSeconds());
    if (!durationTimerRef.current) {
      durationTimerRef.current = setInterval(() => {
        if (connectedAtMsRef.current == null || stateRef.current === "idle") {
          stopDurationTimer();
          return;
        }
        setDurationSeconds(computeElapsedSeconds());
      }, 500);
    }
  }, [computeElapsedSeconds, stopDurationTimer]);

  const anchorConnectedTimestamp = useCallback(
    (connectedAtIso = null, serverNowIso = null, allowProvisional = false) => {
      syncServerClockOffset(serverNowIso);

      if (connectedAtIso) {
        const parsedMs = Date.parse(connectedAtIso);
        if (!Number.isNaN(parsedMs)) {
          connectedAtMsRef.current = parsedMs;
          setHasConnectedOnce(true);
          ensureDurationTicker();
          return parsedMs;
        }
      }

      if (allowProvisional && connectedAtMsRef.current == null) {
        const provisionalMs = Date.now() + serverClockOffsetMsRef.current;
        connectedAtMsRef.current = provisionalMs;
        setHasConnectedOnce(true);
        ensureDurationTicker();
        return provisionalMs;
      }

      if (connectedAtMsRef.current != null) {
        ensureDurationTicker();
      }
      return connectedAtMsRef.current;
    },
    [ensureDurationTicker, syncServerClockOffset]
  );

  const getLocalClockConnectedAtMs = useCallback(() => {
    if (connectedAtMsRef.current == null) return 0;
    return Math.max(0, Math.round(connectedAtMsRef.current - serverClockOffsetMsRef.current));
  }, []);

  const sendDiagnostics = useCallback((callId, event, metrics = {}) => {
    if (!callId) return;
    const activeSocket = socketService.socket;
    if (activeSocket?.connected) {
      activeSocket.emit("call:diagnostics", { callId, event, metrics });
    }
  }, []);

  const resetCall = useCallback(
    (toastMessage = null) => {
      callAttemptIdRef.current += 1;
      acceptingCallIdRef.current = null;
      endingCallIdRef.current = null;
      stopDurationTimer();
      offerSentRef.current = false;
      connectedAtMsRef.current = null;

      const prevCallId = sessionRef.current?.callId;
      if (rtcRef.current) {
        rtcRef.current.cleanup();
        rtcRef.current = null;
      }
      if (prevCallId) {
        nativeVoiceCall.dismissIncomingCallNotification(prevCallId);
      }

      sessionRef.current = null;
      stateRef.current = "idle";
      setCallSession(null);
      setCallState("idle");
      setConnectionQuality("good");
      setIsMuted(false);
      setIsSpeakerOn(false);
      setIsMinimized(false);
      setDurationSeconds(0);
      setHasConnectedOnce(false);
      setIsActionBusy(false);

      if (toastMessage) {
        toast(toastMessage, { duration: 4000 });
      }
    },
    [stopDurationTimer]
  );

  const fetchIceConfig = useCallback(async () => {
    try {
      const res = await customerApi.get("/calls/ice-servers");
      return {
        iceServers: res.data?.iceServers || [],
        hasTurn: Boolean(res.data?.hasTurn),
        iceTransportPolicy: res.data?.iceTransportPolicy || "all",
      };
    } catch {
      return { iceServers: [], hasTurn: false, iceTransportPolicy: "all" };
    }
  }, []);

  const reportConnectedToBackend = useCallback(
    async (callId, metrics = null) => {
      if (!callId) return;
      const activeSocket = socketService.socket;

      const applyServerSession = (session) => {
        if (!session?.callId || sessionRef.current?.callId !== session.callId) return;
        setCallSession(session);
        anchorConnectedTimestamp(session.connectedAt, session.serverNow, false);
        nativeVoiceCall.updateCallService({
          callId: session.callId,
          callerName: session.peerName || session.riderName || "Delivery Rider",
          status: "connected",
          connectedAtMs: getLocalClockConnectedAtMs(),
        });
      };

      if (activeSocket?.connected) {
        activeSocket.emit(
          "call:connected",
          { callId, diagnostics: metrics || undefined },
          (ack) => {
            if (ack?.success && ack.session) {
              applyServerSession(ack.session);
            }
          }
        );
      } else {
        try {
          const res = await customerApi.post(`/calls/${callId}/connected`, {
            diagnostics: metrics || undefined,
          });
          if (res.data?.session) {
            applyServerSession(res.data.session);
          }
        } catch {
          // Will reconcile on next socket reconnect / sync
        }
      }
    },
    [anchorConnectedTimestamp, getLocalClockConnectedAtMs]
  );

  const ensureRtcManager = useCallback(
    (isPolite = false) => {
      if (rtcRef.current) {
        rtcRef.current.setPolite(isPolite);
        return rtcRef.current;
      }

      const manager = new WebRTCCallManager({
        isPolite,
        onLocalIceCandidate: (candidate, meta) => {
          const activeCallId = sessionRef.current?.callId;
          const activeSocket = socketService.socket;
          if (activeSocket?.connected && activeCallId) {
            activeSocket.emit("call:ice-candidate", {
              callId: activeCallId,
              candidate,
              generation: meta?.generation,
            });
          }
        },
        onIceRestartOffer: async (offer, meta) => {
          const activeCallId = sessionRef.current?.callId;
          const activeSocket = socketService.socket;
          if (activeSocket?.connected && activeCallId) {
            activeSocket.emit("call:offer", {
              callId: activeCallId,
              sdp: offer,
              iceRestart: true,
              generation: meta?.generation,
            });
          }
        },
        onRequestFreshIceServers: fetchIceConfig,
        onQualityChange: (quality) => {
          setConnectionQuality(quality === "poor" ? "poor" : "good");
        },
        onAudioTrackStateChange: ({ kind, readyState }) => {
          if (kind === "local" && readyState === "live" && rtcRef.current) {
            setIsMuted(rtcRef.current.isActuallyMuted());
          }
        },
        onDiagnostic: (event, metrics) => {
          const activeCallId = sessionRef.current?.callId;
          if (
            activeCallId &&
            [
              "recovery_started",
              "ice_restart_initiated",
              "ice_restart_failed",
              "ice_recovery_succeeded",
              "ice_recovery_failed",
              "media_stall_detected",
              "local_audio_track_ended",
              "local_audio_track_recovered",
              "network_change_detected",
            ].includes(event)
          ) {
            sendDiagnostics(activeCallId, event, metrics);
          }
        },
        onConnectionStateChange: (next, detail = {}) => {
          const activeCallId = sessionRef.current?.callId;
          if (!activeCallId) return;

          if (next === "connected") {
            setCallState("connected");
            setConnectionQuality("good");
            anchorConnectedTimestamp(
              sessionRef.current?.connectedAt || null,
              sessionRef.current?.serverNow || null,
              true
            );
            void reportConnectedToBackend(activeCallId, detail?.metrics || null);

            if (detail?.recovered) {
              const activeSocket = socketService.socket;
              if (activeSocket?.connected) {
                activeSocket.emit("call:reconnecting", {
                  callId: activeCallId,
                  reconnecting: false,
                });
              }
            }
            nativeVoiceCall.updateCallService({
              callId: activeCallId,
              callerName:
                sessionRef.current?.peerName ||
                sessionRef.current?.riderName ||
                "Delivery Rider",
              status: "connected",
              connectedAtMs: getLocalClockConnectedAtMs(),
            });
          } else if (next === "reconnecting") {
            setCallState("reconnecting");
            const activeSocket = socketService.socket;
            if (activeSocket?.connected) {
              activeSocket.emit("call:reconnecting", {
                callId: activeCallId,
                reconnecting: true,
                attempt: detail?.attempt || 1,
                reason: detail?.reason || "network_interruption",
              });
            }
            nativeVoiceCall.updateCallService({
              callId: activeCallId,
              callerName:
                sessionRef.current?.peerName ||
                sessionRef.current?.riderName ||
                "Delivery Rider",
              status: "reconnecting",
              connectedAtMs: getLocalClockConnectedAtMs(),
            });
          } else if (next === "connecting") {
            if (stateRef.current !== "connected" && stateRef.current !== "reconnecting") {
              setCallState("connecting");
            }
          } else if (next === "failed") {
            const failReason = detail?.reason || "ice_failed";
            sendDiagnostics(activeCallId, "call_failed_terminal", detail?.metrics || { reason: failReason });
            const activeSocket = socketService.socket;
            if (activeSocket?.connected) {
              activeSocket.emit("call:failed", {
                callId: activeCallId,
                reason: failReason,
              });
            } else {
              customerApi
                .post(`/calls/${activeCallId}/end`, { reason: failReason })
                .catch(() => {});
            }
            resetCall(friendlyEndMessage("failed", failReason));
          }
        },
        onError: (err) => {
          toast.error(err?.message || "Audio connection error.");
        },
      });
      rtcRef.current = manager;
      return manager;
    },
    [
      anchorConnectedTimestamp,
      fetchIceConfig,
      getLocalClockConnectedAtMs,
      reportConnectedToBackend,
      resetCall,
      sendDiagnostics,
    ]
  );

  const initiateCallerOffer = useCallback(
    async (session) => {
      if (!session?.callId || offerSentRef.current) return;
      const activeSocket = socketService.socket;
      if (!activeSocket?.connected) return;

      offerSentRef.current = true;
      try {
        const manager = ensureRtcManager(false);
        manager.stopRingtone();
        const iceConfig = await fetchIceConfig();
        if (sessionRef.current?.callId !== session.callId) return;
        await manager.initializePeerConnection(iceConfig);
        if (sessionRef.current?.callId !== session.callId) return;
        const offer = await manager.createOffer();
        activeSocket.emit("call:offer", {
          callId: session.callId,
          sdp: offer,
          iceRestart: false,
          generation: 0,
        });
      } catch (err) {
        offerSentRef.current = false;
        activeSocket.emit("call:failed", {
          callId: session.callId,
          reason: "offer_failed",
        });
        resetCall(err?.message || "Failed to connect audio.");
      }
    },
    [ensureRtcManager, fetchIceConfig, resetCall]
  );

  const startCall = useCallback(
    async ({ orderId, vendorOrderId, deliveryId, peerName, peerAvatar } = {}) => {
      if (stateRef.current !== "idle") {
        toast("You already have a call in progress.");
        return;
      }

      if (!TokenManager.getToken("user")) {
        toast.error("Please sign in to call your rider.");
        return;
      }

      const attemptId = ++callAttemptIdRef.current;
      setIsActionBusy(true);
      setCallState("initiating");
      setIsMinimized(false);
      setCallSession({
        orderId,
        peerName: peerName || "Delivery Rider",
        peerAvatar: peerAvatar || null,
        callerRole: "customer",
      });

      try {
        // Request microphone permission upfront before ringing the rider
        const manager = ensureRtcManager(false);
        await manager.acquireMicrophone();
        if (callAttemptIdRef.current !== attemptId) return;

        const res = await customerApi.post("/calls/initiate", {
          orderId,
          vendorOrderId,
          deliveryId,
        });
        const session = res.data?.session;
        if (!session?.callId) {
          throw new Error("Unable to start call session.");
        }

        // If user cancelled while initiate request was in flight, end the newly created session cleanly
        if (callAttemptIdRef.current !== attemptId) {
          customerApi
            .post(`/calls/${session.callId}/end`, { reason: "cancelled_by_caller" })
            .catch(() => {});
          return;
        }

        syncServerClockOffset(session.serverNow);
        sessionRef.current = session;
        setCallSession(session);
        setCallState("ringing");
        setIsActionBusy(false);
        manager.startRingtone("outgoing");
        await nativeVoiceCall.startCallService({
          callId: session.callId,
          callerName: session.peerName || session.riderName || "Delivery Rider",
          status: "ringing",
          connectedAtMs: 0,
        });
      } catch (err) {
        if (callAttemptIdRef.current !== attemptId) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to call rider right now.";
        resetCall();
        toast.error(message);
      }
    },
    [ensureRtcManager, resetCall, syncServerClockOffset]
  );

  const acceptIncomingCall = useCallback(
    async (overrideCallId = null) => {
      const targetCallId = overrideCallId || sessionRef.current?.callId;
      if (!targetCallId) return;
      if (acceptingCallIdRef.current === targetCallId) return;
      if (stateRef.current === "connecting" || stateRef.current === "connected") return;

      acceptingCallIdRef.current = targetCallId;
      setIsActionBusy(true);

      try {
        setCallState("connecting");
        setIsMinimized(false);
        await nativeVoiceCall.dismissIncomingCallNotification(targetCallId);

        const manager = ensureRtcManager(true); // Callee is polite peer for glare handling
        manager.stopRingtone();
        await manager.acquireMicrophone();

        const iceConfig = await fetchIceConfig();
        if (acceptingCallIdRef.current !== targetCallId) return;
        await manager.initializePeerConnection(iceConfig);
        if (acceptingCallIdRef.current !== targetCallId) return;

        const res = await customerApi.post(`/calls/${targetCallId}/accept`);
        const session = res.data?.session;
        if (session) {
          syncServerClockOffset(session.serverNow);
          sessionRef.current = session;
          setCallSession(session);
          await nativeVoiceCall.startCallService({
            callId: session.callId,
            callerName: session.peerName || session.riderName || "Delivery Rider",
            status: "connecting",
            connectedAtMs: 0,
          });
        }
        setIsActionBusy(false);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to accept call.";
        resetCall();
        toast.error(message);
      }
    },
    [ensureRtcManager, fetchIceConfig, resetCall, syncServerClockOffset]
  );

  const rejectIncomingCall = useCallback(
    async (overrideCallId = null) => {
      const targetCallId = overrideCallId || sessionRef.current?.callId;
      if (targetCallId) {
        await nativeVoiceCall.dismissIncomingCallNotification(targetCallId);
        customerApi.post(`/calls/${targetCallId}/reject`).catch(() => {});
      }
      resetCall();
    },
    [resetCall]
  );

  const endActiveCall = useCallback(async () => {
    const targetCallId = sessionRef.current?.callId;
    if (targetCallId && endingCallIdRef.current === targetCallId) return;
    if (targetCallId) {
      endingCallIdRef.current = targetCallId;
      if (rtcRef.current) {
        sendDiagnostics(targetCallId, "call_ended_by_user", {
          ...rtcRef.current.getDiagnosticSummary(),
          elapsedSeconds: computeElapsedSeconds(),
        });
      }
      const activeSocket = socketService.socket;
      if (activeSocket?.connected) {
        activeSocket.emit("call:end", { callId: targetCallId });
      }
      customerApi.post(`/calls/${targetCallId}/end`).catch(() => {});
    }
    resetCall();
  }, [computeElapsedSeconds, resetCall, sendDiagnostics]);

  const toggleMute = useCallback(() => {
    if (!rtcRef.current) return;
    const next = rtcRef.current.setMuted(!isMuted);
    setIsMuted(next);
  }, [isMuted]);

  const toggleSpeaker = useCallback(async () => {
    if (!rtcRef.current) return;
    const next = await rtcRef.current.setSpeakerphone(!isSpeakerOn);
    setIsSpeakerOn(next);
  }, [isSpeakerOn]);

  // Reconcile active/pending/ended call state (app resume, cold-start push, socket reconnect)
  const syncActiveCall = useCallback(
    async (pendingAction = null) => {
      if (!TokenManager.getToken("user")) return;
      try {
        if (pendingAction?.action === "end") {
          await endActiveCall();
          return;
        }
        if (pendingAction?.action === "dismiss" && pendingAction.callId) {
          if (sessionRef.current?.callId === pendingAction.callId) {
            resetCall("Call ended.");
          }
          return;
        }
        if (pendingAction?.action === "reject" && pendingAction.callId) {
          await rejectIncomingCall(pendingAction.callId);
          return;
        }

        const currentCallId = sessionRef.current?.callId;
        let session = null;

        if (currentCallId) {
          try {
            const res = await customerApi.get(`/calls/${currentCallId}`);
            session = res.data?.session || null;
            syncServerClockOffset(res.data?.serverNow || session?.serverNow);
          } catch {
            // Fall through to /calls/active
          }
        }

        if (!session) {
          const res = await customerApi.get("/calls/active");
          session = res.data?.session || null;
          syncServerClockOffset(res.data?.serverNow || session?.serverNow);
        }

        if (!session) {
          if (currentCallId && stateRef.current !== "initiating") {
            resetCall("Call ended.");
          }
          return;
        }

        if (TERMINAL_STATUSES.has(session.status)) {
          if (currentCallId === session.callId) {
            resetCall(friendlyEndMessage(session.status, session.endReason));
          }
          return;
        }

        if (session.status === "ringing" && session.calleeRole === "customer") {
          sessionRef.current = session;
          setCallSession(session);
          if (pendingAction?.action === "accept" && pendingAction.callId === session.callId) {
            await acceptIncomingCall(session.callId);
          } else if (stateRef.current === "idle") {
            setCallState("incoming");
            const manager = ensureRtcManager(true);
            manager.startRingtone("incoming");
          }
          return;
        }

        if (currentCallId === session.callId) {
          setCallSession(session);
          if (session.status === "connecting" && session.callerRole === "customer" && !offerSentRef.current) {
            setCallState("connecting");
            await initiateCallerOffer(session);
          } else if (session.status === "connected") {
            anchorConnectedTimestamp(session.connectedAt, session.serverNow, false);
            if (rtcRef.current) {
              rtcRef.current.ensureRemoteAudioPlaying();
              rtcRef.current.triggerNetworkRecovery("session_sync");
            }
          }
        }
      } catch {
        // Non-fatal
      }
    },
    [
      acceptIncomingCall,
      anchorConnectedTimestamp,
      endActiveCall,
      ensureRtcManager,
      initiateCallerOffer,
      rejectIncomingCall,
      resetCall,
      syncServerClockOffset,
    ]
  );

  // Wire Socket.IO signaling events onto the existing MelaChow socket
  useEffect(() => {
    const activeSocket = socket || socketService.socket;
    if (!activeSocket) return;

    const handleSocketConnect = () => {
      if (wasSocketConnectedRef.current && sessionRef.current?.callId) {
        activeSocket.emit("call:sync", { callId: sessionRef.current.callId }, (ack) => {
          if (ack?.success) {
            syncServerClockOffset(ack.serverNow || ack.session?.serverNow);
            if (!ack.session || TERMINAL_STATUSES.has(ack.session.status)) {
              if (sessionRef.current?.callId) {
                resetCall(
                  ack.session
                    ? friendlyEndMessage(ack.session.status, ack.session.endReason)
                    : "Call ended."
                );
              }
            } else {
              setCallSession(ack.session);
              if (ack.session.connectedAt) {
                anchorConnectedTimestamp(ack.session.connectedAt, ack.serverNow || ack.session.serverNow, false);
              }
              if (
                ack.session.status === "connecting" &&
                ack.session.callerRole === "customer" &&
                !offerSentRef.current
              ) {
                void initiateCallerOffer(ack.session);
              } else if (rtcRef.current) {
                rtcRef.current.triggerNetworkRecovery("socket_reconnected");
              }
            }
          } else {
            void syncActiveCall();
          }
        });
      }
      wasSocketConnectedRef.current = true;
    };

    const handleIncoming = (session) => {
      if (!session?.callId) return;
      if (stateRef.current !== "idle" && sessionRef.current?.callId !== session.callId) {
        return;
      }
      syncServerClockOffset(session.serverNow);
      sessionRef.current = session;
      setCallSession(session);
      setCallState("incoming");
      setIsMinimized(false);
      const manager = ensureRtcManager(true);
      manager.startRingtone("incoming");
    };

    const handleAccepted = async (session) => {
      if (!session?.callId || sessionRef.current?.callId !== session.callId) return;
      syncServerClockOffset(session.serverNow);
      sessionRef.current = session;
      setCallSession(session);
      setCallState("connecting");

      nativeVoiceCall.updateCallService({
        callId: session.callId,
        callerName: session.peerName || session.riderName || "Delivery Rider",
        status: "connecting",
        connectedAtMs: 0,
      });

      if (session.callerRole === "customer" && !offerSentRef.current) {
        await initiateCallerOffer(session);
      }
    };

    const handleOffer = async ({ callId, sdp, iceRestart, generation }) => {
      if (!callId || sessionRef.current?.callId !== callId || !sdp) return;
      try {
        const isPolite = sessionRef.current?.calleeRole === "customer";
        const manager = ensureRtcManager(isPolite);
        if (!manager.pc) {
          const iceConfig = await fetchIceConfig();
          await manager.initializePeerConnection(iceConfig);
        }
        const answer = await manager.handleOfferAndCreateAnswer(sdp, {
          iceRestart: Boolean(iceRestart),
          generation,
        });
        if (answer) {
          activeSocket.emit("call:answer", {
            callId,
            sdp: answer,
            iceRestart: Boolean(iceRestart),
            generation,
          });
        }
      } catch {
        if (!iceRestart) {
          activeSocket.emit("call:failed", { callId, reason: "answer_failed" });
          resetCall("Could not establish audio connection.");
        }
      }
    };

    const handleAnswer = async ({ callId, sdp, iceRestart, generation }) => {
      if (!callId || sessionRef.current?.callId !== callId || !sdp) return;
      try {
        await rtcRef.current?.handleAnswer(sdp, {
          iceRestart: Boolean(iceRestart),
          generation,
        });
      } catch {
        if (!iceRestart) {
          activeSocket.emit("call:failed", { callId, reason: "set_answer_failed" });
          resetCall("Could not establish audio connection.");
        }
      }
    };

    const handleIceCandidate = async ({ callId, candidate, generation }) => {
      if (!callId || sessionRef.current?.callId !== callId || !candidate) return;
      await rtcRef.current?.addIceCandidate(candidate, { generation });
    };

    const handleConnected = (session) => {
      if (!session?.callId || sessionRef.current?.callId !== session.callId) return;
      setCallSession(session);
      anchorConnectedTimestamp(session.connectedAt, session.serverNow, false);
      if (stateRef.current !== "connected" && stateRef.current !== "reconnecting") {
        setCallState("connected");
      }
      nativeVoiceCall.updateCallService({
        callId: session.callId,
        callerName: session.peerName || session.riderName || "Delivery Rider",
        status: stateRef.current === "reconnecting" ? "reconnecting" : "connected",
        connectedAtMs: getLocalClockConnectedAtMs(),
      });
    };

    const handlePeerReconnecting = (payload) => {
      if (!payload?.callId || sessionRef.current?.callId !== payload.callId) return;
      if (payload.connectedAt) {
        anchorConnectedTimestamp(payload.connectedAt, payload.serverNow, false);
      }
      if (payload.reconnecting) {
        setCallState("reconnecting");
      } else if (rtcRef.current?._isHealthy?.()) {
        setCallState("connected");
      }
    };

    const handleTerminal = (session) => {
      if (!session?.callId) return;
      if (sessionRef.current?.callId && sessionRef.current.callId !== session.callId) return;
      if (TERMINAL_STATUSES.has(session.status)) {
        resetCall(friendlyEndMessage(session.status, session.endReason));
      }
    };

    activeSocket.on("connect", handleSocketConnect);
    activeSocket.on("call:incoming", handleIncoming);
    activeSocket.on("call:accepted", handleAccepted);
    activeSocket.on("call:offer", handleOffer);
    activeSocket.on("call:answer", handleAnswer);
    activeSocket.on("call:ice-candidate", handleIceCandidate);
    activeSocket.on("call:connected", handleConnected);
    activeSocket.on("call:reconnecting", handlePeerReconnecting);
    activeSocket.on("call:rejected", handleTerminal);
    activeSocket.on("call:missed", handleTerminal);
    activeSocket.on("call:cancelled", handleTerminal);
    activeSocket.on("call:ended", handleTerminal);
    activeSocket.on("call:failed", handleTerminal);

    if (activeSocket.connected) {
      wasSocketConnectedRef.current = true;
    }

    return () => {
      activeSocket.off("connect", handleSocketConnect);
      activeSocket.off("call:incoming", handleIncoming);
      activeSocket.off("call:accepted", handleAccepted);
      activeSocket.off("call:offer", handleOffer);
      activeSocket.off("call:answer", handleAnswer);
      activeSocket.off("call:ice-candidate", handleIceCandidate);
      activeSocket.off("call:connected", handleConnected);
      activeSocket.off("call:reconnecting", handlePeerReconnecting);
      activeSocket.off("call:rejected", handleTerminal);
      activeSocket.off("call:missed", handleTerminal);
      activeSocket.off("call:cancelled", handleTerminal);
      activeSocket.off("call:ended", handleTerminal);
      activeSocket.off("call:failed", handleTerminal);
    };
  }, [
    socket,
    isConnected,
    anchorConnectedTimestamp,
    ensureRtcManager,
    fetchIceConfig,
    getLocalClockConnectedAtMs,
    initiateCallerOffer,
    resetCall,
    syncActiveCall,
    syncServerClockOffset,
  ]);

  // Listen to native Android call notification actions, foreground/background lifecycle,
  // audio focus interruptions, and network transitions
  useEffect(() => {
    let actionHandle = null;
    let audioFocusHandle = null;
    let networkHandle = null;
    let appStateHandle = null;

    const handleNativeAction = (actionPayload) => {
      if (actionPayload?.action === "end") {
        void endActiveCall();
        return;
      }
      if (actionPayload?.callId) {
        void syncActiveCall(actionPayload);
      }
    };

    const handlePushEvent = (evt) => {
      const data = evt?.detail;
      if (!data?.type) return;
      if (data.type === "incoming_call") {
        void syncActiveCall();
      } else if (data.type === "call_cancelled" || data.type === "call_ended") {
        if (sessionRef.current?.callId === data.callId) {
          resetCall("Call ended.");
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && sessionRef.current?.callId) {
        if (connectedAtMsRef.current != null) {
          setDurationSeconds(computeElapsedSeconds());
        }
        rtcRef.current?.ensureRemoteAudioPlaying();
      }
    };

    const handleOnline = () => {
      if (sessionRef.current?.callId) {
        rtcRef.current?.triggerNetworkRecovery("browser_online");
        void syncActiveCall();
      }
    };

    window.addEventListener("melachow:call-push", handlePushEvent);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const initNative = async () => {
      const pending = await nativeVoiceCall.consumePendingCallAction();
      if (pending) {
        await syncActiveCall(pending);
      } else {
        await syncActiveCall();
      }

      actionHandle = await nativeVoiceCall.addCallActionListener(handleNativeAction);

      audioFocusHandle = await nativeVoiceCall.addAudioFocusListener(({ focus }) => {
        if (focus === "gain" && sessionRef.current?.callId && rtcRef.current) {
          void rtcRef.current.reapplyAudioRouting();
        }
      });

      networkHandle = await nativeVoiceCall.addNetworkChangeListener(({ connected, type }) => {
        if (connected && sessionRef.current?.callId) {
          rtcRef.current?.triggerNetworkRecovery(`android_network_${type || "change"}`);
        }
      });

      if (Capacitor.isNativePlatform()) {
        appStateHandle = await App.addListener("appStateChange", async ({ isActive }) => {
          if (isActive) {
            if (connectedAtMsRef.current != null) {
              setDurationSeconds(computeElapsedSeconds());
            }
            if (rtcRef.current && sessionRef.current?.callId) {
              void rtcRef.current.reapplyAudioRouting();
            }
            const nextPending = await nativeVoiceCall.consumePendingCallAction();
            await syncActiveCall(nextPending);
          }
        });
      }
    };

    void initNative();

    return () => {
      window.removeEventListener("melachow:call-push", handlePushEvent);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      actionHandle?.remove?.();
      audioFocusHandle?.remove?.();
      networkHandle?.remove?.();
      appStateHandle?.remove?.();
    };
  }, [computeElapsedSeconds, endActiveCall, resetCall, syncActiveCall]);

  const value = useMemo(
    () => ({
      callSession,
      callState,
      connectionQuality,
      hasConnectedOnce,
      isActionBusy,
      isInCall: callState !== "idle",
      isMuted,
      isSpeakerOn,
      isMinimized,
      durationSeconds,
      setIsMinimized,
      startCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endActiveCall,
      toggleMute,
      toggleSpeaker,
    }),
    [
      callSession,
      callState,
      connectionQuality,
      hasConnectedOnce,
      isActionBusy,
      isMuted,
      isSpeakerOn,
      isMinimized,
      durationSeconds,
      startCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endActiveCall,
      toggleMute,
      toggleSpeaker,
    ]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCall must be used inside a CallProvider");
  }
  return ctx;
}
