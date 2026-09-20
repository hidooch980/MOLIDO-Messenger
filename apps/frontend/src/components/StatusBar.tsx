import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { MANUAL_PRESENCE_STATES, type ManualPresenceState } from "@molido/i18n";
import { useAuth } from "../auth/AuthContext.js";
import { useSocket } from "../socket/SocketContext.js";
import { api } from "../api/client.js";
import { Avatar } from "./Avatar.js";
import { Icon } from "./Icon.js";

export function StatusBar() {
  const { t } = useTranslation(["friends", "common", "auth"]);
  const { user, token, logout } = useAuth();
  const { socket } = useSocket();
  const [statusMessage, setStatusMessage] = useState(user?.username ?? "");
  const [presence, setPresence] = useState<ManualPresenceState>("online");

  function handlePresenceChange(next: ManualPresenceState) {
    setPresence(next);
    socket?.emit("presence:set", next);
  }

  async function handleStatusSubmit(e: FormEvent) {
    e.preventDefault();
    await api.patch("/api/me", { statusMessage }, { token });
  }

  return (
    <div className="status-bar">
      <div className="status-identity">
        <span className="status-identity-left">
          {user && <Avatar name={user.username} size={30} />}
          <strong>{user?.username}</strong>
        </span>
        <select value={presence} onChange={(e) => handlePresenceChange(e.target.value as ManualPresenceState)}>
          {MANUAL_PRESENCE_STATES.map((state) => (
            <option key={state} value={state}>
              {t(`presence.${state}`)}
            </option>
          ))}
        </select>
      </div>
      <form onSubmit={handleStatusSubmit} className="status-message-form">
        <input
          placeholder={t("status_placeholder")}
          value={statusMessage}
          onChange={(e) => setStatusMessage(e.target.value)}
          maxLength={140}
        />
        <button type="submit">{t("common:save")}</button>
      </form>
      <button type="button" className="link" onClick={logout}>
        <Icon name="logout" size={13} /> {t("auth:logout")}
      </button>
    </div>
  );
}
