"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Compass, Users2, Trophy } from "lucide-react";

export default function RocketLaunchSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Vertical propulsion of the rocket along the scroll progress
  // At scroll 0: near bottom center; at scroll 1: soaring high into space
  const rocketY = useTransform(scrollYProgress, [0, 0.5, 1], ["40%", "0%", "-70%"]);
  const rocketScale = useTransform(scrollYProgress, [0, 0.4, 1], [0.95, 1.05, 0.85]);
  const flameIntensity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.6, 1.2, 1.4, 0.8]);

  // Step tracker active highlights based on progress
  const step1Opacity = useTransform(scrollYProgress, [0, 0.3, 0.4], [1, 1, 0.4]);
  const step2Opacity = useTransform(scrollYProgress, [0.3, 0.4, 0.7, 0.8], [0.4, 1, 1, 0.4]);
  const step3Opacity = useTransform(scrollYProgress, [0.7, 0.8, 1], [0.4, 1, 1]);

  if (shouldReduceMotion) {
    return (
      <section className="relative py-24 bg-[#070716] overflow-hidden border-b border-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3 text-purple-400 font-semibold text-sm">
              <Compass className="w-5 h-5 text-purple-400" />
              <span>Explore</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-400 font-semibold text-sm">
              <Users2 className="w-5 h-5 text-indigo-400" />
              <span>Participate</span>
            </div>
            <div className="flex items-center gap-3 text-cyan-400 font-semibold text-sm">
              <Trophy className="w-5 h-5 text-cyan-400" />
              <span>Grow</span>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center">
            <div className="relative w-48 h-80">
              <Image
                src="/brand/rocket-cutout.png"
                alt="LaunchByte Rocket"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="md:col-span-4 space-y-4 text-left">
            <h2 className="text-3xl font-extrabold text-white">
              Reach New <span className="text-purple-400">Heights</span>
            </h2>
            <p className="text-sm text-slate-300">
              Discover exciting hackathons, internships and tech opportunities on LaunchByte.
            </p>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={containerRef} className="relative h-[220vh] bg-[#070716]">
      {/* Sticky Fullscreen Stage */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Atmosphere Image / Gradient */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/brand/rocket-section-bg.jpg"
            alt="Cosmic Horizon Nebula"
            fill
            sizes="100vw"
            className="object-cover object-bottom opacity-60 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070716] via-transparent to-[#070716] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070716] via-transparent to-[#070716] opacity-80" />
        </div>

        {/* Ambient Purple Cloud & Dust Atmosphere */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-t from-purple-600/30 via-fuchsia-600/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

        {/* Main Content Grid Overlay */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Left Column: Progress Step Indicators */}
          <div className="hidden md:flex flex-col gap-8 w-64 text-left pl-4">
            <motion.div
              style={{ opacity: step1Opacity }}
              className="flex items-center gap-3.5 group transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-wide">Explore</p>
                <p className="text-[11px] text-slate-400">Discover verified events</p>
              </div>
            </motion.div>

            <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500/40 to-indigo-500/40 ml-4" />

            <motion.div
              style={{ opacity: step2Opacity }}
              className="flex items-center gap-3.5 group transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                <Users2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-wide">Participate</p>
                <p className="text-[11px] text-slate-400">Team up & submit code</p>
              </div>
            </motion.div>

            <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-500/40 to-cyan-500/40 ml-4" />

            <motion.div
              style={{ opacity: step3Opacity }}
              className="flex items-center gap-3.5 group transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-wide">Grow</p>
                <p className="text-[11px] text-slate-400">Prizes, careers & trust</p>
              </div>
            </motion.div>
          </div>

          {/* Center Stage: The Ascending LaunchByte Rocket */}
          <div className="flex-1 flex justify-center items-center pointer-events-none relative h-full">
            <motion.div
              style={{ y: rocketY, scale: rocketScale }}
              className="relative w-52 sm:w-64 h-[420px] flex flex-col items-center justify-center"
            >
              {/* Rocket Cutout Image */}
              <div className="relative w-full h-full">
                <Image
                  src="/brand/rocket-cutout.png"
                  alt="Futuristic LaunchByte Rocket"
                  fill
                  sizes="280px"
                  className="object-contain filter drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]"
                  priority
                />
              </div>

              {/* Dynamic Glowing Thruster Exhaust Flame */}
              <motion.div
                style={{ scaleY: flameIntensity }}
                className="absolute -bottom-16 w-16 h-28 bg-gradient-to-b from-amber-200 via-orange-500 to-transparent rounded-b-full blur-md opacity-90 -z-10 origin-top animate-pulse"
              />
              <div className="absolute -bottom-24 w-28 h-36 bg-gradient-to-b from-purple-500/60 via-indigo-600/30 to-transparent rounded-full blur-xl -z-20" />
            </motion.div>
          </div>

          {/* Right Column: Typography & Call to Action */}
          <div className="w-full md:w-80 lg:w-96 space-y-6 text-left">
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-purple-400 block">
                Next-Gen Launch
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-display">
                Reach New{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                  Heights
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-1">
                Discover exciting hackathons, internships and tech opportunities on LaunchByte.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all hover:scale-[1.03] active:scale-[0.98] border border-purple-400/30"
              >
                <span>Join the Journey</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
