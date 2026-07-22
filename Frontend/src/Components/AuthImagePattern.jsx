import React from 'react';
import { MessageCircle, Zap, Shield, Video, CheckCheck, Sparkles, Phone, Lock, Heart } from 'lucide-react';
import avatar from '../assets/avatar.png';

function AuthImagePattern({ title, subtitle }) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center w-full h-full relative overflow-hidden bg-gradient-to-br from-base-200 via-base-100 to-base-200 p-12 transition-colors duration-300">
      {/* Background Ambient Glow Circles */}
      <div className="absolute top-1/4 left-10 size-72 rounded-full bg-primary/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-10 size-80 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full space-y-8">
        {/* Floating Interactive Chat Mockup Showcase Card */}
        <div className="w-full bg-base-100/80 backdrop-blur-xl border border-base-300 rounded-3xl p-6 shadow-2xl space-y-4 relative group hover:shadow-primary/10 transition-all duration-300">
          
          {/* Top Mockup Header */}
          <div className="flex items-center justify-between border-b border-base-300/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="size-10 rounded-full object-cover border border-base-300"
                />
                <span className="absolute bottom-0 right-0 size-3 rounded-full bg-success ring-2 ring-base-100" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-base-content flex items-center gap-1.5">
                  MessageHub App <Sparkles className="size-3.5 text-primary animate-spin" />
                </h4>
                <p className="text-[11px] text-success font-medium">Real-time Connected</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="p-2 rounded-full bg-primary/10 text-primary">
                <Video className="size-4" />
              </span>
              <span className="p-2 rounded-full bg-success/10 text-success">
                <Phone className="size-4" />
              </span>
            </div>
          </div>

          {/* Sample Chat Messages */}
          <div className="space-y-3 py-2 text-left">
            {/* Incoming Message */}
            <div className="flex items-start gap-2 max-w-[85%]">
              <div className="bg-base-200 text-base-content p-3 rounded-2xl rounded-tl-none text-xs font-medium shadow-sm">
                Hey there! Welcome to MessageHub 👋
              </div>
            </div>

            {/* Outgoing Message */}
            <div className="flex items-end justify-end gap-2 ml-auto max-w-[85%]">
              <div className="bg-primary text-primary-content p-3 rounded-2xl rounded-tr-none text-xs font-medium shadow-md space-y-1">
                <p>Enjoy real-time chat, video calls & custom themes! 🚀</p>
                <div className="flex items-center justify-end gap-1 text-[10px] opacity-80 font-mono">
                  <span>10:45 pm</span>
                  <CheckCheck className="size-3 text-cyan-300 font-bold" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating Feature Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1">
              <Zap className="size-3" /> Ultra Fast Socket.io
            </span>
            <span className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/20 text-xs font-semibold flex items-center gap-1">
              <Lock className="size-3" /> Encrypted
            </span>
            {/* <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-semibold flex items-center gap-1">
              <Heart className="size-3" /> WhatsApp UI
            </span> */}
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-base-content tracking-tight">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-base-content/70 max-w-sm mx-auto font-normal">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthImagePattern;
