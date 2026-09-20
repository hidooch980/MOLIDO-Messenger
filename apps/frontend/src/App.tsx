import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./auth/AuthContext.js";
import { SocketProvider } from "./socket/SocketContext.js";
import { LanguageSwitcher } from "./components/LanguageSwitcher.js";
import { LoginForm } from "./components/LoginForm.js";
import { StatusBar } from "./components/StatusBar.js";
import { BuddyList } from "./components/BuddyList.js";
import { NudgeToast } from "./components/NudgeToast.js";

function MainShell() {
  const { t } = useTranslation("common");

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{t("app_name")}</h1>
        <LanguageSwitcher />
      </header>
      <StatusBar />
      <BuddyList />
      <NudgeToast />
    </div>
  );
}

function AppContent() {
  const { token } = useAuth();
  return token ? <MainShell /> : <LoginForm />;
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
