import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ROOM_CATEGORIES, type RoomCategory } from "@molido/i18n";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiError } from "../api/client.js";
import type { Room } from "../api/types.js";
import { Avatar } from "./Avatar.js";
import { Icon } from "./Icon.js";

type Tab = "mine" | "lobby";

interface RoomsPanelProps {
  selectedRoomId: string | null;
  onSelectRoom: (room: Room) => void;
}

function previewText(room: Room, t: (key: string, opts?: Record<string, unknown>) => string): string | null {
  const last = room.lastMessage;
  if (!last) return null;
  if (last.systemEventCode) return t(`chat:system.${last.systemEventCode}`, { name: last.systemEventName });
  return last.body;
}

export function RoomsPanel({ selectedRoomId, onSelectRoom }: RoomsPanelProps) {
  const { t } = useTranslation(["groups", "common", "errors", "chat"]);
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("mine");
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [category, setCategory] = useState<RoomCategory | "">("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refreshMine = useCallback(async () => {
    setMyRooms(await api.get<Room[]>("/api/rooms", { token }));
  }, [token]);

  const refreshLobby = useCallback(async () => {
    const query = category ? `?category=${category}` : "";
    setPublicRooms(await api.get<Room[]>(`/api/rooms/public${query}`, { token }));
  }, [token, category]);

  useEffect(() => {
    void refreshMine();
  }, [refreshMine]);

  useEffect(() => {
    if (tab === "lobby") void refreshLobby();
  }, [tab, refreshLobby]);

  // A selection made elsewhere (e.g. just created/joined) can change this
  // list's membership/last-message — refresh whenever it changes.
  useEffect(() => {
    void refreshMine();
  }, [selectedRoomId, refreshMine]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const room = await api.post<Room>("/api/rooms", { name }, { token });
      setName("");
      await refreshMine();
      onSelectRoom(room);
    } catch (err) {
      setError(err instanceof ApiError ? t(`errors:${err.code}` as never) : t("errors:UNKNOWN_ERROR" as never));
    }
  }

  async function handleJoin(room: Room) {
    setError(null);
    try {
      await api.post(`/api/rooms/${room.id}/join`, undefined, { token });
      await refreshMine();
      onSelectRoom(room);
    } catch (err) {
      setError(err instanceof ApiError ? t(`errors:${err.code}` as never) : t("errors:UNKNOWN_ERROR" as never));
    }
  }

  return (
    <div className="rooms-panel">
      <div className="rooms-tabs">
        <button type="button" className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>
          {t("my_rooms")}
        </button>
        <button type="button" className={tab === "lobby" ? "active" : ""} onClick={() => setTab("lobby")}>
          {t("lobby")}
        </button>
      </div>

      <form onSubmit={handleCreate} className="create-room-form">
        <input placeholder={t("name_placeholder")} value={name} onChange={(e) => setName(e.target.value)} required />
        <button type="submit" className="icon-button primary round" title={t("create")}>
          <Icon name="add" />
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}

      {tab === "mine" && (
        <ul className="chat-list">
          {myRooms.map((room) => (
            <li
              key={room.id}
              className={`chat-list-row${room.id === selectedRoomId ? " selected" : ""}`}
              onClick={() => onSelectRoom(room)}
            >
              <Avatar name={room.name} size={38} />
              <div className="chat-list-info">
                <div className="chat-list-line">
                  <span className="chat-list-name">{room.name}</span>
                </div>
                <div className="chat-list-preview">{previewText(room, t) ?? t("no_messages_yet")}</div>
              </div>
            </li>
          ))}
          {myRooms.length === 0 && <li className="empty-state">{t("no_rooms")}</li>}
        </ul>
      )}

      {tab === "lobby" && (
        <>
          <select value={category} onChange={(e) => setCategory(e.target.value as RoomCategory | "")}>
            <option value="">{t("all_categories")}</option>
            {ROOM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </select>
          <ul className="chat-list">
            {publicRooms.map((room) => (
              <li key={room.id} className="chat-list-row">
                <Avatar name={room.name} size={38} />
                <div className="chat-list-info">
                  <span className="chat-list-name">{room.name}</span>
                  <span className="chat-list-preview">
                    {t(`category.${room.category}`)} · {t("member_count", { count: room.memberCount ?? 0 })}
                  </span>
                </div>
                <button type="button" className="icon-button" onClick={() => handleJoin(room)} title={t("join")}>
                  <Icon name="add" />
                </button>
              </li>
            ))}
            {publicRooms.length === 0 && <li className="empty-state">{t("no_rooms")}</li>}
          </ul>
        </>
      )}
    </div>
  );
}
