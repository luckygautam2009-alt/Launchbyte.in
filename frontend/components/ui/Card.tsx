"use client";

import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";
import { cardInteractive } from "@/lib/motion";

export interface CardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hoverEffect = false, glass = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverEffect ? cardInteractive.whileHover : undefined}
        className={clsx(
          "rounded-2xl border transition-all duration-200 relative overflow-hidden",
          glass
            ? "bg-slate-900/75 border-slate-800/80 backdrop-blur-md"
            : "bg-slate-900 border-slate-800",
          hoverEffect && "hover:border-slate-700/80 hover:shadow-card cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";
