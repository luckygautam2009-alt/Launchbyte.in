"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui/Avatar";

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
            "relative rounded-full bg-slate-100 dark:bg-slate-800 border-white dark:border-slate-950 flex items-center justify-center font-bold text-[#2F3A52] dark:text-slate-300 overflow-hidden shrink-0 shadow",
            sizeStyles[size]
          )}
          title={`${u.name}${u.role ? ` (${u.role})` : ""}`}
        >
          <Avatar
            src={u.avatarUrl}
            name={u.name}
            size="fill"
            className="bg-transparent text-[#2F3A52] dark:text-slate-300 font-bold"
          />
        </motion.div>
      ))}

      {remaining > 0 && (
        <div
          className={clsx(
            "relative rounded-full bg-slate-200 dark:bg-slate-850 border-white dark:border-slate-950 flex items-center justify-center font-semibold text-[#424C63] dark:text-slate-400 font-mono shrink-0 shadow",
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
