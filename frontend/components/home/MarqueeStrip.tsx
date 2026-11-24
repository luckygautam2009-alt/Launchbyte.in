"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function MarqueeStrip() {
  const shouldReduceMotion = useReducedMotion();

  const items = [
    "Hackathons",
    "Fellowships",
    "Internships",
    "Grants",
    "Workshops",
    "Teammate Matching",
    "Developer Bounties",
    "Open Source Residencies",
  ];

  // Repeat items for seamless infinite horizontal loop
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      aria-label="Ecosystem Opportunity Streams"
      className="relative w-full py-4 bg-[#070716]/90 border-y border-violet-500/20 backdrop-blur-md overflow-hidden z-10 select-none group"
    >
      {/* Edge gradient masks for seamless fade out */}
      <div className="absolute left-0 inset-y-0 w-20 sm:w-32 bg-gradient-to-r from-[#050510] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-20 sm:w-32 bg-gradient-to-l from-[#050510] to-transparent z-10 pointer-events-none" />

      {/* Marquee Content */}
      <div className="flex w-max">
        {shouldReduceMotion ? (
          <div className="flex items-center gap-8 px-4 text-xs font-mono uppercase tracking-widest text-[#B8BAD0]">
            {items.map((item, i) => (
              <React.Fragment key={i}>
                <span className="flex items-center gap-2 hover:text-[#A78BFA] transition-colors">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{item}</span>
                </span>
                <span className="text-violet-500/60">•</span>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <motion.div
            className="flex items-center gap-8 sm:gap-10 text-xs sm:text-sm font-mono uppercase tracking-widest text-[#B8BAD0] group-hover:[animation-play-state:paused]"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 32,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {repeated.map((item, i) => (
              <React.Fragment key={i}>
                <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-slate-300 hover:text-white transition-colors cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]" />
                  <span>{item}</span>
                </span>
                <span className="text-violet-400/50 font-bold">•</span>
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
