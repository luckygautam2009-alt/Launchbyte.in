"use client";

import React from "react";
import DecodeText from "./DecodeText";
import { Sparkles } from "lucide-react";

interface SectionEyebrowProps {
  stage: string; // e.g. "STAGE 01 // DISCOVER"
  badge?: string;
  className?: string;
  accentColor?: "cyan" | "violet" | "indigo" | "emerald";
}

export default function SectionEyebrow({
  stage,
  badge,
  className = "",
  accentColor = "cyan",
}: SectionEyebrowProps) {
  const accentGlow =
    accentColor === "cyan"
      ? "text-cyan-700 dark:text-cyan-400 bg-cyan-400"
      : accentColor === "emerald"
      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-400"
      : "text-violet-700 dark:text-violet-400 bg-violet-400";

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/70 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md shadow-lg shadow-violet-950/40 select-none ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${accentGlow}`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${accentGlow}`}
        />
      </span>
      <DecodeText text={stage} className="font-bold tracking-wider" duration={680} />
      {badge && (
        <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-bold bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
          {badge}
        </span>
      )}
    </div>
  );
}
