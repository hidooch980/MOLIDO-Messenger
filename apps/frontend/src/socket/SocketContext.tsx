import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.js";
import type { PresenceState } from "../api/types.js";

export interface NudgeEvent {
  fromUserId: string;
  fromUsername: string;
  receivedAt: number;
}

interface SocketContextValue {
  socket: Socket | null;
  /** Live overrides for friends whose presence changed since the buddy list was last fetched. */
  presenceOverrides: Record<string, PresenceState>;
  lastNudge: NudgeEvent | null;
  dismissNudge: () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  presenceOverrides: {},
  lastNudge: null,
  dismissNudge: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  // A ref here (instead of state) is the bug this fixed: consumers only
  // saw a connected socket once *something else* forced SocketProvider to
  // re-render (e.g. a presence event) — buddy-list nudges happened to work
  // by coincidence, but a brand-new room with no prior socket traffic never
  // got that incidental re-render, so `socket` stayed null and chat:join /
  // chat:message silently no-opped. State guarantees a render on connect.
  const [socket, setSocket] = useState<Socket | null>(null);
  const [presenceOverrides, setPresenceOverrides] = useState<Record<string, PresenceState>>({});
  const [lastNudge, setLastNudge] = useState<NudgeEvent | null>(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setPresenceOverrides({});
      return;
    }

    const nextSocket = io(API_BASE, { auth: { token }, transports: ["websocket"] });

    nextSocket.on("presence:update", ({ userId, state }: { userId: string; state: PresenceState }) => {
      setPresenceOverrides((prev) => ({ ...prev, [userId]: state }));
    });

    nextSocket.on("friend:nudge", ({ fromUserId, fromUsername }: { fromUserId: string; fromUsername: string }) => {
      setLastNudge({ fromUserId, fromUsername, receivedAt: Date.now() });
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [token]);

  const value = useMemo<SocketContextValue>(
    () => ({ socket, presenceOverrides, lastNudge, dismissNudge: () => setLastNudge(null) }),
    [socket, presenceOverrides, lastNudge]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
