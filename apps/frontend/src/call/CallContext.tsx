import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useSocket } from "../socket/SocketContext.js";

export type CallState = "idle" | "outgoing" | "incoming" | "active";

export interface CallPeer {
  userId: string;
  username: string;
  video: boolean;
}

interface CallContextValue {
  state: CallState;
  peer: CallPeer | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  error: string | null;
  /** The other party's name for the last call, kept around after `cleanup()` clears `peer` so an error message can still say who. */
  lastPeerUsername: string | null;
  startCall: (userId: string, username: string, video: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

// A free public STUN server (no TURN) is enough to negotiate two peers on
// the same network/open NAT — real cross-network reliability needs TURN,
// tracked as a follow-up in RISK_REGISTER.md.
const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function CallProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [state, setState] = useState<CallState>("idle");
  const [peer, setPeer] = useState<CallPeer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPeerUsername, setLastPeerUsername] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const peerRef = useRef<CallPeer | null>(null);

  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    // Captured here, not read from `peer` at render time — `peer` is about
    // to be cleared below, but a decline/unsupported message rendered
    // right after still needs to say whose call it was.
    setLastPeerUsername(peerRef.current?.username ?? null);
    setPeer(null);
    setState("idle");
  }, [localStream]);

  const createPeerConnection = useCallback(
    (toUserId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("call:ice-candidate", { toUserId, candidate: event.candidate.toJSON() });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0] ?? null);
      };

      pcRef.current = pc;
      return pc;
    },
    [socket]
  );

  const flushPendingCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const candidate of pendingCandidatesRef.current) {
      await pc.addIceCandidate(candidate).catch(() => {});
    }
    pendingCandidatesRef.current = [];
  }, []);

  const startCall = useCallback(
    async (userId: string, username: string, video: boolean) => {
      setError(null);
      setPeer({ userId, username, video });
      setState("outgoing");
      socket?.emit("call:invite", { toUserId: userId, video });
    },
    [socket]
  );

  const beginLocalMedia = useCallback(async (video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
      setLocalStream(stream);
      return stream;
    } catch {
      setError("unsupported");
      return null;
    }
  }, []);

  const acceptCall = useCallback(async () => {
    const current = peerRef.current;
    if (!current) return;

    const stream = await beginLocalMedia(current.video);
    if (!stream) {
      cleanup();
      return;
    }

    const pc = createPeerConnection(current.userId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    socket?.emit("call:accept", { toUserId: current.userId });
    setState("active");
  }, [beginLocalMedia, cleanup, createPeerConnection, socket]);

  const declineCall = useCallback(() => {
    const current = peerRef.current;
    if (current) socket?.emit("call:decline", { toUserId: current.userId });
    cleanup();
  }, [cleanup, socket]);

  const endCall = useCallback(() => {
    const current = peerRef.current;
    if (current) socket?.emit("call:end", { toUserId: current.userId });
    cleanup();
  }, [cleanup, socket]);

  useEffect(() => {
    if (!socket) return;

    async function handleIncoming({ fromUserId, fromUsername, video }: { fromUserId: string; fromUsername: string; video: boolean }) {
      // Busy: silently decline a second incoming call rather than dropping the active one.
      if (state !== "idle") {
        socket?.emit("call:decline", { toUserId: fromUserId });
        return;
      }
      setPeer({ userId: fromUserId, username: fromUsername, video });
      setState("incoming");
    }

    async function handleAccepted({ fromUserId }: { fromUserId: string }) {
      const current = peerRef.current;
      if (!current || current.userId !== fromUserId) return;

      const stream = await beginLocalMedia(current.video);
      if (!stream) {
        cleanup();
        return;
      }

      const pc = createPeerConnection(current.userId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit("call:offer", { toUserId: current.userId, sdp: offer });
      setState("active");
    }

    function handleDeclined() {
      setError("declined");
      cleanup();
    }

    function handleEnded() {
      cleanup();
    }

    async function handleOffer({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      await flushPendingCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit("call:answer", { toUserId: fromUserId, sdp: answer });
    }

    async function handleAnswer({ sdp }: { sdp: RTCSessionDescriptionInit }) {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      await flushPendingCandidates();
    }

    async function handleIceCandidate({ candidate }: { candidate: RTCIceCandidateInit }) {
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      await pc.addIceCandidate(candidate).catch(() => {});
    }

    socket.on("call:incoming", handleIncoming);
    socket.on("call:accepted", handleAccepted);
    socket.on("call:declined", handleDeclined);
    socket.on("call:ended", handleEnded);
    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice-candidate", handleIceCandidate);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:accepted", handleAccepted);
      socket.off("call:declined", handleDeclined);
      socket.off("call:ended", handleEnded);
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice-candidate", handleIceCandidate);
    };
  }, [socket, state, beginLocalMedia, cleanup, createPeerConnection, flushPendingCandidates]);

  const value: CallContextValue = {
    state,
    peer,
    localStream,
    remoteStream,
    error,
    lastPeerUsername,
    startCall,
    acceptCall,
    declineCall,
    endCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}
