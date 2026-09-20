import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  const socketRef = useRef<Socket | null>(null);
  const [presenceOverrides, setPresenceOverrides] = useState<Record<string, PresenceState>>({});
  const [lastNudge, setLastNudge] = useState<NudgeEvent | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setPresenceOverrides({});
      return;
    }

    const socket = io(API_BASE, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("presence:update", ({ userId, state }: { userId: string; state: PresenceState }) => {
      setPresenceOverrides((prev) => ({ ...prev, [userId]: state }));
    });

    socket.on("friend:nudge", ({ fromUserId, fromUsername }: { fromUserId: string; fromUsername: string }) => {
      setLastNudge({ fromUserId, fromUsername, receivedAt: Date.now() });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: socketRef.current,
      presenceOverrides,
      lastNudge,
      dismissNudge: () => setLastNudge(null),
    }),
    // socketRef.current intentionally read fresh on every render triggered by
    // the effect above (connect/disconnect); presenceOverrides/lastNudge
    // drive the memo's identity otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presenceOverrides, lastNudge, token]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
