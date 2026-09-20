import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { MANUAL_PRESENCE_STATES, type ManualPresenceState } from "@molido/i18n";
import { useAuth } from "../auth/AuthContext.js";
import { useSocket } from "../socket/SocketContext.js";
import { api } from "../api/client.js";

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
        <strong>{user?.username}</strong>
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
        {t("auth:logout")}
      </button>
    </div>
  );
}
