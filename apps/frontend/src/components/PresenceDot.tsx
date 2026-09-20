import { useTranslation } from "react-i18next";
import type { PresenceState } from "../api/types.js";

const COLOR_BY_STATE: Record<PresenceState, string> = {
  online: "#2fbf4f",
  away: "#e0a800",
  busy: "#d9364a",
  offline: "#9a94b8",
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
        marginInlineEnd: 8,
        flexShrink: 0,
      }}
    />
  );
}
