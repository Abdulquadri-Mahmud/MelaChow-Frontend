"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronDown,
  Bike,
  Wifi,
} from "lucide-react";
import { useCall } from "@/app/context/CallContext";

function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function statusLabel(callState, durationSeconds, hasConnectedOnce) {
  switch (callState) {
    case "initiating":
      return "Connecting to rider...";
    case "ringing":
      return "Ringing...";
    case "incoming":
      return "Incoming In-App Call";
    case "connecting":
      return "Connecting audio...";
    case "reconnecting":
      return hasConnectedOnce
        ? `Reconnecting... • ${formatDuration(durationSeconds)}`
        : "Reconnecting...";
    case "connected":
      return formatDuration(durationSeconds);
    default:
      return "";
  }
}

export default function CallOverlay() {
  const {
    callSession,
    callState,
    connectionQuality,
    hasConnectedOnce,
    isActionBusy,
    isInCall,
    isMuted,
    isSpeakerOn,
    isMinimized,
    durationSeconds,
    setIsMinimized,
    acceptIncomingCall,
    rejectIncomingCall,
    endActiveCall,
    toggleMute,
    toggleSpeaker,
  } = useCall();

  if (!isInCall) return null;

  const peerName = callSession?.peerName || callSession?.riderName || "Delivery Rider";
  const peerAvatar = callSession?.peerAvatar || callSession?.riderAvatar || null;
  const orderCode = callSession?.orderCode || null;
  const isIncoming = callState === "incoming";
  const showPoorConnection = callState === "connected" && connectionQuality === "poor";

  // Minimized floating bar during active call so customer can still view order tracking
  if (isMinimized && !isIncoming) {
    return (
      <div
        className="fixed left-4 right-4 flex items-center justify-between rounded-2xl border border-[#FF6B00]/40 px-4 py-3 text-white shadow-2xl"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 12px)",
          zIndex: 99999,
          backgroundColor: "#4A1E0A",
          color: "#ffffff",
        }}
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 text-left flex-1 min-w-0"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B00] animate-pulse">
            <Phone size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{peerName}</p>
            <p
              className={`text-xs tabular-nums ${
                callState === "reconnecting" || showPoorConnection
                  ? "text-amber-300"
                  : "text-[#FFA500]"
              }`}
            >
              {statusLabel(callState, durationSeconds, hasConnectedOnce)}
              {showPoorConnection ? " • Poor connection" : ""}
            </p>
          </div>
        </button>
        <div className="ml-2 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            className={`flex h-10 w-10 items-center justify-center rounded-full active:scale-95 transition-transform ${
              isMuted ? "bg-white text-[#4A1E0A]" : "bg-white/15 text-white"
            }`}
          >
            {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
          </button>
          <button
            type="button"
            onClick={endActiveCall}
            aria-label="End call"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white active:scale-95 transition-transform"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 flex flex-col justify-between px-6 text-white"
        style={{
          zIndex: 99999,
          background: "linear-gradient(180deg, #4A1E0A 0%, #3A1607 55%, #1F0B03 100%)",
          color: "#ffffff",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
        }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          {!isIncoming ? (
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize call"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronDown size={22} />
            </button>
          ) : (
            <div className="w-11" />
          )}

          <div
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              callState === "reconnecting" || showPoorConnection
                ? "bg-amber-500/20 text-amber-300"
                : "bg-white/10 text-[#FFA500]"
            }`}
          >
            <Wifi size={13} />
            <span>
              {callState === "reconnecting"
                ? "Reconnecting..."
                : showPoorConnection
                  ? "Poor connection"
                  : "MelaChow In-App Call"}
            </span>
          </div>

          <div className="w-11" />
        </div>

        {/* Center Identity & Status */}
        <div className="flex flex-col items-center text-center my-auto">
          <div className="relative mb-6">
            {(callState === "ringing" || callState === "incoming" || callState === "initiating") && (
              <>
                <span className="absolute -inset-4 rounded-full bg-[#FF6B00]/25 animate-ping" />
                <span className="absolute -inset-2 rounded-full bg-[#FFA500]/20 animate-pulse" />
              </>
            )}
            <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[#FF6B00] bg-[#FF6B00]/20 shadow-2xl">
              {peerAvatar ? (
                <img
                  src={peerAvatar}
                  alt={peerName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Bike size={48} className="text-[#FFA500]" />
              )}
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">{peerName}</h2>
          {orderCode && (
            <p className="mt-1 text-xs font-medium uppercase tracking-widest text-white/60">
              Order #{orderCode}
            </p>
          )}
          <p
            className={`mt-3 text-base font-medium tabular-nums ${
              callState === "reconnecting" ? "text-amber-300" : "text-[#FFA500]"
            }`}
          >
            {statusLabel(callState, durationSeconds, hasConnectedOnce)}
          </p>
          {callState === "connected" && (
            <div className="mt-3 flex items-end justify-center gap-1 h-4" aria-hidden="true">
              <span className="w-1 rounded-full bg-[#FFA500] animate-pulse" style={{ height: isMuted ? "4px" : "10px" }} />
              <span className="w-1 rounded-full bg-[#FF6B00] animate-pulse" style={{ height: isMuted ? "4px" : "16px", animationDelay: "120ms" }} />
              <span className="w-1 rounded-full bg-[#FFA500] animate-pulse" style={{ height: isMuted ? "4px" : "12px", animationDelay: "240ms" }} />
              <span className="w-1 rounded-full bg-[#FF6B00] animate-pulse" style={{ height: isMuted ? "4px" : "8px", animationDelay: "360ms" }} />
            </div>
          )}
          <p className="mt-2 text-xs text-white/55">
            {callState === "reconnecting"
              ? "Connection interrupted • Attempting to restore audio"
              : isMuted && callState === "connected"
                ? "Microphone muted"
                : "Encrypted in-app voice • Phone number stays private"}
          </p>
        </div>

        {/* Bottom Controls */}
        <div className="w-full max-w-sm mx-auto">
          {isIncoming ? (
            <div className="flex items-center justify-around py-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={isActionBusy}
                  onClick={() => rejectIncomingCall()}
                  aria-label="Decline call"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-600/30 active:scale-95 transition-transform disabled:opacity-60"
                >
                  <PhoneOff size={28} />
                </button>
                <span className="text-xs font-medium text-white/80">Decline</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={isActionBusy}
                  onClick={() => acceptIncomingCall()}
                  aria-label="Accept call"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform disabled:opacity-60"
                >
                  <Phone size={28} />
                </button>
                <span className="text-xs font-medium text-white/80">Accept</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                    className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                      isMuted
                        ? "bg-white text-[#4A1E0A]"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <span className="text-xs text-white/80">{isMuted ? "Unmute" : "Mute"}</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSpeaker}
                    aria-label={isSpeakerOn ? "Turn off speaker" : "Turn on speaker"}
                    className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                      isSpeakerOn
                        ? "bg-[#FF6B00] text-white"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                  </button>
                  <span className="text-xs text-white/80">Speaker</span>
                </div>
              </div>

              <button
                type="button"
                onClick={endActiveCall}
                aria-label="End call"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-600/40 active:scale-95 transition-transform"
              >
                <PhoneOff size={28} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
