import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext.js";
import { useSocket } from "../socket/SocketContext.js";
import { api, ApiError } from "../api/client.js";
import { senderNameOf, type ChatMessage, type Room } from "../api/types.js";
import { Avatar } from "./Avatar.js";
import { Icon } from "./Icon.js";

interface MessageUpdate {
  id: string;
  roomId: string;
  body: string | null;
  editedAt: string | null;
  deletedAt: string | null;
}

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
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

    function handleUpdated(update: MessageUpdate) {
      if (update.roomId !== room.id) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === update.id ? { ...m, body: update.body, editedAt: update.editedAt, deletedAt: update.deletedAt } : m))
      );
    }

    socket?.on("chat:message", handleIncoming);
    socket?.on("chat:message:updated", handleUpdated);
    return () => {
      cancelled = true;
      socket?.off("chat:message", handleIncoming);
      socket?.off("chat:message:updated", handleUpdated);
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

  function startEdit(message: ChatMessage) {
    setEditingId(message.id);
    setEditDraft(message.body ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function submitEdit(e: FormEvent, messageId: string) {
    e.preventDefault();
    if (!editDraft.trim()) return;
    try {
      await api.patch(`/api/rooms/${room.id}/messages/${messageId}`, { body: editDraft }, { token });
      cancelEdit();
    } catch (err) {
      setJoinError(err instanceof ApiError ? err.code : "UNKNOWN_ERROR");
    }
  }

  async function handleDelete(messageId: string) {
    try {
      await api.delete(`/api/rooms/${room.id}/messages/${messageId}`, { token });
    } catch (err) {
      setJoinError(err instanceof ApiError ? err.code : "UNKNOWN_ERROR");
    }
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
          const isEditing = editingId === m.id;
          return (
            <li key={m.id} className={`chat-message-row${isOwn ? " own" : ""}`}>
              <Avatar name={senderNameOf(m) ?? "?"} size={26} />
              <div className="chat-message">
                <span className="chat-sender">{senderNameOf(m)}</span>
                {m.deletedAt ? (
                  <span className="chat-body chat-body-deleted">{t("system.MESSAGE_DELETED")}</span>
                ) : isEditing ? (
                  <form onSubmit={(e) => submitEdit(e, m.id)} className="chat-edit-form">
                    <input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} autoFocus />
                    <button type="submit" className="icon-button" title={t("common:save")}>
                      <Icon name="check" />
                    </button>
                    <button type="button" className="icon-button" onClick={cancelEdit} title={t("common:cancel")}>
                      <Icon name="close" />
                    </button>
                  </form>
                ) : (
                  <span className="chat-body">
                    {m.body}
                    {m.editedAt && <em className="chat-edited-marker">({t("edited")})</em>}
                  </span>
                )}
              </div>
              {isOwn && !m.deletedAt && !isEditing && (
                <div className="chat-message-actions">
                  <button type="button" className="icon-button" onClick={() => startEdit(m)} title={t("edit")}>
                    <Icon name="edit" />
                  </button>
                  <button type="button" className="icon-button" onClick={() => handleDelete(m.id)} title={t("delete")}>
                    <Icon name="trash" />
                  </button>
                </div>
              )}
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
