import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./auth/AuthContext.js";
import { SocketProvider } from "./socket/SocketContext.js";
import { CallProvider } from "./call/CallContext.js";
import { LanguageSwitcher } from "./components/LanguageSwitcher.js";
import { LoginForm } from "./components/LoginForm.js";
import { StatusBar } from "./components/StatusBar.js";
import { BuddyList } from "./components/BuddyList.js";
import { RoomsPanel } from "./components/RoomsPanel.js";
import { NudgeToast } from "./components/NudgeToast.js";
import { CallOverlay } from "./components/CallOverlay.js";

type MainTab = "buddies" | "rooms";

function MainShell() {
  const { t } = useTranslation("common");
  const [tab, setTab] = useState<MainTab>("buddies");

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{t("app_name")}</h1>
        <LanguageSwitcher />
      </header>
      <StatusBar />
      <nav className="main-tabs">
        <button type="button" className={tab === "buddies" ? "active" : ""} onClick={() => setTab("buddies")}>
          {t("tabs.buddies")}
        </button>
        <button type="button" className={tab === "rooms" ? "active" : ""} onClick={() => setTab("rooms")}>
          {t("tabs.rooms")}
        </button>
      </nav>
      {tab === "buddies" ? <BuddyList /> : <RoomsPanel />}
      <NudgeToast />
      <CallOverlay />
    </div>
  );
}

function AppContent() {
  const { token } = useAuth();
  return token ? (
    <CallProvider>
      <MainShell />
    </CallProvider>
  ) : (
    <LoginForm />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
