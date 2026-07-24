import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import { useChatStore } from "../store/useChatStore";
import ChatContainer from "../Components/ChatContainer";
import NoChatSelected from "../Components/NoChatSelected";
import BottomNav from "../Components/BottomNav";
import CallHistoryView from "../Components/CallHistoryView";
import UpdatesView from "../Components/UpdatesView";
import ContactInfoPanel from "../Components/ContactInfoPanel";
import InChatSearchPanel from "../Components/InChatSearchPanel";
import toast from "react-hot-toast";
import { WifiOff } from "lucide-react";

function HomePage() {
  const {
    selectedUser,
    isContactInfoOpen,
    setContactInfoOpen,
    isSearchOpen,
    setSearchOpen,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState("chats");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Back online! Connected to MessageHub server 🟢");
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast("⚡ Offline mode — Viewing cached chats & media", { icon: "📶", duration: 4000 });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className={`h-screen w-full bg-base-100 pt-14 ${selectedUser ? "pb-0" : "pb-16 lg:pb-0"} transition-colors duration-300 overflow-hidden flex flex-col`}>
      {/* Offline Status Banner */}
      {isOffline && (
        <div className="bg-amber-500/90 text-amber-950 px-4 py-1.5 text-xs font-extrabold text-center flex items-center justify-center gap-2 z-40 backdrop-blur-md shadow-xs animate-fade-in flex-shrink-0">
          <WifiOff className="size-4" />
          <span>⚡ Offline Mode — Displaying cached chats & shared media</span>
        </div>
      )}

      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* Desktop View & Mobile Chats View */}
        {activeTab === "chats" && (
          <>
            {/* Sidebar Contact List */}
            <div
              className={`w-full lg:w-80 h-full flex-shrink-0 border-r border-base-300 ${
                selectedUser ? "hidden lg:block" : "block"
              }`}
            >
              <Sidebar />
            </div>

            {/* Main Chat Container + Right Contact Info / Search Side Panels */}
            <div
              className={`flex-1 h-full min-w-0 flex ${
                !selectedUser ? "hidden lg:flex" : "flex"
              }`}
            >
              <div className="flex-1 h-full min-w-0 flex flex-col">
                {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
              </div>

              {/* WhatsApp Web Style Right Contact Info Side Drawer */}
              {selectedUser && isContactInfoOpen && (
                <ContactInfoPanel
                  contact={selectedUser}
                  onClose={() => setContactInfoOpen(false)}
                />
              )}

              {/* WhatsApp Web Style Right In-Chat Search Side Drawer */}
              {selectedUser && isSearchOpen && (
                <InChatSearchPanel
                  onClose={() => setSearchOpen(false)}
                />
              )}
            </div>
          </>
        )}

        {/* Mobile Calls Tab View */}
        {activeTab === "calls" && (
          <div className="w-full h-full">
            <CallHistoryView />
          </div>
        )}

        {/* Mobile Updates Tab View */}
        {activeTab === "updates" && (
          <div className="w-full h-full">
            <UpdatesView />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar ("Chats", "Calls", "Updates") */}
      {!selectedUser && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}

export default HomePage;
