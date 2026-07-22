import React from "react";
import { useThemeStore } from "../store/useThemeStore.js";
import { Send, Palette, Eye } from "lucide-react";
import { THEMES } from "../constants/index.js";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! Good Morning 😊", isSent: true },
  { id: 2, content: "hello", isSent: false },
  { id: 3, content: "Nice to meet you!", isSent: false },
  { id: 4, content: "How are you?", isSent: true },
  { id: 5, content: "I'm great, thanks! 🎉", isSent: false },
];

function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-base-200 transition-colors duration-300">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-base-content">Settings</h1>
          <p className="text-sm text-base-content/60">
            Personalize your MessageHub experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Theme Selector */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-base-100 rounded-2xl p-6 border border-base-300 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-base-300 pb-4">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Palette className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-base-content">Theme</h2>
                  <p className="text-xs text-base-content/60">
                    Choose an interface theme for your chat
                  </p>
                </div>
              </div>

              {/* Theme Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
                {THEMES.map((t) => {
                  const isSelected = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex flex-col gap-2 p-2.5 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${
                        isSelected
                          ? "bg-base-200 border-primary ring-2 ring-primary/20"
                          : "bg-base-200/50 border-base-300 hover:border-base-content/20"
                      }`}
                    >
                      <div
                        className="relative h-8 w-full rounded-lg overflow-hidden border border-base-300"
                        data-theme={t}
                      >
                        <div className="absolute inset-0 grid grid-cols-4 gap-0.5 p-1 bg-base-100">
                          <div className="rounded bg-primary" />
                          <div className="rounded bg-secondary" />
                          <div className="rounded bg-accent" />
                          <div className="rounded bg-neutral" />
                        </div>
                      </div>
                      <span className={`text-xs font-medium truncate w-full text-center ${
                        isSelected ? "text-primary font-bold" : "text-base-content/70"
                      }`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="space-y-4">
            <div className="bg-base-100 rounded-2xl p-6 border border-base-300 shadow-xl space-y-4 sticky top-20">
              <div className="flex items-center gap-3 border-b border-base-300 pb-4">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-base-content">Preview</h2>
                  <p className="text-xs text-base-content/60">
                    Live theme preview
                  </p>
                </div>
              </div>

              {/* Preview UI Box */}
              <div className="rounded-2xl border border-base-300 overflow-hidden shadow-md" data-theme={theme}>
                {/* Header */}
                <div className="px-4 py-3 border-b border-base-300 bg-base-100 flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-content text-xs font-bold">
                    J
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-base-content">John Doe</h3>
                    <p className="text-[10px] text-base-content/60">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-3 space-y-2.5 min-h-[180px] bg-base-100">
                  {PREVIEW_MESSAGES.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs ${
                          msg.isSent
                            ? "bg-primary text-primary-content"
                            : "bg-base-200 text-base-content"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-2.5 border-t border-base-300 bg-base-100 flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1 text-xs bg-base-200 text-base-content"
                    value="Type a message..."
                    readOnly
                  />
                  <button className="btn btn-primary btn-sm btn-circle">
                    <Send className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
