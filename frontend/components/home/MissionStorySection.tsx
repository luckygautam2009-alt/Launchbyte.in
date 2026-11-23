"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Target, Users, Zap } from "lucide-react";

// Subtle 4-point cross star component for atmospheric consistency
function CrossStar({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M12 0L13.8 8.8L22 10.2L14.8 13.8L16.2 22L12 15.6L7.8 22L9.2 13.8L2 10.2L10.2 8.8L12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Genuine repository team members from backend seed
const TEAM_MEMBERS = [
  {
    name: "Sarah Chen",
    role: "Founder & CEO",
    bio: "Former hackathon organizer and MIT alum passionate about unlocking global tech opportunities.",
    initials: "SC",
    color: "from-violet-600 to-indigo-600",
  },
  {
    name: "David Kalu",
    role: "Co-Founder & CTO",
    bio: "Distributed systems engineer building lightning-fast, high-trust developer infrastructure.",
    initials: "DK",
    color: "from-indigo-600 to-cyan-600",
  },
  {
    name: "Maya Patel",
    role: "Head of Community",
    bio: "Empowering 50,000+ student builders through hackathons, fellowships, and workshop cohorts.",
    initials: "MP",
    color: "from-purple-600 to-violet-600",
  },
  {
    name: "Alex Rivera",
    role: "Lead Product Designer",
    bio: "Obsessed with clean, accessible interfaces and lightning-fast developer experience.",
    initials: "AR",
    color: "from-cyan-600 to-teal-600",
  },
];

export default function MissionStorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Track scroll progress across the dedicated 480vh mission stage on desktop
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Stage 1: Discover LaunchByte (Left side) (0.04 -> 0.20)
  const stage1Opacity = useTransform(scrollYProgress, [0.03, 0.08, 0.16, 0.20], [0, 1, 1, 0]);
  const stage1X = useTransform(scrollYProgress, [0.03, 0.08, 0.16, 0.20], [-25, 0, 0, -25]);

  // Stage 2: What We Do (0.22 -> 0.44)
  const stage2AOpacity = useTransform(scrollYProgress, [0.22, 0.26, 0.31, 0.34], [0, 1, 1, 0]);
  const stage2AX = useTransform(scrollYProgress, [0.22, 0.26, 0.31, 0.34], [-20, 0, 0, -20]);
  const stage2BOpacity = useTransform(scrollYProgress, [0.23, 0.27, 0.31, 0.34], [0, 1, 1, 0]);
  const stage2BX = useTransform(scrollYProgress, [0.23, 0.27, 0.31, 0.34], [20, 0, 0, 20]);

  const stage2COpacity = useTransform(scrollYProgress, [0.35, 0.38, 0.42, 0.45], [0, 1, 1, 0]);
  const stage2CX = useTransform(scrollYProgress, [0.35, 0.38, 0.42, 0.45], [-20, 0, 0, -20]);
  const stage2DOpacity = useTransform(scrollYProgress, [0.36, 0.39, 0.42, 0.45], [0, 1, 1, 0]);
  const stage2DX = useTransform(scrollYProgress, [0.36, 0.39, 0.42, 0.45], [20, 0, 0, 20]);

  // Stage 3: Meet the Team (0.47 -> 0.63)
  const stage3Opacity = useTransform(scrollYProgress, [0.47, 0.51, 0.59, 0.63], [0, 1, 1, 0]);
  const stage3LeftX = useTransform(scrollYProgress, [0.47, 0.51, 0.59, 0.63], [-20, 0, 0, -20]);
  const stage3RightX = useTransform(scrollYProgress, [0.47, 0.51, 0.59, 0.63], [20, 0, 0, 20]);

  // Stage 4: Why We Launch (0.65 -> 0.79)
  const stage4Opacity = useTransform(scrollYProgress, [0.65, 0.69, 0.75, 0.79], [0, 1, 1, 0]);
  const stage4LeftX = useTransform(scrollYProgress, [0.65, 0.69, 0.75, 0.79], [-20, 0, 0, -20]);
  const stage4RightX = useTransform(scrollYProgress, [0.65, 0.69, 0.75, 0.79], [20, 0, 0, 20]);

  // Stage 5: Pre-Launch Countdown & CTA (Left Side) (0.81 -> 0.92)
  const stage5Opacity = useTransform(scrollYProgress, [0.81, 0.85, 0.90, 0.93], [0, 1, 1, 0]);
  const stage5X = useTransform(scrollYProgress, [0.81, 0.85, 0.90, 0.93], [-25, 0, 0, -25]);

  // Rocket Liftoff Animation (0.93 -> 1.00)
  const rocketY = useTransform(
    scrollYProgress,
    [0, 0.88, 0.90, 0.91, 0.92, 0.93, 0.94, 1.0],
    [0, 0, -2, 2, -1, 1, 0, -1450]
  );
  const rocketScale = useTransform(
    scrollYProgress,
    [0, 0.93, 0.96, 1.0],
    [1, 1, 1.05, 0.92]
  );
  const engineFlameScale = useTransform(
    scrollYProgress,
    [0, 0.85, 0.93, 0.97, 1.0],
    [1, 1.15, 1.45, 1.8, 1.2]
  );
  const engineGlowOpacity = useTransform(
    scrollYProgress,
    [0, 0.85, 0.93, 0.98, 1.0],
    [0.6, 0.8, 1, 0.9, 0]
  );

  return (
    <section className="relative w-full bg-[#050510]">
      {/* ========================================================= */}
      {/* MOBILE ADAPTATION (< lg): Clean Vertical Flow              */}
      {/* ========================================================= */}
      <div className="block lg:hidden px-4 sm:px-6 py-20 space-y-16 max-w-xl mx-auto">
        {/* Stage 1 Mobile */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2">
            <span className="w-5 h-px bg-violet-400/60" />
            <span className="text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase">
              THE JOURNEY STARTS HERE
            </span>
          </div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            More Than Just <br />
            <span className="text-[#A78BFA]">Hackathons.</span>
          </h3>
          <p className="text-sm text-[#B8BAD0] leading-relaxed">
            LaunchByte is a student-driven ecosystem built to help students discover opportunities,
            explore technology, connect with builders and turn ideas into real experiences.
          </p>
        </div>

        {/* Central Floating Rocket on Mobile */}
        <div className="relative flex justify-center py-6">
          <div className="absolute w-44 h-44 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
          <div className="relative h-[48vh] max-h-[380px] aspect-[682/1024]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/launchbyte-mission-rocket.png"
              alt="LaunchByte Mission Rocket"
              className="w-full h-full object-contain drop-shadow-[0_12px_35px_rgba(139,92,246,0.3)]"
            />
          </div>
        </div>

        {/* Stage 2 Mobile: What We Do */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#22D3EE] uppercase">
              01 — DISCOVER
            </span>
            <p className="text-base text-white font-medium">
              Discover hackathons, internships, competitions and opportunities worth pursuing.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#A78BFA] uppercase">
              02 — PARTICIPATE
            </span>
            <p className="text-base text-white font-medium">
              Take part in events, challenge yourself, and turn ideas into action.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#A78BFA] uppercase">
              03 — CONNECT
            </span>
            <p className="text-base text-white font-medium">
              Find like-minded builders, collaborate and become part of a growing community.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#22D3EE] uppercase">
              04 — GROW
            </span>
            <p className="text-base text-white font-medium">
              Learn new skills, build projects and create your own path in technology.
            </p>
          </div>
        </div>

        {/* Stage 3 Mobile: Meet The Team */}
        <div className="space-y-4">
          <span className="text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
            THE PEOPLE BEHIND THE JOURNEY
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-violet-500/20">
              <h4 className="text-sm font-bold text-white">{TEAM_MEMBERS[0].name}</h4>
              <p className="text-xs text-[#A78BFA]">{TEAM_MEMBERS[0].role}</p>
              <p className="text-xs text-slate-400 mt-1">{TEAM_MEMBERS[0].bio}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-violet-500/20">
              <h4 className="text-sm font-bold text-white">{TEAM_MEMBERS[1].name}</h4>
              <p className="text-xs text-[#22D3EE]">{TEAM_MEMBERS[1].role}</p>
              <p className="text-xs text-slate-400 mt-1">{TEAM_MEMBERS[1].bio}</p>
            </div>
          </div>
        </div>

        {/* Stage 4 Mobile: Why We Launch */}
        <div className="space-y-4">
          <span className="text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
            WHY WE LAUNCH
          </span>
          <p className="text-sm text-white font-medium leading-relaxed">
            Opportunities should be discovered, ideas should be built, and builders should never grow alone.
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <p className="text-xs font-bold text-violet-400 uppercase">Opportunity</p>
              <p className="text-xs text-slate-300 mt-0.5">Making hackathons and internships easier to discover.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <p className="text-xs font-bold text-cyan-400 uppercase">Community & Growth</p>
              <p className="text-xs text-slate-300 mt-0.5">Bringing builders together to learn and build real projects.</p>
            </div>
          </div>
        </div>

        {/* Stage 5 Mobile: CTA */}
        <div className="text-left space-y-4 pt-4 border-t border-violet-900/30">
          <h3 className="text-2xl font-black text-white">Your Next Chapter Starts Here.</h3>
          <Link
            href="/opportunities"
            className="w-full justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white font-semibold text-sm shadow-xl inline-flex items-center gap-2"
          >
            <span>EXPLORE LAUNCHBYTE</span>
            <ArrowRight className="w-4 h-4 text-violet-200" />
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP EXPERIENCE (lg: and above): Pinned Story Stage     */}
      {/* ========================================================= */}
      <div
        ref={containerRef}
        className={`hidden lg:block relative w-full ${
          shouldReduceMotion ? "py-24" : "h-[480vh]"
        }`}
      >
        <div
          className={`${
            shouldReduceMotion
              ? "relative max-w-7xl mx-auto px-4 space-y-24"
              : "sticky top-16 h-[calc(100vh-4rem)] w-full overflow-hidden flex items-center justify-center"
          }`}
        >
          {/* Space Backdrop & Subtle Ambient Nebula */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#09091B]/80 to-[#050510] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-violet-600/[0.08] blur-[140px] pointer-events-none" />
          <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.06] blur-[100px] pointer-events-none" />

          {/* Sparse Twinkling Stars */}
          <div className="absolute top-[18%] left-[12%] text-violet-200 animate-star-twinkle">
            <CrossStar size={18} className="text-violet-300 drop-shadow-[0_0_7px_rgba(167,139,250,0.8)]" />
          </div>
          <div className="absolute top-[26%] right-[14%] text-white animate-star-twinkle-delayed">
            <CrossStar size={14} className="text-violet-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
          </div>
          <div className="absolute bottom-[22%] left-[16%] text-cyan-200 animate-star-twinkle-slow">
            <CrossStar size={16} className="text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
          </div>
          <div className="absolute bottom-[28%] right-[12%] text-violet-300 animate-star-twinkle">
            <CrossStar size={20} className="text-violet-200 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
          </div>

          {/* Top & Bottom Subtle Boundary Dividers */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent pointer-events-none" />

          {/* ========================================================= */}
          {/* PERSISTENT CENTRAL ROCKET WITH ACTIVE ENGINE EXHAUST     */}
          {/* ========================================================= */}
          <motion.div
            style={
              shouldReduceMotion
                ? undefined
                : {
                    y: rocketY,
                    scale: rocketScale,
                  }
            }
            className="relative z-20 flex flex-col items-center justify-center pointer-events-none select-none"
          >
            {/* Animated Atmospheric Glow Around Engine */}
            <motion.div
              style={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: engineFlameScale,
                      opacity: engineGlowOpacity,
                    }
              }
              className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-48 sm:w-64 h-64 sm:h-80 rounded-full bg-gradient-to-b from-cyan-400/25 via-violet-600/20 to-transparent blur-3xl pointer-events-none"
            />

            {/* Engine Core Light Bloom */}
            <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 w-20 sm:w-28 h-20 sm:h-28 rounded-full bg-cyan-300/40 blur-xl pointer-events-none" />

            {/* Central Rocket Asset - Sized to be fully visible from tip to exhaust plume */}
            <div className="relative h-[62vh] sm:h-[68vh] lg:h-[70vh] max-h-[570px] aspect-[682/1024]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/launchbyte-mission-rocket.png"
                alt="LaunchByte Mission Rocket with active engine exhaust"
                className="w-full h-full object-contain drop-shadow-[0_15px_45px_rgba(139,92,246,0.35)] filter"
              />
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* STORYTELLING STAGES CONTAINER                             */}
          {/* ========================================================= */}
          <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none flex items-center justify-between">
            
            {/* STAGE 1: DISCOVER LAUNCHBYTE (LEFT SIDE) */}
            <motion.div
              style={shouldReduceMotion ? undefined : { opacity: stage1Opacity, x: stage1X }}
              className="absolute left-6 sm:left-12 lg:left-16 xl:left-24 max-w-sm sm:max-w-md pointer-events-auto space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-px bg-violet-400/60" />
                <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase">
                  THE JOURNEY STARTS HERE
                </span>
              </div>

              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                More Than Just <br />
                <span className="bg-gradient-to-r from-white via-[#F8FAFC] to-[#A78BFA] bg-clip-text text-transparent">
                  Hackathons.
                </span>
              </h3>

              <p className="text-sm sm:text-base text-[#B8BAD0] leading-relaxed font-normal">
                LaunchByte is a student-driven ecosystem built to help students{" "}
                <span className="text-[#A78BFA] font-medium">discover opportunities</span>,{" "}
                explore technology,{" "}
                <span className="text-[#A78BFA] font-medium">connect with builders</span> and turn
                ideas into real experiences.
              </p>
            </motion.div>

            {/* STAGE 2: WHAT WE DO (ALTERNATING CONCEPTS) */}
            {/* Concept 01 (Left) */}
            <motion.div
              style={shouldReduceMotion ? undefined : { opacity: stage2AOpacity, x: stage2AX }}
              className="absolute left-6 sm:left-12 lg:left-16 xl:left-24 max-w-xs sm:max-w-sm pointer-events-auto space-y-2.5"
            >
              <span className="text-xs font-mono font-bold tracking-widest text-[#22D3EE] uppercase">
                01 — DISCOVER
              </span>
              <p className="text-base sm:text-lg text-white font-semibold leading-snug">
                Discover hackathons, internships, competitions and opportunities worth pursuing.
              </p>
            </motion.div>

            {/* Concept 02 (Right) */}
            <motion.div
              style={shouldReduceMotion ? undefined : { opacity: stage2BOpacity, x: stage2BX }}
              className="absolute right-6 sm:right-12 lg:right-16 xl:right-24 max-w-xs sm:max-w-sm pointer-events-auto text-left lg:text-right space-y-2.5"
            >
              <span className="text-xs font-mono font-bold tracking-widest text-[#A78BFA] uppercase">
                02 — PARTICIPATE
              </span>
              <p className="text-base sm:text-lg text-white font-semibold leading-snug">
                Take part in events, challenge yourself, and turn ideas into action.
              </p>
            </motion.div>

            {/* Concept 03 (Left) */}
            <motion.div
              style={shouldReduceMotion ? undefined : { opacity: stage2COpacity, x: stage2CX }}
              className="absolute left-6 sm:left-12 lg:left-16 xl:left-24 max-w-xs sm:max-w-sm pointer-events-auto space-y-2.5"
            >
              <span className="text-xs font-mono font-bold tracking-widest text-[#A78BFA] uppercase">
                03 — CONNECT
              </span>
              <p className="text-base sm:text-lg text-white font-semibold leading-snug">
                Find like-minded builders, collaborate and become part of a growing community.
              </p>
            </motion.div>

            {/* Concept 04 (Right) */}
            <motion.div
              style={shouldReduceMotion ? undefined : { opacity: stage2DOpacity, x: stage2DX }}
              className="absolute right-6 sm:right-12 lg:right-16 xl:right-24 max-w-xs sm:max-w-sm pointer-events-auto text-left lg:text-right space-y-2.5"
            >
              <span className="text-xs font-mono font-bold tracking-widest text-[#22D3EE] uppercase">
                04 — GROW
              </span>
              <p className="text-base sm:text-lg text-white font-semibold leading-snug">
                Learn new skills, build projects and create your own path in technology.
              </p>
            </motion.div>

            {/* STAGE 3: MEET THE TEAM */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-between">
              {/* Left Column: Sarah Chen */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: stage3Opacity, x: stage3LeftX }}
                className="absolute left-6 sm:left-12 lg:left-16 xl:left-24 max-w-xs sm:max-w-sm pointer-events-auto space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase">
                    THE PEOPLE BEHIND THE JOURNEY
                  </span>
                  <p className="text-xs text-[#B8BAD0]">
                    Built by people who believe in creating opportunities.
                  </p>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/70 border border-violet-500/20 backdrop-blur-md">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                    {TEAM_MEMBERS[0].initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{TEAM_MEMBERS[0].name}</h4>
                    <p className="text-[11px] text-[#A78BFA] font-medium">{TEAM_MEMBERS[0].role}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {TEAM_MEMBERS[0].bio}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: David Kalu */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: stage3Opacity, x: stage3RightX }}
                className="absolute right-6 sm:right-12 lg:right-16 xl:right-24 max-w-xs sm:max-w-sm pointer-events-auto space-y-4"
              >
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/70 border border-violet-500/20 backdrop-blur-md">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                    {TEAM_MEMBERS[1].initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{TEAM_MEMBERS[1].name}</h4>
                    <p className="text-[11px] text-[#22D3EE] font-medium">{TEAM_MEMBERS[1].role}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {TEAM_MEMBERS[1].bio}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* STAGE 4: WHY WE LAUNCH */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-between">
              {/* Left Principle */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: stage4Opacity, x: stage4LeftX }}
                className="absolute left-6 sm:left-12 lg:left-16 xl:left-24 max-w-xs sm:max-w-sm pointer-events-auto space-y-4"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase">
                    WHY WE LAUNCH
                  </span>
                  <p className="text-sm text-white font-medium leading-snug">
                    Opportunities should be discovered, ideas should be built, and builders should never grow alone.
                  </p>
                </div>

                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                    <Target className="w-4 h-4 text-violet-400" />
                    <span>OPPORTUNITY</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Making hackathons, internships and meaningful opportunities easier to discover.
                  </p>
                </div>
              </motion.div>

              {/* Right Principle */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: stage4Opacity, x: stage4RightX }}
                className="absolute right-6 sm:right-12 lg:right-16 xl:right-24 max-w-xs sm:max-w-sm pointer-events-auto space-y-3"
              >
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>COMMUNITY</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bringing students, developers and innovators together to collaborate.
                  </p>
                </div>

                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span>GROWTH</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Encouraging people to learn, experiment, create and grow through real experiences.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* STAGE 5: PRE-LAUNCH & CALL TO ACTION (LEFT SIDE) */}
            <motion.div
              style={shouldReduceMotion ? undefined : { opacity: stage5Opacity, x: stage5X }}
              className="absolute left-6 sm:left-12 lg:left-16 xl:left-24 max-w-sm sm:max-w-md pointer-events-auto space-y-5"
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase">
                  READY FOR WHAT&apos;S NEXT?
                </span>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  Your Next Chapter{" "}
                  <span className="bg-gradient-to-r from-white via-[#F8FAFC] to-[#A78BFA] bg-clip-text text-transparent">
                    Starts Here.
                  </span>
                </h3>
                <p className="text-sm sm:text-base text-[#B8BAD0]">
                  Every journey begins with an idea. Build something extraordinary.
                </p>
              </div>

              <div>
                <Link
                  href="/opportunities"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] text-white font-semibold text-sm sm:text-base shadow-xl shadow-violet-500/30 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2 group"
                >
                  <span>EXPLORE LAUNCHBYTE</span>
                  <ArrowRight className="w-4 h-4 text-violet-200 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
