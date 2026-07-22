import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Components/Navbar";
import CallModal from "./Components/CallModal";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SingupPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useCallStore } from "./store/useCallStore";
import { useChatStore } from "./store/useChatStore";
import { Loader } from "lucide-react";

function App() {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme } = useThemeStore();
  const initCallListeners = useCallStore((state) => state.initCallListeners);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Bind WebRTC call signaling & global message listeners as soon as socket is ready
  useEffect(() => {
    if (socket) {
      initCallListeners();
      subscribeToMessages();
    }
  }, [socket, initCallListeners, subscribeToMessages]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme} className="min-h-screen w-full bg-base-100">
      <Navbar />

      <main>
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/signup"
            element={!authUser ? <SignupPage /> : <Navigate to="/" />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
          />
          {/* Settings page accessible for both logged in and logged out users */}
          <Route
            path="/settings"
            element={<SettingsPage />}
          />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
          />

          {/* Catch-all 404 Not Found Page */}
          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Routes>
      </main>

      {/* Global WebRTC Call Modal Overlay */}
      <CallModal />
    </div>
  );
}

export default App;