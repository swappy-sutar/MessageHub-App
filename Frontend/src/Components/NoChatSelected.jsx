import React from "react";
import { MessageHubMark } from "./MessageHubLogo";
import { Zap, ShieldCheck, Video, Image, Lock, Sparkles, MessageSquare } from "lucide-react";

function NoChatSelected() {
  const FEATURES = [
    {
      icon: Zap,
      title: "Real-time Messaging",
      description: "Instant socket delivery with active read receipts",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: ShieldCheck,
      title: "End-to-End Encrypted",
      description: "Protected with 256-bit SubtleCrypto AES-GCM",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: Video,
      title: "HD Voice & Video Calls",
      description: "Low-latency WebRTC audio and video calling",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Image,
      title: "Rich Media & Files",
      description: "Share photos, videos, documents and voice notes",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-base-100/60 backdrop-blur-sm transition-colors duration-300 relative overflow-hidden select-none">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 size-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full text-center space-y-8 relative z-10 animate-fade-in">
        {/* Animated Brand Emblem */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center group cursor-pointer">
            <div className="absolute size-28 rounded-3xl bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all duration-500 animate-pulse" />
            <div className="size-24 rounded-3xl bg-base-200/80 border border-primary/20 flex items-center justify-center shadow-xl group-hover:scale-105 transition-all duration-300">
              <MessageHubMark className="size-14" glow />
            </div>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content flex items-center justify-center gap-2">
            Welcome to <span className="text-primary">MessageHub</span>
            <Sparkles className="size-5 text-amber-500 animate-bounce" />
          </h2>
          <p className="text-xs sm:text-sm text-base-content/60 font-medium max-w-md mx-auto leading-relaxed">
            Select a contact or group from the left sidebar to start messaging in real-time.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
          {FEATURES.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="p-4 rounded-2xl bg-base-200/50 hover:bg-base-200/80 border border-base-300/60 shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-300 group flex items-start gap-3.5"
              >
                <div className={`p-2.5 rounded-xl border flex-shrink-0 transition-transform group-hover:scale-110 ${feat.color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-base-content group-hover:text-primary transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-[11px] text-base-content/50 leading-tight mt-0.5">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* WhatsApp Web Style Security Footer Badge */}
        <div className="pt-4 flex items-center justify-center gap-2 text-xs font-medium text-base-content/40">
          <Lock className="size-3.5 text-emerald-500" />
          <span>End-to-end encrypted • Synced across devices</span>
        </div>
      </div>
    </div>
  );
}

export default NoChatSelected;
