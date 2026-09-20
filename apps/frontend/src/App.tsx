import { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext.js";
import { SocketProvider } from "./socket/SocketContext.js";
import { CallProvider } from "./call/CallContext.js";
import { LoginForm } from "./components/LoginForm.js";
import { StatusBar } from "./components/StatusBar.js";
import { BuddyList } from "./components/BuddyList.js";
import { RoomsPanel } from "./components/RoomsPanel.js";
import { ChatRoom } from "./components/ChatRoom.js";
import { WelcomeHero } from "./components/WelcomeHero.js";
import { IconRail, type RailView } from "./components/IconRail.js";
import { NudgeToast } from "./components/NudgeToast.js";
import { CallOverlay } from "./components/CallOverlay.js";
import type { Room } from "./api/types.js";

function MainShell() {
  const [view, setView] = useState<RailView>("chats");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  function handleViewChange(next: RailView) {
    setView(next);
    setSelectedRoom(null);
  }

  return (
    <div className="app-shell workspace">
      <IconRail view={view} onChange={handleViewChange} />
      <div className="list-pane">
        <StatusBar />
        {view === "chats" ? (
          <RoomsPanel selectedRoomId={selectedRoom?.id ?? null} onSelectRoom={setSelectedRoom} />
        ) : (
          <BuddyList />
        )}
      </div>
      <div className="content-pane">
        {view === "chats" && selectedRoom ? (
          <ChatRoom room={selectedRoom} onBack={() => setSelectedRoom(null)} />
        ) : (
          <WelcomeHero />
        )}
      </div>
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
