import { useTranslation } from "react-i18next";

/** Shown in the content pane when no room is selected. */
export function WelcomeHero() {
  const { t } = useTranslation("common");

  return (
    <div className="welcome-hero">
      <span className="welcome-logo" aria-hidden="true">
        M
      </span>
      <div className="welcome-title">{t("app_name")}</div>
      <div className="welcome-tagline">Connect · Share · Build</div>
    </div>
  );
}
