import { ENABLED_LOCALES, LOCALE_REGISTRY } from "@molido/i18n";
import { useTranslation } from "react-i18next";
import { changeLocale } from "../i18n/index.js";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation("common");

  return (
    <label>
      {t("language")}:{" "}
      <select value={i18n.language} onChange={(e) => changeLocale(e.target.value as never)}>
        {ENABLED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_REGISTRY[code].nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
