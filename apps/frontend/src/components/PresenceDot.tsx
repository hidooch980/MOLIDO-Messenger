import { useTranslation } from "react-i18next";
import type { PresenceState } from "../api/types.js";

const COLOR_BY_STATE: Record<PresenceState, string> = {
  online: "#2fbf4f",
  away: "#e0a800",
  busy: "#d9363e",
  offline: "#9aa0a6",
};

export function PresenceDot({ state }: { state: PresenceState }) {
  const { t } = useTranslation("friends");
  return (
    <span
      title={t(`presence.${state}`)}
      aria-label={t(`presence.${state}`)}
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: COLOR_BY_STATE[state],
        marginInlineEnd: 6,
        flexShrink: 0,
      }}
    />
  );
}
