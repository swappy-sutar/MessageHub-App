import React from "react";
import { Link } from "react-router-dom";
import { MessageCircleOff, Home, ArrowLeft, Sparkles, Compass } from "lucide-react";
import ThemeSwitcher from "../Components/ThemeSwitcher";

function NotFoundPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-base-200 via-base-100 to-base-200 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300 font-sans">
      {/* Background Ambient Glow Blobs */}
      <div className="absolute top-1/4 left-10 size-80 rounded-full bg-primary/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-10 size-96 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

      {/* Top Right Theme Selector */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeSwitcher />
      </div>

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-lg bg-base-100/90 backdrop-blur-xl border border-base-300 p-8 sm:p-12 rounded-3xl shadow-2xl text-center space-y-8 relative z-10 animate-fade-in-up">
        {/* Floating 404 Hero Badge */}
        <div className="relative inline-block">
          <div className="size-24 sm:size-28 mx-auto rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner group hover:scale-105 transition-transform">
            <MessageCircleOff className="size-12 sm:size-14 text-primary animate-bounce-slow" />
          </div>
          <span className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-error text-white font-mono text-xs font-bold shadow-md flex items-center gap-1">
            <Sparkles className="size-3" /> 404 Error
          </span>
        </div>

        {/* 404 Giant Text & Heading */}
        <div className="space-y-3">
          <h1 className="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent tracking-tighter">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
            Lost in Cyberspace?
          </h2>
          <p className="text-sm text-base-content/70 max-w-sm mx-auto leading-relaxed">
            The page or conversation you are looking for doesn't exist, was moved, or is currently unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto btn btn-primary rounded-2xl px-6 gap-2 shadow-lg hover:scale-[1.02] transition-transform text-sm font-bold"
          >
            <Home className="size-4" /> Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto btn btn-ghost border border-base-300 rounded-2xl px-6 gap-2 hover:bg-base-200 text-sm font-semibold"
          >
            <ArrowLeft className="size-4" /> Go Back
          </button>
        </div>

        {/* Footer info badge */}
        <div className="pt-4 border-t border-base-300/60 flex items-center justify-center gap-2 text-xs text-base-content/50">
          <Compass className="size-3.5 text-primary" />
          <span>MessageHub — Real-time Connected</span>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
