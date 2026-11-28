"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export interface ProgressBarProps {
  value: number; // current
  max?: number;
  label?: string;
  variant?: "brand" | "emerald" | "amber" | "rose";
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  variant = "brand",
  showValue = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantGradients = {
    brand: "bg-gradient-to-r from-brand-600 to-indigo-400",
    emerald: "bg-gradient-to-r from-emerald-600 to-teal-400",
    amber: "bg-gradient-to-r from-amber-600 to-yellow-400",
    rose: "bg-gradient-to-r from-rose-600 to-pink-400",
  };

  return (
    <div className={clsx("w-full space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-[#424C63] dark:text-slate-400">
          {label && <span className="font-medium text-[#2F3A52] dark:text-slate-300">{label}</span>}
          {showValue && (
            <span className="font-mono text-[#424C63] dark:text-slate-400">
              {value} / {max} ({Math.round(percentage)}%)
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={clsx("h-full rounded-full", variantGradients[variant])}
        />
      </div>
    </div>
  );
}
