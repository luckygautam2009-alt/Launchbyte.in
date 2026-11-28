import React from "react";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading LaunchByte"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#050510] transition-opacity duration-300"
    >
      {/* Background Soft Cosmic Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none animate-pulse" />

      {/* Official Branded Logo with Subtle Pulse */}
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative w-28 sm:w-36 h-auto flex items-center justify-center">
          <img
            src="/brand/launchbyte-navbar-logo.png"
            alt="LaunchByte Logo"
            className="w-full h-auto object-contain filter drop-shadow-[0_0_20px_rgba(139,92,246,0.4)] animate-pulse"
          />
        </div>

        {/* Minimal Progress Line Accent */}
        <div className="w-24 sm:w-32 h-[2px] rounded-full bg-white/[0.08] overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 -translate-x-full animate-[shimmer_1.4s_infinite]" />
        </div>
      </div>
    </div>
  );
}
