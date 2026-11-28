"use client";

import React from "react";
import { clsx } from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "accent" | "emerald" | "amber" | "rose" | "slate" | "purple";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "slate",
  size = "md",
  dot = false,
  className,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  const variantStyles = {
    brand: "bg-brand-500/15 text-[#7552D9] dark:text-brand-300 border border-brand-500/30",
    accent: "bg-accent-500/15 text-accent-300 border border-accent-500/30",
    emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30",
    purple: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30",
    slate: "bg-slate-100 dark:bg-slate-800/80 text-[#2F3A52] dark:text-slate-300 border border-slate-300 dark:border-slate-700/80",
  };

  const dotColors = {
    brand: "bg-brand-400",
    accent: "bg-accent-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
    purple: "bg-purple-400",
    slate: "bg-slate-400",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium rounded-full shrink-0 select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
}
