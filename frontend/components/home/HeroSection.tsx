"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import VideoModal from "./VideoModal";

export default function HeroSection() {
  const [videoOpen, setVideoOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden pt-12 pb-20 md:py-24">
      {/* Cosmic background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-48 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

      {/* Subtle Starry Particle Overlay */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 150px 80px, #a855f7, rgba(0,0,0,0)), radial-gradient(1px 1px at 300px 220px, #38bdf8, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 500px 140px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 750px 290px, #c084fc, rgba(0,0,0,0))",
          backgroundSize: "600px 400px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Action CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Pill Badge */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 backdrop-blur-md text-xs font-semibold tracking-wide text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#a855f7]" />
              <span className="tracking-wider uppercase text-[11px] font-medium text-purple-300">
                Learn • Build • Grow
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-1"
            >
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.08]">
                <span className="text-white">Launch</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                  Byte
                </span>
                <br />
                <span className="text-3xl sm:text-5xl lg:text-[3.5rem] font-bold text-slate-100 block mt-2">
                  Your Gateway to
                </span>
                <span className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300">
                  Hackathons & Opportunities
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed"
            >
              A student-driven platform to explore hackathons, find opportunities and be a
              part of the tech community.
            </motion.p>

            {/* Action CTAs */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all hover:scale-[1.03] active:scale-[0.98] border border-purple-400/30"
              >
                <span>Explore Opportunities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-medium text-sm transition-all hover:border-purple-500/40 cursor-pointer shadow-lg backdrop-blur-md"
              >
                <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Play className="w-3 h-3 fill-purple-300 translate-x-0.5" />
                </div>
                <span>Watch Intro</span>
              </button>
            </motion.div>
          </div>

          {/* Right Column: Seated Astronaut on Rock Looking at Glowing Planet */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-[500px] aspect-[4/3] rounded-3xl overflow-hidden border border-purple-500/30 bg-slate-950/60 shadow-[0_0_50px_rgba(101,31,255,0.25)] group"
            >
              {/* Outer decorative ambient glows */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-indigo-500/20 to-cyan-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

              {/* The Hero Astronaut & Planet Image */}
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src="/brand/hero-astronaut-planet.jpg"
                  alt="Astronaut seated in space looking at glowing violet planet"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover object-center transform transition duration-700 group-hover:scale-105"
                  priority
                />

                {/* Atmospheric gradient overlay blending into cosmic dark borders */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070716] via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070716]/40 via-transparent to-purple-950/30" />

                {/* Floating ambient badge */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-purple-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs font-medium text-slate-200">
                      Exploring high-trust cosmos
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400">LaunchByte Orbit</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Video / Intro Walkthrough Modal */}
      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  );
}
