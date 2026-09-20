import { useTranslation } from "react-i18next";
import { Icon } from "./Icon.js";

export type RailView = "chats" | "contacts";

interface IconRailProps {
  view: RailView;
  onChange: (view: RailView) => void;
}

/** Only rail icons for views that actually exist — no decorative dead ends. */
export function IconRail({ view, onChange }: IconRailProps) {
  const { t } = useTranslation("common");

  return (
    <nav className="icon-rail">
      <span className="icon-rail-logo" aria-hidden="true">
        M
      </span>
      <button
        type="button"
        className={`icon-rail-button${view === "chats" ? " active" : ""}`}
        onClick={() => onChange("chats")}
        title={t("tabs.rooms")}
      >
        <Icon name="chat" />
      </button>
      <button
        type="button"
        className={`icon-rail-button${view === "contacts" ? " active" : ""}`}
        onClick={() => onChange("contacts")}
        title={t("tabs.buddies")}
      >
        <Icon name="person" />
      </button>
    </nav>
  );
}
