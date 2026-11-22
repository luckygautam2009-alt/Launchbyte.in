"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export default function LogoIdentitySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress through this pinned container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // =========================================================
  // SCROLL-BASED EXPLODED LOGO TRANSFORMS
  // =========================================================
  // State 1 (Assembled): 0 -> 0.15
  // State 2 (Separating) & State 3 (Exploded): 0.15 -> 0.75
  // State 4 (Full Expansion): 0.75 -> 1.0

  // 1. Top-Right Arc: sweeps up and right along its orbital trajectory
  const arcTopRightX = useTransform(scrollYProgress, [0.15, 0.75], [0, 52]);
  const arcTopRightY = useTransform(scrollYProgress, [0.15, 0.75], [0, -46]);
  const arcTopRightRotate = useTransform(scrollYProgress, [0.15, 0.75], [0, 8]);

  // 2. Bottom-Left Arc: sweeps down and left along its orbital trajectory
  const arcBottomLeftX = useTransform(scrollYProgress, [0.15, 0.75], [0, -52]);
  const arcBottomLeftY = useTransform(scrollYProgress, [0.15, 0.75], [0, 46]);
  const arcBottomLeftRotate = useTransform(scrollYProgress, [0.15, 0.75], [0, -8]);

  // 3. 'L' Vertical Pillar: shifts leftward with slight angle
  const pillarLeftX = useTransform(scrollYProgress, [0.15, 0.75], [0, -38]);
  const pillarLeftY = useTransform(scrollYProgress, [0.15, 0.75], [0, -8]);
  const pillarLeftRotate = useTransform(scrollYProgress, [0.15, 0.75], [0, -3]);

  // 4. 'B' Loops: shifts rightward with slight angle
  const bLoopsX = useTransform(scrollYProgress, [0.15, 0.75], [0, 38]);
  const bLoopsY = useTransform(scrollYProgress, [0.15, 0.75], [0, 8]);
  const bLoopsRotate = useTransform(scrollYProgress, [0.15, 0.75], [0, 3]);

  // 5. Central Arrow: propels diagonally forward and upward into space
  const arrowCenterX = useTransform(scrollYProgress, [0.15, 0.75], [0, 36]);
  const arrowCenterY = useTransform(scrollYProgress, [0.15, 0.75], [0, -36]);
  const arrowCenterScale = useTransform(scrollYProgress, [0.15, 0.75], [1, 1.15]);

  // 6. Wordmark: moves gracefully downwards to anchor the disassembled view
  const wordmarkY = useTransform(scrollYProgress, [0.15, 0.75], [0, 36]);
  const wordmarkOpacity = useTransform(scrollYProgress, [0.15, 0.75], [1, 0.88]);

  // Blueprint / orbital traces that appear during disassembly
  const tracesOpacity = useTransform(scrollYProgress, [0.2, 0.65], [0, 0.75]);
  const haloScale = useTransform(scrollYProgress, [0.15, 0.75], [0.9, 1.25]);
  const haloOpacity = useTransform(scrollYProgress, [0.15, 0.75], [0.35, 0.65]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[220vh] bg-[#050510] text-slate-100"
    >
      {/* Sticky viewport frame maintaining full view while user scrolls */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center items-center bg-space-grid">
        {/* Ambient atmospheric gradients in LaunchByte colors */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#09091B]/90 to-[#050510] pointer-events-none" />
        
        <motion.div
          style={{ scale: haloScale, opacity: haloOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-cyan-400/10 blur-[90px] pointer-events-none" />

        {/* Subtle architectural grid guidelines connecting the layout */}
        <div className="absolute top-1/2 inset-x-0 h-px bg-violet-500/[0.08] pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-violet-500/[0.05] pointer-events-none" />

        {/* Small atmospheric background stars */}
        <div className="absolute top-[20%] left-[15%] w-1 h-1 rounded-full bg-white opacity-60 pointer-events-none" />
        <div className="absolute top-[30%] right-[18%] w-1.5 h-1.5 rounded-full bg-violet-300 opacity-70 pointer-events-none animate-pulse" />
        <div className="absolute bottom-[25%] left-[22%] w-1 h-1 rounded-full bg-cyan-200 opacity-50 pointer-events-none" />
        <div className="absolute bottom-[35%] right-[14%] w-1 h-1 rounded-full bg-white opacity-60 pointer-events-none" />

        {/* Main Content Layout: [ LEFT TEXT ]  [ LAUNCHBYTE LOGO ]  [ RIGHT TEXT ] */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-8">
          
          {/* ========================================================= */}
          {/* LEFT SIDE: Stable Editorial Content                       */}
          {/* ========================================================= */}
          <div className="w-full lg:w-1/3 max-w-md text-center lg:text-left space-y-4 select-none order-2 lg:order-1">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
              MORE THAN JUST OPPORTUNITIES
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Where curiosity
              <span className="block text-[#A78BFA]">becomes creation.</span>
            </h2>
            <p className="text-sm sm:text-base text-[#B8BAD0] leading-relaxed font-normal">
              LaunchByte is a student-driven ecosystem designed to help students discover
              opportunities, participate in hackathons, connect with builders and turn ideas into
              reality.
            </p>

            {/* Subtle connecting horizontal line toward the center on desktop */}
            <div className="hidden lg:flex items-center gap-2 pt-2">
              <div className="h-px w-24 bg-gradient-to-r from-violet-500/40 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            </div>
          </div>

          {/* ========================================================= */}
          {/* CENTRE: Official LaunchByte Exploded Logo Anchor         */}
          {/* ========================================================= */}
          <div className="w-full lg:w-1/3 flex justify-center items-center order-1 lg:order-2">
            <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px] select-none flex items-center justify-center">
              
              {/* Connecting Technical Blueprint Traces (Visible during explosion) */}
              <motion.svg
                style={{ opacity: tracesOpacity }}
                viewBox="0 0 420 420"
                className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
              >
                {/* Thin dashed circular orbital guides */}
                <circle
                  cx="210"
                  cy="175"
                  r="135"
                  fill="none"
                  stroke="rgba(167, 139, 250, 0.25)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
                <circle
                  cx="210"
                  cy="175"
                  r="95"
                  fill="none"
                  stroke="rgba(34, 211, 238, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
                {/* Diagonal trajectory line of the arrow */}
                <line
                  x1="130"
                  y1="255"
                  x2="290"
                  y2="95"
                  stroke="rgba(139, 92, 246, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </motion.svg>

              {/* Central Soft Glow Behind the Logo */}
              <div className="absolute inset-8 rounded-full bg-violet-600/20 blur-2xl pointer-events-none" />

              {/* 1. Top-Right Arc Layer */}
              <motion.div
                style={{
                  x: arcTopRightX,
                  y: arcTopRightY,
                  rotate: arcTopRightRotate,
                }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <Image
                  src="/brand/logo-layers/arc-top-right.png"
                  alt="LaunchByte Top Right Arc"
                  fill
                  className="object-contain drop-shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                  priority
                />
              </motion.div>

              {/* 2. Bottom-Left Arc Layer */}
              <motion.div
                style={{
                  x: arcBottomLeftX,
                  y: arcBottomLeftY,
                  rotate: arcBottomLeftRotate,
                }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <Image
                  src="/brand/logo-layers/arc-bottom-left.png"
                  alt="LaunchByte Bottom Left Arc"
                  fill
                  className="object-contain drop-shadow-[0_4px_16px_rgba(79,70,229,0.3)]"
                  priority
                />
              </motion.div>

              {/* 3. 'L' Pillar Layer */}
              <motion.div
                style={{
                  x: pillarLeftX,
                  y: pillarLeftY,
                  rotate: pillarLeftRotate,
                }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <Image
                  src="/brand/logo-layers/pillar-left.png"
                  alt="LaunchByte Left Pillar"
                  fill
                  className="object-contain drop-shadow-[0_4px_16px_rgba(139,92,246,0.25)]"
                  priority
                />
              </motion.div>

              {/* 4. 'B' Loops Layer */}
              <motion.div
                style={{
                  x: bLoopsX,
                  y: bLoopsY,
                  rotate: bLoopsRotate,
                }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <Image
                  src="/brand/logo-layers/b-loops.png"
                  alt="LaunchByte B Loops"
                  fill
                  className="object-contain drop-shadow-[0_4px_16px_rgba(34,211,238,0.25)]"
                  priority
                />
              </motion.div>

              {/* 5. Central White Arrow Layer */}
              <motion.div
                style={{
                  x: arrowCenterX,
                  y: arrowCenterY,
                  scale: arrowCenterScale,
                }}
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
              >
                <Image
                  src="/brand/logo-layers/arrow-center.png"
                  alt="LaunchByte Rocket Arrow"
                  fill
                  className="object-contain drop-shadow-[0_0_16px_rgba(255,255,255,0.7)]"
                  priority
                />
              </motion.div>

              {/* 6. LaunchByte Wordmark Layer */}
              <motion.div
                style={{
                  y: wordmarkY,
                  opacity: wordmarkOpacity,
                }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <Image
                  src="/brand/logo-layers/wordmark.png"
                  alt="LaunchByte Wordmark"
                  fill
                  className="object-contain drop-shadow-[0_2px_12px_rgba(139,92,246,0.2)]"
                  priority
                />
              </motion.div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: Stable Editorial Content                      */}
          {/* ========================================================= */}
          <div className="w-full lg:w-1/3 max-w-md text-center lg:text-left space-y-4 select-none order-3">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
              BUILT FOR THE NEXT GENERATION
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Discover. <span className="text-[#A78BFA]">Build.</span> Grow.
            </h2>
            <p className="text-sm sm:text-base text-[#B8BAD0] leading-relaxed font-normal">
              From your first hackathon to your next big project, find the opportunities, people and
              experiences that help you move forward in tech.
            </p>

            {/* Subtle connecting horizontal line from the center on desktop */}
            <div className="hidden lg:flex items-center gap-2 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-cyan-500/40" />
            </div>
          </div>
        </div>

        {/* Scroll cue indicator at the bottom */}
        <div className="absolute bottom-6 inset-x-0 flex justify-center items-center pointer-events-none select-none">
          <div className="flex flex-col items-center gap-1 text-[11px] font-mono tracking-widest text-slate-500 uppercase">
            <span>SCROLL TO EXPLODE IDENTITY</span>
            <div className="w-4 h-7 rounded-full border border-violet-800/40 flex justify-center pt-1">
              <div className="w-1 h-2 rounded-full bg-violet-400 animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
