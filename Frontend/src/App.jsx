import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Components/Navbar";
import CallModal from "./Components/CallModal";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SingupPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useCallStore } from "./store/useCallStore";
import { useChatStore } from "./store/useChatStore";
import { usePresenceStore } from "./store/usePresenceStore";
import { MessageHubLoadingSpinner } from "./Components/MessageHubLogo";
import InviteLinkHandler from "./Components/InviteLinkHandler";
import SettingsDrawer from "./Components/SettingsDrawer";

function App() {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme } = useThemeStore();
  const initCallListeners = useCallStore((state) => state.initCallListeners);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
  const initPresence = usePresenceStore((state) => state.initPresence);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Bind WebRTC call signaling, global message & presence listeners as soon as socket is ready
  useEffect(() => {
    if (socket) {
      initCallListeners();
      subscribeToMessages();
      initPresence();
    }
  }, [socket, initCallListeners, subscribeToMessages, initPresence]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100" data-theme={theme}>
        <MessageHubLoadingSpinner stateText="Initializing MessageHub..." />
      </div>
    );
  }

  return (
    <div data-theme={theme} className="min-h-screen w-full bg-base-100 relative">
      <Navbar />
      <InviteLinkHandler />

      <main>
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/invite"
            element={authUser ? <HomePage /> : <Navigate to="/signup" />}
          />
          <Route
            path="/signup"
            element={!authUser ? <SignupPage /> : <Navigate to="/" />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
          />
          {/* /settings now handled by SettingsDrawer overlay — redirect old URL */}
          <Route path="/settings" element={<Navigate to="/" replace />} />
          {/* /profile now handled by SettingsDrawer Profile sub-view — redirect old URL */}
          <Route path="/profile" element={<Navigate to="/" replace />} />

          {/* Catch-all 404 Not Found Page */}
          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Routes>
      </main>

      {/* Global Right-Side Settings Drawer Panel */}
      <SettingsDrawer />

      {/* Global WebRTC Call Modal Overlay */}
      <CallModal />
    </div>
  );
}

export default App;