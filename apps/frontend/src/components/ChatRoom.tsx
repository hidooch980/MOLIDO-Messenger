import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext.js";
import { useSocket } from "../socket/SocketContext.js";
import { api } from "../api/client.js";
import { senderNameOf, type ChatMessage, type Room } from "../api/types.js";
import { Avatar } from "./Avatar.js";
import { Icon } from "./Icon.js";

interface ChatRoomProps {
  room: Room;
  onBack: () => void;
}

export function ChatRoom({ room, onBack }: ChatRoomProps) {
  const { t } = useTranslation(["chat", "common", "errors"]);
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistoryAndJoin() {
      const history = await api.get<ChatMessage[]>(`/api/rooms/${room.id}/messages`, { token });
      if (cancelled) return;
      setMessages([...history].reverse());

      socket?.emit("chat:join", room.id, (error?: string) => {
        if (error && !cancelled) setJoinError(error);
      });
    }

    void loadHistoryAndJoin();

    function handleIncoming(message: ChatMessage) {
      if (message.roomId !== room.id) return;
      setMessages((prev) => [...prev, message]);
    }

    socket?.on("chat:message", handleIncoming);
    return () => {
      cancelled = true;
      socket?.off("chat:message", handleIncoming);
    };
  }, [room.id, socket, token]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    socket?.emit("chat:message", { roomId: room.id, body: draft }, (error?: string) => {
      if (error) setJoinError(error);
    });
    setDraft("");
  }

  return (
    <div className="chat-room">
      <div className="chat-room-header">
        <button type="button" className="icon-button" onClick={onBack} title={t("common:back")}>
          <Icon name="back" />
        </button>
        <strong>{room.name}</strong>
      </div>
      {joinError && <p className="form-error">{t(`errors:${joinError}` as never)}</p>}
      <ul className="chat-messages" ref={listRef}>
        {messages.map((m) => {
          if (m.systemEventCode) {
            return (
              <li key={m.id} className="chat-system-message">
                <em>{t(`system.${m.systemEventCode}`, { name: m.systemEventName })}</em>
              </li>
            );
          }
          const isOwn = senderNameOf(m) === user?.username;
          return (
            <li key={m.id} className={`chat-message-row${isOwn ? " own" : ""}`}>
              <Avatar name={senderNameOf(m) ?? "?"} size={26} />
              <div className="chat-message">
                <span className="chat-sender">{senderNameOf(m)}</span>
                <span className="chat-body">{m.body}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <form onSubmit={handleSend} className="chat-input-form">
        <input placeholder={t("message_placeholder")} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="icon-button primary" title={t("send")}>
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
