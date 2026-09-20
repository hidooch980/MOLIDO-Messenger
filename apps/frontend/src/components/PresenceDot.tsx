import { useTranslation } from "react-i18next";
import type { PresenceState } from "../api/types.js";

const COLOR_BY_STATE: Record<PresenceState, string> = {
  online: "#22c55e",
  away: "#eab308",
  busy: "#f43f5e",
  offline: "#5f6b8a",
};

export function PresenceDot({ state }: { state: PresenceState }) {
  const { t } = useTranslation("friends");
  const color = COLOR_BY_STATE[state];
  return (
    <span
      title={t(`presence.${state}`)}
      aria-label={t(`presence.${state}`)}
      style={{
        display: "inline-block",
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: color,
        boxShadow: state === "offline" ? "none" : `0 0 6px ${color}`,
        marginInlineEnd: 6,
        flexShrink: 0,
      }}
    />
  );
}
