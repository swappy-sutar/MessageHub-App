import React from "react";
import logoImg from "/logo/messagehub-favicon.png";

export const MessageHubMark = ({ className = "size-8", animated = false, glow = false }) => {
  return (
    <img
      src={logoImg}
      alt="MessageHub Logo"
      className={`${className} object-contain rounded-xl ${animated ? "animate-pulse" : ""} ${
        glow ? "filter drop-shadow-[0_0_12px_rgba(0,180,216,0.6)]" : ""
      }`}
    />
  );
};

export const MessageHubMobileIcon = ({ className = "size-8" }) => {
  return (
    <img
      src={logoImg}
      alt="MessageHub Mobile Icon"
      className={`${className} object-contain rounded-xl`}
    />
  );
};

export const MessageHubLogoLockup = ({ className = "", size = "md", hideTextMobile = false }) => {
  const iconSizes = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
    xl: "size-16",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <MessageHubMark className={iconSizes[size] || iconSizes.md} />
      <div className={`${hideTextMobile ? "hidden sm:block" : "block"}`}>
        <span className={`font-bold tracking-tight text-base-content ${textSizes[size] || textSizes.md}`}>
          Message<span className="text-primary font-black">Hub</span>
        </span>
      </div>
    </div>
  );
};

export const MessageHubLoadingSpinner = ({ stateText = "Connecting..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none p-6">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Animated Ambient Glow */}
        <div className="absolute size-24 rounded-full bg-primary/20 blur-xl animate-ping" />
        <div className="absolute size-20 rounded-full bg-primary/30 blur-lg animate-pulse" />
        <MessageHubMark className="size-20 relative z-10 animate-bounce" glow animated />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <span className="font-bold text-sm tracking-wide text-base-content animate-pulse">
          {stateText}
        </span>
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

const MessageHubLogo = ({ variant = "lockup", ...props }) => {
  if (variant === "mark") return <MessageHubMark {...props} />;
  if (variant === "mobile") return <MessageHubMobileIcon {...props} />;
  if (variant === "loading") return <MessageHubLoadingSpinner {...props} />;
  return <MessageHubLogoLockup {...props} />;
};

export default MessageHubLogo;
