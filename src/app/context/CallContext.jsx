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
    if (endReason?.includes("disconnected")) return "Call ended due to internet disconnection.";
    return "Call connection failed. Please check your internet connection.";
  }
  if (endReason === "order_delivered") return "Call ended because the order was delivered.";
  if (endReason === "order_cancelled") return "Call ended because the order was cancelled.";
  if (endReason === "rider_reassigned") return "Call ended because a new rider was assigned.";
  return "Call ended.";
}

export function CallProvider({ children }) {
  const { socket, isConnected } = useSocket();
  const [callSession, setCallSession] = useState(null);
  const [callState, setCallState] = useState("idle"); // idle | initiating | ringing | incoming | connecting | connected | reconnecting | ended
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const sessionRef = useRef(null);
  const stateRef = useRef("idle");
  const rtcRef = useRef(null);
  const durationTimerRef = useRef(null);
  const offerSentRef = useRef(false);

  useEffect(() => {
    sessionRef.current = callSession;
  }, [callSession]);

  useEffect(() => {
    stateRef.current = callState;
  }, [callState]);

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    stopDurationTimer();
    setDurationSeconds(0);
    durationTimerRef.current = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
  }, [stopDurationTimer]);

  const resetCall = useCallback(
    (toastMessage = null) => {
      stopDurationTimer();
      offerSentRef.current = false;
      if (rtcRef.current) {
        rtcRef.current.cleanup();
        rtcRef.current = null;
      }
      if (sessionRef.current?.callId) {
        nativeVoiceCall.dismissIncomingCallNotification(sessionRef.current.callId);
      }
      setCallSession(null);
      setCallState("idle");
      setIsMuted(false);
      setIsSpeakerOn(false);
      setIsMinimized(false);
      setDurationSeconds(0);
      if (toastMessage) {
        toast(toastMessage, { duration: 4000 });
      }
    },
    [stopDurationTimer]
  );

  const fetchIceServers = useCallback(async () => {
    try {
      const res = await customerApi.get("/calls/ice-servers");
      return res.data?.iceServers || [];
    } catch {
      return [];
    }
  }, []);

  const ensureRtcManager = useCallback(
    (activeCallId) => {
      if (rtcRef.current) return rtcRef.current;
      const manager = new WebRTCCallManager({
        onLocalIceCandidate: (candidate) => {
          const activeSocket = socketService.socket;
          if (activeSocket?.connected && activeCallId) {
            activeSocket.emit("call:ice-candidate", {
              callId: activeCallId,
              candidate,
            });
          }
        },
        onConnectionStateChange: (next) => {
          if (next === "connected") {
            setCallState("connected");
            startDurationTimer();
            const activeSocket = socketService.socket;
            if (activeSocket?.connected && activeCallId) {
              activeSocket.emit("call:connected", { callId: activeCallId });
            }
          } else if (next === "reconnecting") {
            setCallState("reconnecting");
          } else if (next === "failed") {
            const activeSocket = socketService.socket;
            if (activeSocket?.connected && activeCallId) {
              activeSocket.emit("call:failed", {
                callId: activeCallId,
                reason: "ice_failed",
              });
            }
            resetCall("Call connection failed. Please check your internet connection.");
          }
        },
        onError: (err) => {
          toast.error(err?.message || "Audio connection error.");
        },
      });
      rtcRef.current = manager;
      return manager;
    },
    [resetCall, startDurationTimer]
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
        const manager = ensureRtcManager(null);
        await manager.acquireMicrophone();

        const res = await customerApi.post("/calls/initiate", {
          orderId,
          vendorOrderId,
          deliveryId,
        });
        const session = res.data?.session;
        if (!session?.callId) {
          throw new Error("Unable to start call session.");
        }

        // Bind callId to RTC manager callbacks
        manager.onLocalIceCandidate = (candidate) => {
          const activeSocket = socketService.socket;
          if (activeSocket?.connected) {
            activeSocket.emit("call:ice-candidate", {
              callId: session.callId,
              candidate,
            });
          }
        };

        setCallSession(session);
        setCallState("ringing");
        manager.startRingtone("outgoing");
        await nativeVoiceCall.startCallService({
          callId: session.callId,
          callerName: session.peerName || session.riderName || "Delivery Rider",
        });
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to call rider right now.";
        resetCall();
        toast.error(message);
      }
    },
    [ensureRtcManager, resetCall]
  );

  const acceptIncomingCall = useCallback(
    async (overrideCallId = null) => {
      const targetCallId = overrideCallId || sessionRef.current?.callId;
      if (!targetCallId) return;

      try {
        setCallState("connecting");
        setIsMinimized(false);
        await nativeVoiceCall.dismissIncomingCallNotification(targetCallId);

        const manager = ensureRtcManager(targetCallId);
        manager.stopRingtone();
        await manager.acquireMicrophone();

        const iceServers = await fetchIceServers();
        await manager.initializePeerConnection(iceServers);

        const res = await customerApi.post(`/calls/${targetCallId}/accept`);
        const session = res.data?.session;
        if (session) {
          setCallSession(session);
          await nativeVoiceCall.startCallService({
            callId: session.callId,
            callerName: session.peerName || session.riderName || "Delivery Rider",
          });
        }
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to accept call.";
        resetCall();
        toast.error(message);
      }
    },
    [ensureRtcManager, fetchIceServers, resetCall]
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
    if (targetCallId) {
      const activeSocket = socketService.socket;
      if (activeSocket?.connected) {
        activeSocket.emit("call:end", { callId: targetCallId });
      }
      customerApi.post(`/calls/${targetCallId}/end`).catch(() => {});
    }
    resetCall();
  }, [resetCall]);

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

  // Reconcile any active/pending call (crucial when app wakes from background/terminated push)
  const syncActiveCall = useCallback(
    async (pendingAction = null) => {
      if (!TokenManager.getToken("user")) return;
      try {
        if (pendingAction?.action === "reject" && pendingAction.callId) {
          await rejectIncomingCall(pendingAction.callId);
          return;
        }

        const res = await customerApi.get("/calls/active");
        const active = res.data?.session;
        if (!active) return;

        if (active.status === "ringing" && active.calleeRole === "customer") {
          setCallSession(active);
          if (pendingAction?.action === "accept" && pendingAction.callId === active.callId) {
            await acceptIncomingCall(active.callId);
          } else if (stateRef.current === "idle") {
            setCallState("incoming");
            const manager = ensureRtcManager(active.callId);
            manager.startRingtone("incoming");
          }
        }
      } catch {
        // Non-fatal
      }
    },
    [acceptIncomingCall, ensureRtcManager, rejectIncomingCall]
  );

  // Wire Socket.IO signaling events onto the existing MelaChow socket
  useEffect(() => {
    const activeSocket = socket || socketService.socket;
    if (!activeSocket) return;

    const handleIncoming = (session) => {
      if (!session?.callId) return;
      if (stateRef.current !== "idle" && sessionRef.current?.callId !== session.callId) {
        return;
      }
      setCallSession(session);
      setCallState("incoming");
      setIsMinimized(false);
      const manager = ensureRtcManager(session.callId);
      manager.startRingtone("incoming");
    };

    const handleAccepted = async (session) => {
      if (!session?.callId || sessionRef.current?.callId !== session.callId) return;
      setCallSession(session);
      setCallState("connecting");

      // Caller creates and sends the SDP offer once callee accepts
      if (session.callerRole === "customer" && !offerSentRef.current) {
        offerSentRef.current = true;
        try {
          const manager = ensureRtcManager(session.callId);
          manager.stopRingtone();
          const iceServers = await fetchIceServers();
          await manager.initializePeerConnection(iceServers);
          const offer = await manager.createOffer();
          activeSocket.emit("call:offer", { callId: session.callId, sdp: offer });
        } catch (err) {
          activeSocket.emit("call:failed", {
            callId: session.callId,
            reason: "offer_failed",
          });
          resetCall(err?.message || "Failed to connect audio.");
        }
      }
    };

    const handleOffer = async ({ callId, sdp }) => {
      if (!callId || sessionRef.current?.callId !== callId) return;
      try {
        const manager = ensureRtcManager(callId);
        if (!manager.pc) {
          const iceServers = await fetchIceServers();
          await manager.initializePeerConnection(iceServers);
        }
        const answer = await manager.handleOfferAndCreateAnswer(sdp);
        activeSocket.emit("call:answer", { callId, sdp: answer });
      } catch {
        activeSocket.emit("call:failed", { callId, reason: "answer_failed" });
        resetCall("Could not establish audio connection.");
      }
    };

    const handleAnswer = async ({ callId, sdp }) => {
      if (!callId || sessionRef.current?.callId !== callId) return;
      try {
        await rtcRef.current?.handleAnswer(sdp);
      } catch {
        activeSocket.emit("call:failed", { callId, reason: "set_answer_failed" });
        resetCall("Could not establish audio connection.");
      }
    };

    const handleIceCandidate = async ({ callId, candidate }) => {
      if (!callId || sessionRef.current?.callId !== callId) return;
      await rtcRef.current?.addIceCandidate(candidate);
    };

    const handleConnected = (session) => {
      if (!session?.callId || sessionRef.current?.callId !== session.callId) return;
      setCallSession(session);
      if (stateRef.current !== "connected") {
        setCallState("connected");
        startDurationTimer();
      }
    };

    const handleTerminal = (session) => {
      if (!session?.callId) return;
      if (sessionRef.current?.callId && sessionRef.current.callId !== session.callId) return;
      if (TERMINAL_STATUSES.has(session.status)) {
        resetCall(friendlyEndMessage(session.status, session.endReason));
      }
    };

    activeSocket.on("call:incoming", handleIncoming);
    activeSocket.on("call:accepted", handleAccepted);
    activeSocket.on("call:offer", handleOffer);
    activeSocket.on("call:answer", handleAnswer);
    activeSocket.on("call:ice-candidate", handleIceCandidate);
    activeSocket.on("call:connected", handleConnected);
    activeSocket.on("call:rejected", handleTerminal);
    activeSocket.on("call:missed", handleTerminal);
    activeSocket.on("call:cancelled", handleTerminal);
    activeSocket.on("call:ended", handleTerminal);
    activeSocket.on("call:failed", handleTerminal);

    return () => {
      activeSocket.off("call:incoming", handleIncoming);
      activeSocket.off("call:accepted", handleAccepted);
      activeSocket.off("call:offer", handleOffer);
      activeSocket.off("call:answer", handleAnswer);
      activeSocket.off("call:ice-candidate", handleIceCandidate);
      activeSocket.off("call:connected", handleConnected);
      activeSocket.off("call:rejected", handleTerminal);
      activeSocket.off("call:missed", handleTerminal);
      activeSocket.off("call:cancelled", handleTerminal);
      activeSocket.off("call:ended", handleTerminal);
      activeSocket.off("call:failed", handleTerminal);
    };
  }, [socket, isConnected, ensureRtcManager, fetchIceServers, resetCall, startDurationTimer]);

  // Listen to native Android call notification actions (cold-start & warm-start) and foreground push events
  useEffect(() => {
    let actionHandle = null;
    let appStateHandle = null;

    const handleNativeAction = (actionPayload) => {
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

    window.addEventListener("melachow:call-push", handlePushEvent);

    const initNative = async () => {
      const pending = await nativeVoiceCall.consumePendingCallAction();
      if (pending) {
        await syncActiveCall(pending);
      } else {
        await syncActiveCall();
      }
      actionHandle = await nativeVoiceCall.addCallActionListener(handleNativeAction);

      if (Capacitor.isNativePlatform()) {
        appStateHandle = await App.addListener("appStateChange", async ({ isActive }) => {
          if (isActive) {
            const nextPending = await nativeVoiceCall.consumePendingCallAction();
            await syncActiveCall(nextPending);
          }
        });
      }
    };

    void initNative();

    return () => {
      window.removeEventListener("melachow:call-push", handlePushEvent);
      actionHandle?.remove?.();
      appStateHandle?.remove?.();
    };
  }, [resetCall, syncActiveCall]);

  const value = useMemo(
    () => ({
      callSession,
      callState,
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
