"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

export interface PageHeroProps {
  eyebrow?: string;
  title: string | React.ReactNode;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function PageHero({
  eyebrow = "LAUNCHBYTE DIRECTORY",
  title,
  subtitle,
  badge,
  children,
  className = "",
}: PageHeroProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`relative pt-12 pb-14 sm:pt-16 sm:pb-20 overflow-hidden bg-transparent dark:bg-[#050510] text-center border-b border-violet-200/70 dark:border-violet-950/40 transition-colors duration-300 ${className}`}
    >
      {/* Background Ambience & Delicate Grid (desktop-only blur for light mobile perf) */}
      <div className="hidden dark:block absolute inset-0 bg-space-grid opacity-25 pointer-events-none" />
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[350px] bg-gradient-to-r from-violet-400/15 via-indigo-400/10 to-cyan-400/15 dark:from-violet-600/15 dark:via-indigo-600/10 dark:to-cyan-500/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Decorative Star Sparks */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 left-[20%] w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 opacity-60" />
        <div className="absolute top-12 right-[25%] w-1 h-1 rounded-full bg-cyan-500 dark:bg-cyan-400 opacity-70" />
        <div className="absolute bottom-6 left-[30%] w-1 h-1 rounded-full bg-indigo-400 dark:bg-indigo-300 opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Eyebrow Pill */}
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100/90 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#5B3DF5] dark:text-[#A78BFA] md:backdrop-blur-md shadow-sm dark:shadow-lg dark:shadow-violet-950/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7552D9] dark:text-cyan-400" />
            <span>{eyebrow}</span>
            {badge && (
              <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-bold bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-500/30">
                {badge}
              </span>
            )}
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#17172B] dark:text-[#F8FAFC] tracking-tight leading-[1.15]"
        >
          {typeof title === "string" ? (
            <span>{title}</span>
          ) : (
            title
          )}
        </motion.h1>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.14 }}
            className="text-sm sm:text-base lg:text-lg text-[#424C63] dark:text-[#CBD5E1] max-w-2xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Action children (Search, filter tabs, action buttons) */}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="pt-2"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
