import React from "react";
import { MessageSquare, Phone, Sparkles } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function BottomNav({ activeTab, setActiveTab }) {
  const { unreadCounts } = useChatStore();
  const totalUnread = Object.values(unreadCounts).reduce((acc, curr) => acc + curr, 0);

  const TABS = [
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "calls", label: "Calls", icon: Phone },
    { id: "updates", label: "Updates", icon: Sparkles },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-100/90 backdrop-blur-md border-t border-base-300 h-16 flex items-center justify-around px-4 transition-colors duration-300">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-200 ${
              isActive
                ? "text-primary font-bold scale-105"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <div className="relative">
              <Icon className={`size-5 ${isActive ? "text-primary" : ""}`} />
              {id === "chats" && totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-2.5 badge badge-primary badge-xs font-mono font-bold animate-pulse">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[11px] tracking-tight">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
