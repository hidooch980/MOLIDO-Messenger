import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ROOM_CATEGORIES, type RoomCategory } from "@molido/i18n";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiError } from "../api/client.js";
import type { Room } from "../api/types.js";
import { ChatRoom } from "./ChatRoom.js";
import { Icon } from "./Icon.js";

type Tab = "mine" | "lobby";

// Distinct per-category dot colors, matching the reference's room list
// where each room's dot color differs — a purely presentational mapping,
// not a data model change.
const CATEGORY_DOT_COLOR: Record<string, string> = {
  general: "#3b5bdb",
  sports: "#2fbf4f",
  music: "#d9364a",
  movies: "#9c27b0",
  gaming: "#e0a800",
  tech: "#00acc1",
  dating: "#e91e8c",
};

export function RoomsPanel() {
  const { t } = useTranslation(["groups", "common", "errors"]);
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("mine");
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [category, setCategory] = useState<RoomCategory | "">("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
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

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const room = await api.post<Room>("/api/rooms", { name }, { token });
      setName("");
      await refreshMine();
      setSelectedRoom(room);
    } catch (err) {
      setError(err instanceof ApiError ? t(`errors:${err.code}` as never) : t("errors:UNKNOWN_ERROR" as never));
    }
  }

  async function handleJoin(room: Room) {
    setError(null);
    try {
      await api.post(`/api/rooms/${room.id}/join`, undefined, { token });
      await refreshMine();
      setSelectedRoom(room);
    } catch (err) {
      setError(err instanceof ApiError ? t(`errors:${err.code}` as never) : t("errors:UNKNOWN_ERROR" as never));
    }
  }

  if (selectedRoom) {
    // Member counts (and, later, unread state) can have changed while the
    // user was in the chat — e.g. someone else joined — so refresh the
    // list behind the scenes instead of showing it stale on return.
    return (
      <ChatRoom
        room={selectedRoom}
        onBack={() => {
          setSelectedRoom(null);
          void refreshMine();
          if (tab === "lobby") void refreshLobby();
        }}
      />
    );
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
        <button type="submit" className="icon-button" title={t("create")}>
          <Icon name="add" />
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}

      {tab === "mine" && (
        <>
          <div className="buddy-group-header">
            {t("my_rooms")} ({myRooms.length})
          </div>
          <ul className="room-list">
            {myRooms.map((room) => (
              <li key={room.id} className="classic-row" onClick={() => setSelectedRoom(room)}>
                <span className="room-dot" style={{ background: CATEGORY_DOT_COLOR[room.category] }} />
                <span className="room-name">{room.name}</span>
                <span className="room-count">{room.memberCount ?? 0}</span>
              </li>
            ))}
            {myRooms.length === 0 && <li className="empty-state">{t("no_rooms")}</li>}
          </ul>
        </>
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
          <ul className="room-list">
            {publicRooms.map((room) => (
              <li key={room.id} className="classic-row">
                <span className="room-dot" style={{ background: CATEGORY_DOT_COLOR[room.category] }} />
                <div className="room-info">
                  <span className="room-name">{room.name}</span>
                  <span className="room-meta">
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
