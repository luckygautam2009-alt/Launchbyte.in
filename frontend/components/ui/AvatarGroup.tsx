"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export interface AvatarItem {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface AvatarGroupProps {
  users: AvatarItem[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarGroup({ users, max = 4, size = "md", className }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  const sizeStyles = {
    sm: "w-7 h-7 text-xs border-2",
    md: "w-9 h-9 text-xs border-2",
    lg: "w-11 h-11 text-sm border-2",
  };

  return (
    <div className={clsx("flex items-center -space-x-2.5 overflow-hidden", className)}>
      {visible.map((u, i) => (
        <motion.div
          key={u.id || i}
          whileHover={{ y: -3, scale: 1.1, zIndex: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={clsx(
            "relative rounded-full bg-slate-800 border-slate-950 flex items-center justify-center font-bold text-slate-300 overflow-hidden shrink-0 shadow",
            sizeStyles[size]
          )}
          title={`${u.name}${u.role ? ` (${u.role})` : ""}`}
        >
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
          ) : (
            <span>{u.name.charAt(0).toUpperCase()}</span>
          )}
        </motion.div>
      ))}

      {remaining > 0 && (
        <div
          className={clsx(
            "relative rounded-full bg-slate-850 border-slate-950 flex items-center justify-center font-semibold text-slate-400 font-mono shrink-0 shadow",
            sizeStyles[size]
          )}
          title={`+${remaining} more`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
