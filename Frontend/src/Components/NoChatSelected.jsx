import { MessageCircle } from "lucide-react";

function NoChatSelected() {
  const FEATURE_HINTS = [
    { emoji: '💬', text: 'Real-time messaging' },
    { emoji: '🖼️', text: 'Share images' },
    { emoji: '🔐', text: 'Secure conversations' },
  ];

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-16 bg-base-100/50 transition-colors duration-300">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold text-base-content">Welcome to MessageHub!</h2>
        <p className="text-base-content/60 text-sm">
          Select a conversation from the sidebar to start chatting with your contacts
        </p>

        {/* Feature hints */}
        <div className="flex flex-col gap-2 pt-2">
          {FEATURE_HINTS.map(({ emoji, text }, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-base-200 border border-base-300"
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-xs font-medium text-base-content/80">
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NoChatSelected;
