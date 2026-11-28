import test from "node:test";
import assert from "node:assert/strict";

// Minimal browser/WebRTC environment shims for deterministic unit testing of WebRTCCallManager
class MockMediaStreamTrack {
  constructor(kind = "audio") {
    this.kind = kind;
    this.enabled = true;
    this.readyState = "live";
    this.stopped = false;
    this.onended = null;
    this.onmute = null;
    this.onunmute = null;
  }
  stop() {
    this.stopped = true;
    this.readyState = "ended";
  }
}

class MockMediaStream {
  constructor(tracks = []) {
    this._tracks = [...tracks];
  }
  getTracks() {
    return this._tracks;
  }
  getAudioTracks() {
    return this._tracks.filter((t) => t.kind === "audio");
  }
  addTrack(track) {
    this._tracks.push(track);
  }
}

class MockRTCPeerConnection {
  constructor(config) {
    this.config = config;
    this.connectionState = "new";
    this.iceConnectionState = "new";
    this.signalingState = "stable";
    this.iceGatheringState = "new";
    this.addedTracks = [];
    this.addedCandidates = [];
    this.restartedCount = 0;
    this.configUpdates = [];
    this.closed = false;
    this._stats = [];
    this._senders = [];
  }
  addTrack(track) {
    this.addedTracks.push(track);
    const sender = {
      track,
      replaceTrack: async (nextTrack) => {
        sender.track = nextTrack;
      },
    };
    this._senders.push(sender);
    return sender;
  }
  getSenders() {
    return this._senders;
  }
  setConfiguration(nextConfig) {
    this.config = nextConfig;
    this.configUpdates.push(nextConfig);
  }
  restartIce() {
    this.restartedCount += 1;
  }
  async createOffer(opts = {}) {
    return { type: "offer", sdp: `v=0\r\n;iceRestart=${Boolean(opts.iceRestart)}` };
  }
  async createAnswer() {
    return { type: "answer", sdp: "v=0\r\n;answer" };
  }
  async setLocalDescription(desc) {
    if (desc?.type === "rollback") {
      this.signalingState = "stable";
      return;
    }
    this.localDescription = desc;
    this.signalingState = desc.type === "offer" ? "have-local-offer" : "stable";
  }
  async setRemoteDescription(desc) {
    this.remoteDescription = desc;
    this.signalingState = desc.type === "offer" ? "have-remote-offer" : "stable";
  }
  async addIceCandidate(cand) {
    this.addedCandidates.push(cand);
  }
  async getStats() {
    return new Map(this._stats.map((s) => [s.id, s]));
  }
  close() {
    this.closed = true;
    this.connectionState = "closed";
    this.iceConnectionState = "closed";
  }
}

globalThis.MediaStream = MockMediaStream;
globalThis.RTCPeerConnection = MockRTCPeerConnection;
globalThis.RTCSessionDescription = class {
  constructor(init) {
    Object.assign(this, init);
  }
};
globalThis.RTCIceCandidate = class {
  constructor(init) {
    Object.assign(this, init);
  }
};

let micCallCount = 0;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    mediaDevices: {
      getUserMedia: async () => {
        micCallCount += 1;
        return new MockMediaStream([new MockMediaStreamTrack("audio")]);
      },
    },
  },
});

const { WebRTCCallManager } = await import("../src/app/lib/webrtcCallManager.js");

test("WebRTCCallManager reuses existing live mic stream and keeps mute state synchronized", async () => {
  micCallCount = 0;
  const mgr = new WebRTCCallManager();
  await mgr.acquireMicrophone();
  await mgr.acquireMicrophone();
  assert.equal(micCallCount, 1, "should not open duplicate microphone streams");

  assert.equal(mgr.setMuted(true), true);
  assert.equal(mgr.isActuallyMuted(), true);
  assert.equal(mgr.setMuted(false), false);
  assert.equal(mgr.isActuallyMuted(), false);

  mgr.cleanup();
  mgr.cleanup(); // idempotent cleanup
});

test("WebRTCCallManager buffers remote ICE candidates until remote description is set", async () => {
  const mgr = new WebRTCCallManager({ isPolite: true });
  const pc = await mgr.initializePeerConnection([]);

  await mgr.addIceCandidate({ candidate: "cand-1", sdpMid: "0" });
  await mgr.addIceCandidate({ candidate: "cand-2", sdpMid: "0" });
  assert.equal(pc.addedCandidates.length, 0);

  const answer = await mgr.handleOfferAndCreateAnswer({ type: "offer", sdp: "v=0" });
  assert.equal(answer.type, "answer");
  assert.equal(pc.addedCandidates.length, 2);

  mgr.cleanup();
});

test("WebRTCCallManager resolves simultaneous offer glare cleanly (polite rolls back, impolite ignores)", async () => {
  const impolite = new WebRTCCallManager({ isPolite: false });
  const polite = new WebRTCCallManager({ isPolite: true });

  await impolite.initializePeerConnection([]);
  await polite.initializePeerConnection([]);

  await impolite.createOffer();
  await polite.createOffer();

  // Impolite peer ignores colliding offer
  const impoliteAnswer = await impolite.handleOfferAndCreateAnswer({ type: "offer", sdp: "remote" });
  assert.equal(impoliteAnswer, null);

  // Polite peer rolls back local offer and answers remote offer
  const politeAnswer = await polite.handleOfferAndCreateAnswer({ type: "offer", sdp: "remote" });
  assert.equal(politeAnswer.type, "answer");

  impolite.cleanup();
  polite.cleanup();
});

test("WebRTCCallManager triggers controlled ICE restart with fresh TURN credentials on failure instead of immediate teardown", async () => {
  const states = [];
  const restartOffers = [];
  let iceRefreshCount = 0;

  const mgr = new WebRTCCallManager({
    isPolite: false,
    onConnectionStateChange: (state) => states.push(state),
    onIceRestartOffer: async (offer, meta) => {
      restartOffers.push({ offer, meta });
    },
    onRequestFreshIceServers: async () => {
      iceRefreshCount += 1;
      return {
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["turn:turn.example.com:3478"], username: "fresh", credential: "cred" },
        ],
        hasTurn: true,
        iceTransportPolicy: "all",
      };
    },
  });

  const pc = await mgr.initializePeerConnection([]);
  // Simulate initial connect
  pc.iceConnectionState = "connected";
  pc.connectionState = "connected";
  pc.onconnectionstatechange();
  assert.deepEqual(states, ["connected"]);

  // Simulate sudden ICE failure (e.g. Wi-Fi -> Cellular switch)
  pc.iceConnectionState = "failed";
  pc.connectionState = "failed";
  pc.oniceconnectionstatechange();

  // Allow queued async ICE restart to settle
  await new Promise((r) => setTimeout(r, 30));

  assert.equal(states.includes("reconnecting"), true);
  assert.equal(states.includes("failed"), false, "must NOT terminate immediately on first ICE failure");
  assert.equal(iceRefreshCount, 1, "must refresh short-lived TURN credentials before ICE restart");
  assert.equal(restartOffers.length, 1, "must emit an ICE restart offer");
  assert.equal(restartOffers[0].meta.iceRestart, true);
  assert.equal(pc.configUpdates.length, 1);

  // Simulate recovery succeeding
  pc.iceConnectionState = "connected";
  pc.connectionState = "connected";
  pc.onconnectionstatechange();
  assert.equal(states[states.length - 1], "connected");

  mgr.cleanup();
});

test("WebRTCCallManager collects getStats() and detects poor quality without dropping healthy calls", async () => {
  const qualities = [];
  const mgr = new WebRTCCallManager({
    onQualityChange: (q) => qualities.push(q),
  });

  const pc = await mgr.initializePeerConnection([]);
  pc._stats = [
    { id: "in1", type: "inbound-rtp", kind: "audio", packetsReceived: 100, packetsLost: 15, bytesReceived: 16000, jitter: 0.08 },
    { id: "out1", type: "outbound-rtp", kind: "audio", packetsSent: 100 },
    { id: "pair1", type: "candidate-pair", state: "succeeded", nominated: true, currentRoundTripTime: 0.52, localCandidateId: "lc1", remoteCandidateId: "rc1" },
    { id: "lc1", type: "local-candidate", candidateType: "relay", protocol: "udp" },
    { id: "rc1", type: "remote-candidate", candidateType: "srflx", protocol: "udp" },
  ];

  await mgr._pollStats();
  assert.deepEqual(qualities, ["poor"]);
  assert.equal(mgr.lastMetrics.localCandidateType, "relay");
  assert.equal(mgr.lastMetrics.rttMs, 520);

  mgr.cleanup();
});
