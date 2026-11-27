"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SectionBridgeProps {
  label?: string;
  sublabel?: string;
  heightClass?: string;
  glowColor?: "violet" | "cyan" | "indigo";
}

export default function SectionBridge({
  label = "SECTOR 02 → THE FRONTIER",
  sublabel = "ORBITAL VECTOR // 02.EXP",
  heightClass = "h-36 sm:h-44",
  glowColor = "violet",
}: SectionBridgeProps) {
  const shouldReduceMotion = useReducedMotion();

  const glowStyles = {
    violet: "from-violet-600/15 via-purple-900/10 to-transparent",
    cyan: "from-cyan-500/15 via-blue-900/10 to-transparent",
    indigo: "from-indigo-600/15 via-violet-900/10 to-transparent",
  };

  const ringBorders = {
    violet: "border-violet-500/20",
    cyan: "border-cyan-500/20",
    indigo: "border-indigo-500/20",
  };

  const lineGradient = {
    violet: "from-violet-400 via-purple-500 to-transparent",
    cyan: "from-cyan-400 via-blue-500 to-transparent",
    indigo: "from-indigo-400 via-violet-500 to-transparent",
  };

  return (
    <div
      aria-hidden="true"
      className={`relative w-full ${heightClass} bg-transparent dark:bg-[#050510] pointer-events-none overflow-hidden flex flex-col items-center justify-center z-15 select-none`}
    >
      {/* Central Ambient Glow */}
      <div
        className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 bg-radial ${glowStyles[glowColor]} blur-2xl pointer-events-none`}
      />

      {/* Faint Concentric Orbit Rings Fading Outward */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-[450px] sm:w-[650px] h-[120px] rounded-[50%] border ${ringBorders[glowColor]} opacity-40`}
        />
        <div
          className={`w-[700px] sm:w-[1000px] h-[160px] rounded-[50%] border ${ringBorders[glowColor]} opacity-20`}
        />
        <div
          className={`w-[950px] sm:w-[1400px] h-[200px] rounded-[50%] border ${ringBorders[glowColor]} opacity-10`}
        />
      </div>

      {/* Thin Glowing Line Leading Down into Next Section */}
      <div className="absolute inset-y-0 flex flex-col items-center justify-between">
        <div className={`w-[1px] h-12 bg-gradient-to-b ${lineGradient[glowColor]}`} />
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_#A78BFA]" />
        <div className={`w-[1px] h-12 bg-gradient-to-t ${lineGradient[glowColor]}`} />
      </div>

      {/* Small Tech Monospace Coordinates Pill */}
      <div className="relative z-10 px-4 py-1 rounded-full bg-[#070719]/90 border border-violet-500/30 backdrop-blur-md shadow-lg flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-violet-300 font-semibold">
          {label}
        </span>
        {sublabel && (
          <span className="hidden sm:inline text-[9px] font-mono text-slate-500 pl-1 border-l border-slate-700">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
