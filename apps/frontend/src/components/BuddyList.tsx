import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext.js";
import { useSocket } from "../socket/SocketContext.js";
import { useCall } from "../call/CallContext.js";
import { api, ApiError } from "../api/client.js";
import type { Friend, FriendRequest } from "../api/types.js";
import { PresenceDot } from "./PresenceDot.js";
import { Avatar } from "./Avatar.js";
import { Icon } from "./Icon.js";

export function BuddyList() {
  const { t } = useTranslation(["friends", "errors", "common", "calls"]);
  const { token } = useAuth();
  const { socket, presenceOverrides } = useSocket();
  const { startCall, state: callState } = useCall();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [addUsername, setAddUsername] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [friendList, requestList] = await Promise.all([
      api.get<Friend[]>("/api/friends", { token }),
      api.get<FriendRequest[]>("/api/friends/requests", { token }),
    ]);
    setFriends(friendList);
    setRequests(requestList);
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleAddFriend(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    try {
      await api.post("/api/friends/requests", { username: addUsername }, { token });
      setAddUsername("");
      setNotice(t("request_sent"));
    } catch (err) {
      setNotice(err instanceof ApiError ? t(`errors:${err.code}` as never) : t("errors:UNKNOWN_ERROR" as never));
    }
  }

  async function handleAccept(id: string) {
    await api.post(`/api/friends/requests/${id}/accept`, undefined, { token });
    await refresh();
  }

  async function handleDecline(id: string) {
    await api.post(`/api/friends/requests/${id}/decline`, undefined, { token });
    await refresh();
  }

  function handleNudge(friendId: string) {
    socket?.emit("friend:nudge", friendId);
  }

  function handleCall(friendId: string, friendUsername: string, video: boolean) {
    void startCall(friendId, friendUsername, video);
  }

  const friendsWithLivePresence = friends.map((f) => ({
    ...f,
    presence: presenceOverrides[f.id] ?? f.presence,
  }));

  return (
    <div className="buddy-list">
      <h2>{t("title")}</h2>

      <form onSubmit={handleAddFriend} className="add-friend-form">
        <input
          placeholder={t("add_placeholder")}
          value={addUsername}
          onChange={(e) => setAddUsername(e.target.value)}
          required
        />
        <button type="submit" className="icon-button" title={t("add")}>
          <Icon name="add" />
        </button>
      </form>
      {notice && <p className="form-notice">{notice}</p>}

      {requests.length > 0 && (
        <section>
          <h3>{t("requests")}</h3>
          <ul className="friend-requests">
            {requests.map((r) => (
              <li key={r.id}>
                <Avatar name={r.requester.username} size={28} />
                <span>{r.requester.username}</span>
                <button type="button" className="icon-button accept" onClick={() => handleAccept(r.id)} title={t("accept")}>
                  <Icon name="check" />
                </button>
                <button type="button" className="icon-button decline" onClick={() => handleDecline(r.id)} title={t("decline")}>
                  <Icon name="close" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="chat-list">
        {friendsWithLivePresence.map((f) => (
          <li key={f.friendshipId} className="chat-list-row">
            <span className="avatar-badge">
              <Avatar name={f.username} size={38} />
              <span className="badge-dot">
                <PresenceDot state={f.presence} />
              </span>
            </span>
            <div className="chat-list-info">
              <span className="chat-list-name">{f.username}</span>
              <span className="chat-list-preview">{f.statusMessage || t(`presence.${f.presence}`)}</span>
            </div>
            <div className="chat-list-actions">
              <button
                type="button"
                className="nudge-button"
                disabled={f.presence === "offline" || callState !== "idle"}
                onClick={() => handleCall(f.id, f.username, false)}
                title={t("calls:voice_call")}
              >
                <Icon name="phone" />
              </button>
              <button
                type="button"
                className="nudge-button"
                disabled={f.presence === "offline" || callState !== "idle"}
                onClick={() => handleCall(f.id, f.username, true)}
                title={t("calls:video_call")}
              >
                <Icon name="video" />
              </button>
              <button
                type="button"
                className="nudge-button"
                disabled={f.presence === "offline"}
                onClick={() => handleNudge(f.id)}
                title={t("nudge")}
              >
                <Icon name="bell" />
              </button>
            </div>
          </li>
        ))}
        {friendsWithLivePresence.length === 0 && <li className="empty-state">{t("empty")}</li>}
      </ul>
    </div>
  );
}
