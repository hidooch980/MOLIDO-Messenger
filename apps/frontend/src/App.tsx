import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./components/LanguageSwitcher.js";

export default function App() {
  const { t } = useTranslation(["common", "chat"]);

  return (
    <main style={{ maxWidth: 480, marginInline: "auto", paddingInline: "1rem" }}>
      <h1>{t("common:app_name")}</h1>
      <LanguageSwitcher />
      <p style={{ marginBlockStart: "1rem" }}>
        <input placeholder={t("chat:message_placeholder")} style={{ width: "100%" }} />
      </p>
      <button>{t("chat:send")}</button>
    </main>
  );
}
