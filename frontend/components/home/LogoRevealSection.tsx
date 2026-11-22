"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export default function LogoRevealSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Dynamic transforms based on scroll progress (0 to 1)
  const logoScale = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [0.85, 1.25, 1.15, 1]);
  const logoGlowOpacity = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [0.3, 0.9, 0.8, 0.5]);
  const ringScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.4, 1.1]);
  const ringOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.2, 0.8, 0.6, 0.3]);

  // Floating text opacities and offsets
  const leftTextOpacity = useTransform(scrollYProgress, [0.15, 0.35, 0.75, 0.95], [0, 1, 1, 0.2]);
  const leftTextX = useTransform(scrollYProgress, [0.15, 0.4], [-30, 0]);

  const rightTextOpacity = useTransform(scrollYProgress, [0.2, 0.4, 0.75, 0.95], [0, 1, 1, 0.2]);
  const rightTextX = useTransform(scrollYProgress, [0.2, 0.4], [30, 0]);

  const wordmarkOpacity = useTransform(scrollYProgress, [0.3, 0.5, 0.85, 1], [0, 1, 1, 1]);
  const wordmarkY = useTransform(scrollYProgress, [0.3, 0.5], [20, 0]);

  if (shouldReduceMotion) {
    return (
      <section className="relative py-28 bg-[#070716] border-y border-purple-900/20 overflow-hidden text-center">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-8">
          <div className="relative w-40 h-40">
            <Image
              src="/brand/launchbyte-icon.png"
              alt="LaunchByte Logo"
              fill
              className="object-contain filter drop-shadow-[0_0_30px_rgba(101,31,255,0.7)]"
            />
          </div>
          <div className="relative w-72 h-16">
            <Image
              src="/brand/launchbyte-wordmark.png"
              alt="LaunchByte"
              fill
              className="object-contain"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl text-slate-300">
            <div className="border-l-2 border-purple-500/50 pl-4 text-left">
              <h3 className="text-white font-bold text-lg">More Than Just Events</h3>
              <p className="text-xs text-slate-400 mt-1">A thriving community of builders, learners and innovators.</p>
            </div>
            <div className="border-l-2 border-indigo-500/50 pl-4 text-left">
              <h3 className="text-white font-bold text-lg">Together, We Build Better</h3>
              <p className="text-xs text-slate-400 mt-1">Hack. Learn. Grow.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={containerRef} className="relative h-[220vh] bg-[#070716]">
      {/* Pinned Viewport Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Deep space background ambient gradients */}
        <div className="absolute inset-0 bg-[#070716] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-700/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Concentric Cosmic Rings */}
        <motion.div
          style={{ scale: ringScale, opacity: ringOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-purple-500/20 pointer-events-none shadow-[0_0_50px_rgba(101,31,255,0.15)]"
        />
        <motion.div
          style={{ scale: ringScale, opacity: ringOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-indigo-500/15 pointer-events-none"
        />
        <motion.div
          style={{ scale: ringScale, opacity: ringOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[920px] h-[920px] rounded-full border border-purple-400/10 pointer-events-none"
        />

        {/* Ambient floating cosmic orbs */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-purple-400/60 blur-[1px] animate-pulse shadow-[0_0_12px_#a855f7]" />
        <div className="absolute top-1/3 right-1/4 w-3.5 h-3.5 rounded-full bg-indigo-400/50 blur-[1px] shadow-[0_0_15px_#818cf8]" />
        <div className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 rounded-full bg-cyan-400/60 blur-[1px] shadow-[0_0_10px_#22d3ee]" />

        {/* Center Stage Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          {/* Main Logo & Orbital Energy */}
          <motion.div
            style={{ scale: logoScale }}
            className="relative flex flex-col items-center justify-center"
          >
            {/* Luminous Core Glow */}
            <motion.div
              style={{ opacity: logoGlowOpacity }}
              className="absolute -inset-10 bg-gradient-to-tr from-purple-600/40 via-violet-500/30 to-cyan-400/30 rounded-full blur-3xl pointer-events-none"
            />

            {/* Official LaunchByte Icon Symbol */}
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
              <Image
                src="/brand/launchbyte-icon.png"
                alt="Official LaunchByte Symbol"
                fill
                sizes="(max-width: 640px) 176px, 224px"
                className="object-contain filter drop-shadow-[0_0_35px_rgba(101,31,255,0.7)]"
                priority
              />
            </div>

            {/* Official LaunchByte Wordmark */}
            <motion.div
              style={{ opacity: wordmarkOpacity, y: wordmarkY }}
              className="relative w-64 sm:w-80 h-16 mt-4"
            >
              <Image
                src="/brand/launchbyte-wordmark.png"
                alt="LaunchByte Wordmark"
                fill
                sizes="(max-width: 640px) 256px, 320px"
                className="object-contain filter drop-shadow-[0_0_20px_rgba(101,31,255,0.5)]"
                priority
              />
            </motion.div>
          </motion.div>

          {/* Side Typography Banners */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-5xl">
            {/* Left Copy */}
            <motion.div
              style={{ opacity: leftTextOpacity, x: leftTextX }}
              className="text-left border-l-2 border-purple-500/60 pl-4 py-1"
            >
              <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold block">
                Brand Core
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                More Than Just Events
              </h3>
              <p className="text-sm text-slate-300 mt-1 max-w-sm leading-relaxed">
                A thriving community of builders, learners and innovators.
              </p>
            </motion.div>

            {/* Right Copy */}
            <motion.div
              style={{ opacity: rightTextOpacity, x: rightTextX }}
              className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-indigo-500/60 pl-4 md:pl-0 md:pr-4 py-1"
            >
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold block">
                Mission
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                Together, We Build Better
              </h3>
              <p className="text-sm text-slate-300 mt-1 max-w-sm md:ml-auto leading-relaxed">
                Hack. Learn. Grow.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
