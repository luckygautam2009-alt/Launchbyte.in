"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { clsx } from "clsx";

export interface TrustBadgeProps {
  score?: number | null;
  status?: "verified" | "pending" | "unverified" | "flagged" | "rejected" | null;
  size?: "sm" | "md";
  showScore?: boolean;
}

export function TrustBadge({
  score,
  status = "verified",
  size = "md",
  showScore = true,
}: TrustBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isVerified = status === "verified" || (score !== undefined && score !== null && score >= 75);
  const isFlagged = status === "flagged";
  const numScore = score ?? (isVerified ? 95 : 60);

  const scoreColor =
    numScore >= 80
      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : numScore >= 60
      ? "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30";

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      aria-label={`Trust rating: ${isVerified ? "Verified" : status}, score ${numScore} out of 100`}
    >
      <div
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full border font-semibold select-none cursor-help transition-all duration-200",
          scoreColor,
          size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1"
        )}
      >
        {isVerified ? (
          <ShieldCheck className={size === "sm" ? "w-3 h-3 text-emerald-700 dark:text-emerald-400" : "w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400"} />
        ) : isFlagged ? (
          <ShieldAlert className={size === "sm" ? "w-3 h-3 text-rose-600 dark:text-rose-400" : "w-3.5 h-3.5 text-rose-600 dark:text-rose-400"} />
        ) : (
          <Shield className={size === "sm" ? "w-3 h-3 text-amber-700 dark:text-amber-400" : "w-3.5 h-3.5 text-amber-700 dark:text-amber-400"} />
        )}
        <span>{isVerified ? "Verified" : isFlagged ? "Flagged" : "Pending"}</span>
        {showScore && (
          <span className="opacity-80 font-mono text-[10px] pl-0.5 border-l border-current/30">
            {numScore}%
          </span>
        )}
      </div>

      {/* Trust Signals Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-750 shadow-2xl text-xs text-[#2F3A52] dark:text-slate-300 z-50 pointer-events-none backdrop-blur-md space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between font-bold text-[#17172B] dark:text-slate-100 pb-1 border-b border-slate-200 dark:border-slate-800">
            <span>Trust Score</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400">{numScore} / 100</span>
          </div>
          <p className="text-[11px] text-[#424C63] dark:text-slate-400 leading-relaxed">
            {isVerified
              ? "Calculated from verified organizer domain, registered registry, confirmed prize pool, and hacker community reviews."
              : "Organizer identity or prize pool documentation is currently undergoing manual moderation review."}
          </p>
        </div>
      )}
    </div>
  );
}
