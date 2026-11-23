"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Target, Users, Zap, Compass, CheckCircle2, ShieldCheck, Flame } from "lucide-react";

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
    bio: "Passionate builder unlocking opportunities for ambitious students.",
    initials: "SC",
    color: "from-violet-600 to-indigo-600",
  },
  {
    name: "David Kalu",
    role: "Co-Founder & CTO",
    bio: "Distributed systems engineer building high-trust developer infrastructure.",
    initials: "DK",
    color: "from-indigo-600 to-cyan-600",
  },
  {
    name: "Maya Patel",
    role: "Head of Community",
    bio: "Empowering 50,000+ student builders through hackathons and fellowships.",
    initials: "MP",
    color: "from-purple-600 to-violet-600",
  },
];

// Interactive Volumetric Exhaust Canvas component
function ExhaustSmokeCanvas({ intensity = 1 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = 320);
    const height = (canvas.height = 360);

    // Particle types: sparks (fast, bright cyan/white) and smoke puffs (slow, billowy violet/gray)
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      maxSize: number;
      alpha: number;
      decay: number;
      type: "spark" | "smoke";
      color: string;
    }

    const particles: Particle[] = [];

    function spawnParticle() {
      // Spawn engine spark
      if (Math.random() < 0.65) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * 16,
          y: 30 + Math.random() * 10,
          vx: (Math.random() - 0.5) * 1.8,
          vy: 4 + Math.random() * 6 * intensity,
          size: 1.5 + Math.random() * 2.5,
          maxSize: 3,
          alpha: 0.9,
          decay: 0.03 + Math.random() * 0.03,
          type: "spark",
          color: Math.random() > 0.4 ? "#22D3EE" : "#FFFFFF",
        });
      }

      // Spawn volumetric smoke cloud puff
      if (Math.random() < 0.45) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * 28,
          y: 70 + Math.random() * 20,
          vx: (Math.random() - 0.5) * 2.2,
          vy: 1.5 + Math.random() * 2.5 * intensity,
          size: 14 + Math.random() * 12,
          maxSize: 55 + Math.random() * 35,
          alpha: 0.35 + Math.random() * 0.25,
          decay: 0.008 + Math.random() * 0.007,
          type: "smoke",
          color:
            Math.random() > 0.5
              ? "rgba(139, 92, 246," // Violet
              : "rgba(99, 102, 241,", // Indigo
        });
      }
    }

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Spawn new particles
      for (let i = 0; i < 2; i++) {
        spawnParticle();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.type === "smoke") {
          p.size += 0.45;
          p.vx *= 1.01; // expands outward
          ctx.beginPath();
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `${p.color} ${Math.max(0, p.alpha * 0.6)})`);
          grad.addColorStop(0.6, `${p.color} ${Math.max(0, p.alpha * 0.25)})`);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // spark
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (p.alpha <= 0 || p.y > height) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [shouldReduceMotion, intensity]);

  if (shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none select-none absolute top-[52%] left-1/2 -translate-x-1/2 z-10 w-[300px] h-[340px] opacity-85 mix-blend-screen"
    />
  );
}

export default function MissionStorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Track scroll progress across the dedicated 380vh mission stage on desktop
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // =========================================================
  // SCENE 3: SCROLL-DRIVEN STORYTELLING TIMELINES
  // With reserved safe zones on left and right
  // =========================================================

  // Phase A: The People Behind the Journey & Mission Intro (0.04 -> 0.24)
  const phaseAOpacity = useTransform(scrollYProgress, [0.03, 0.08, 0.19, 0.24], [0, 1, 1, 0]);
  const phaseALeftX = useTransform(scrollYProgress, [0.03, 0.08, 0.19, 0.24], [-24, 0, 0, -24]);
  const phaseARightX = useTransform(scrollYProgress, [0.03, 0.08, 0.19, 0.24], [24, 0, 0, 24]);

  // Phase B: Why LaunchByte? Problem & Solution (0.28 -> 0.48)
  const phaseBOpacity = useTransform(scrollYProgress, [0.27, 0.32, 0.43, 0.48], [0, 1, 1, 0]);
  const phaseBLeftX = useTransform(scrollYProgress, [0.27, 0.32, 0.43, 0.48], [-24, 0, 0, -24]);
  const phaseBRightX = useTransform(scrollYProgress, [0.27, 0.32, 0.43, 0.48], [24, 0, 0, 24]);

  // Phase C: Platform Breakdown: Explore. Participate. Grow. (0.52 -> 0.72)
  const phaseCOpacity = useTransform(scrollYProgress, [0.51, 0.56, 0.67, 0.72], [0, 1, 1, 0]);
  const phaseCLeftX = useTransform(scrollYProgress, [0.51, 0.56, 0.67, 0.72], [-24, 0, 0, -24]);
  const phaseCRightX = useTransform(scrollYProgress, [0.51, 0.56, 0.67, 0.72], [24, 0, 0, 24]);

  // Phase D: Final Launch Message & CTA (0.76 -> 0.91)
  const phaseDOpacity = useTransform(scrollYProgress, [0.75, 0.80, 0.88, 0.91], [0, 1, 1, 0]);
  const phaseDLeftX = useTransform(scrollYProgress, [0.75, 0.80, 0.88, 0.91], [-24, 0, 0, -24]);
  const phaseDRightX = useTransform(scrollYProgress, [0.75, 0.80, 0.88, 0.91], [24, 0, 0, 24]);

  // =========================================================
  // SCENE 4 & 5: ENGINE INTENSITY, RUMBLE & SEAMLESS LIFTOFF
  // =========================================================
  const rocketY = useTransform(
    scrollYProgress,
    [0, 0.86, 0.88, 0.89, 0.90, 0.91, 0.92, 1.0],
    [0, 0, -2, 2, -2, 2, 0, -1850]
  );

  const rocketRumbleX = useTransform(
    scrollYProgress,
    [0, 0.86, 0.88, 0.90, 0.91, 0.92, 1.0],
    [0, 0, 1.5, -1.5, 2, 0, 0]
  );

  const rocketScale = useTransform(
    scrollYProgress,
    [0, 0.90, 0.95, 1.0],
    [1, 1, 1.06, 0.88]
  );

  const engineFlameScale = useTransform(
    scrollYProgress,
    [0, 0.85, 0.90, 0.95, 1.0],
    [1, 1.2, 1.6, 2.3, 1.5]
  );

  const engineCoreBrightness = useTransform(
    scrollYProgress,
    [0, 0.85, 0.91, 0.97, 1.0],
    [0.75, 0.9, 1.2, 1.3, 0.3]
  );

  return (
    <section className="relative w-full bg-[#050510]">
      {/* ========================================================= */}
      {/* MOBILE ADAPTATION (< lg): Clean Vertical Story Flow       */}
      {/* ========================================================= */}
      <div className="block lg:hidden px-4 sm:px-6 py-16 space-y-16 max-w-xl mx-auto">
        {/* Mobile Phase A: Discover LaunchByte */}
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
            LaunchByte is a student-driven ecosystem built to help builders discover verified
            opportunities, explore emerging technology, connect with peers, and launch real projects.
          </p>
        </div>

        {/* Central Floating Rocket on Mobile */}
        <div className="relative flex justify-center py-4">
          <div className="absolute w-52 h-52 rounded-full bg-violet-600/25 blur-3xl pointer-events-none" />
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-[48vh] max-h-[400px] aspect-[682/1024]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/launchbyte-mission-rocket.png"
              alt="LaunchByte Mission Rocket"
              className="w-full h-full object-contain drop-shadow-[0_15px_45px_rgba(139,92,246,0.35)]"
            />
          </motion.div>
        </div>

        {/* Mobile Phase A: Team */}
        <div className="space-y-3">
          <span className="text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
            THE PEOPLE BEHIND THE JOURNEY
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-violet-500/20">
              <h4 className="text-sm font-bold text-white">{TEAM_MEMBERS[0].name}</h4>
              <p className="text-xs text-[#A78BFA] font-medium">{TEAM_MEMBERS[0].role}</p>
              <p className="text-xs text-slate-400 mt-1">{TEAM_MEMBERS[0].bio}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-violet-500/20">
              <h4 className="text-sm font-bold text-white">{TEAM_MEMBERS[1].name}</h4>
              <p className="text-xs text-[#22D3EE] font-medium">{TEAM_MEMBERS[1].role}</p>
              <p className="text-xs text-slate-400 mt-1">{TEAM_MEMBERS[1].bio}</p>
            </div>
          </div>
        </div>

        {/* Mobile Phase B: Why LaunchByte */}
        <div className="space-y-4">
          <span className="text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
            WHY LAUNCHBYTE?
          </span>
          <p className="text-sm text-white font-medium leading-relaxed">
            Legacy hackathon portals are slow, cluttered with sponsored ads, and opaque.
            LaunchByte gives builders a modern, high-trust launchpad.
          </p>
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-violet-500/20">
              <p className="text-xs font-bold text-violet-300 uppercase">100% Verified Prize Pools</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero fake listings, scam challenges, or unpaid bounties.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-cyan-500/20">
              <p className="text-xs font-bold text-cyan-300 uppercase">Fast Team Matching</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Find compatible builders by tech stack and verified skill badges.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Phase C: Platform Pillars */}
        <div className="space-y-4">
          <span className="text-xs font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
            EXPLORE. PARTICIPATE. GROW.
          </span>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-[#22D3EE] uppercase block">
                01 — DISCOVER
              </span>
              <p className="text-xs text-white font-semibold mt-1">
                Top tier hackathons & internships
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-[#A78BFA] uppercase block">
                02 — ASSEMBLE
              </span>
              <p className="text-xs text-white font-semibold mt-1">
                High-impact cross-functional teams
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-[#A78BFA] uppercase block">
                03 — COLLABORATE
              </span>
              <p className="text-xs text-white font-semibold mt-1">
                Real-time channels & workspace
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-[#22D3EE] uppercase block">
                04 — LAUNCH
              </span>
              <p className="text-xs text-white font-semibold mt-1">
                Ship to production & win awards
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Phase D: CTA */}
        <div className="text-left space-y-4 pt-4 border-t border-violet-900/30">
          <h3 className="text-2xl font-black text-white">Your Next Chapter Starts Here.</h3>
          <p className="text-xs text-slate-400">
            Join thousands of ambitious developers, designers, and innovators.
          </p>
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
          shouldReduceMotion ? "py-24" : "h-[380vh]"
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#09091B]/90 to-[#050510] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/[0.09] blur-[150px] pointer-events-none" />
          <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-cyan-500/[0.07] blur-[120px] pointer-events-none" />

          {/* Sparse Twinkling Stars */}
          <div className="absolute top-[18%] left-[12%] text-violet-200 animate-star-twinkle pointer-events-none">
            <CrossStar size={18} className="text-violet-300 drop-shadow-[0_0_7px_rgba(167,139,250,0.8)]" />
          </div>
          <div className="absolute top-[26%] right-[14%] text-white animate-star-twinkle-delayed pointer-events-none">
            <CrossStar size={14} className="text-violet-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
          </div>
          <div className="absolute bottom-[22%] left-[15%] text-cyan-200 animate-star-twinkle-slow pointer-events-none">
            <CrossStar size={16} className="text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
          </div>
          <div className="absolute bottom-[28%] right-[12%] text-violet-300 animate-star-twinkle pointer-events-none">
            <CrossStar size={20} className="text-violet-200 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
          </div>

          {/* Top & Bottom Subtle Boundary Dividers */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent pointer-events-none" />

          {/* ========================================================= */}
          {/* SCENE 1 & 2: CENTRAL ROCKET WITH DYNAMIC EXHAUST & HOVER  */}
          {/* Reserved Central Corridor (w-[36%], min 420px spacing)    */}
          {/* ========================================================= */}
          <motion.div
            style={
              shouldReduceMotion
                ? undefined
                : {
                    y: rocketY,
                    x: rocketRumbleX,
                    scale: rocketScale,
                  }
            }
            className="relative z-20 flex flex-col items-center justify-center pointer-events-none select-none"
          >
            {/* Subtle Idle Hover Oscillation Wrapper */}
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [-5, 5, -5], rotate: [-0.4, 0.4, -0.4] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex flex-col items-center justify-center"
            >
              {/* Dynamic Atmospheric Glow Behind Engine */}
              <motion.div
                style={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: engineFlameScale,
                        opacity: engineCoreBrightness,
                      }
                }
                className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-56 sm:w-72 h-72 sm:h-96 rounded-full bg-gradient-to-b from-cyan-400/30 via-violet-600/25 to-transparent blur-3xl pointer-events-none"
              />

              {/* Engine Core Light Bloom */}
              <motion.div
                animate={shouldReduceMotion ? undefined : { opacity: [0.75, 1, 0.75], scale: [0.95, 1.08, 0.95] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[32%] left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-cyan-300/50 blur-xl pointer-events-none"
              />

              {/* Dynamic Volumetric Smoke & Sparks Canvas */}
              <ExhaustSmokeCanvas intensity={1.1} />

              {/* High-Resolution LaunchByte Mission Rocket with Billowing Smoke Cloud Base */}
              <div className="relative h-[64vh] sm:h-[70vh] lg:h-[72vh] max-h-[590px] aspect-[682/1024]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/launchbyte-mission-rocket.png"
                  alt="LaunchByte Mission Rocket with active propulsion"
                  className="w-full h-full object-contain drop-shadow-[0_16px_50px_rgba(139,92,246,0.38)] filter"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* ========================================================= */}
          {/* SCENE 3: STRICT SAFE-ZONE STORYTELLING PHASES             */}
          {/* Left Column: Left 12% to 35% | Right Column: Right 12% to 35% */}
          {/* ========================================================= */}
          <div className="absolute inset-0 max-w-7xl mx-auto px-6 lg:px-10 xl:px-14 pointer-events-none flex items-center justify-between">
            
            {/* ------------------------------------------------------- */}
            {/* PHASE A: THE PEOPLE BEHIND THE JOURNEY & MISSION INTRO   */}
            {/* ------------------------------------------------------- */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-6 lg:px-10 xl:px-14">
              {/* Left Column: The Team */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: phaseAOpacity, x: phaseALeftX }}
                className="absolute left-6 lg:left-12 xl:left-16 max-w-[320px] xl:max-w-[360px] pointer-events-auto space-y-3.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-px bg-violet-400/60" />
                    <span className="text-[11px] font-semibold tracking-[0.25em] text-[#A78BFA] uppercase">
                      THE PEOPLE BEHIND THE JOURNEY
                    </span>
                  </div>
                  <p className="text-xs text-[#B8BAD0]">
                    Built by engineers and community builders passionate about student success.
                  </p>
                </div>

                {/* Team Card: Sarah Chen */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-violet-500/20 backdrop-blur-md shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                    {TEAM_MEMBERS[0].initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{TEAM_MEMBERS[0].name}</h4>
                    <p className="text-[10px] text-[#A78BFA] font-medium">{TEAM_MEMBERS[0].role}</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      {TEAM_MEMBERS[0].bio}
                    </p>
                  </div>
                </div>

                {/* Team Card: David Kalu */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-violet-500/20 backdrop-blur-md shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                    {TEAM_MEMBERS[1].initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{TEAM_MEMBERS[1].name}</h4>
                    <p className="text-[10px] text-[#22D3EE] font-medium">{TEAM_MEMBERS[1].role}</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      {TEAM_MEMBERS[1].bio}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Mission Introduction */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: phaseAOpacity, x: phaseARightX }}
                className="absolute right-6 lg:right-12 xl:right-16 max-w-[320px] xl:max-w-[380px] pointer-events-auto space-y-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-px bg-cyan-400/60" />
                  <span className="text-[11px] font-semibold tracking-[0.25em] text-[#22D3EE] uppercase">
                    OUR CORE MISSION
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
                  More Than Just <br />
                  <span className="bg-gradient-to-r from-white via-[#F8FAFC] to-[#A78BFA] bg-clip-text text-transparent">
                    Hackathons.
                  </span>
                </h3>

                <p className="text-xs sm:text-sm text-[#B8BAD0] leading-relaxed">
                  LaunchByte is a student-driven ecosystem built to help ambitious builders{" "}
                  <span className="text-[#A78BFA] font-medium">discover verified opportunities</span>,{" "}
                  explore next-gen technologies, and turn bold ideas into high-impact products.
                </p>

                <div className="flex items-center gap-2 text-xs text-violet-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>100% Curated &amp; Scam-Free Hackathons</span>
                </div>
              </motion.div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* PHASE B: WHY LAUNCHBYTE? (PROBLEM VS SOLUTION)          */}
            {/* ------------------------------------------------------- */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-6 lg:px-10 xl:px-14">
              {/* Left Column: The Problem */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: phaseBOpacity, x: phaseBLeftX }}
                className="absolute left-6 lg:left-12 xl:left-16 max-w-[320px] xl:max-w-[360px] pointer-events-auto space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
                    THE PROBLEM
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Legacy Portals Are Broken.
                  </h3>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-red-500/15">
                    <p className="text-xs font-semibold text-rose-300">Unverified &amp; Ghost Listings</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Legacy platforms are filled with dead links, unawarded prizes, and sponsored clickbait.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-amber-500/15">
                    <p className="text-xs font-semibold text-amber-300">Isolated Solo Builders</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No intelligent way to meet reliable teammates with complementary tech stacks.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: The LaunchByte Solution */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: phaseBOpacity, x: phaseBRightX }}
                className="absolute right-6 lg:right-12 xl:right-16 max-w-[320px] xl:max-w-[360px] pointer-events-auto space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-[0.25em] text-[#22D3EE] uppercase block">
                    THE SOLUTION
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Engineered for Developer Trust.
                  </h3>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-violet-500/25">
                    <p className="text-xs font-semibold text-[#A78BFA]">Verified Trust Score</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Algorithmic scoring verifies organizers, prize escrow, and real judging rubrics.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/25">
                    <p className="text-xs font-semibold text-[#22D3EE]">Intelligent Team Matchmaking</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Form teams in minutes with verified Github/Dev credentials and live chat channels.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* PHASE C: EXPLORE. PARTICIPATE. GROW. (PILLARS)          */}
            {/* ------------------------------------------------------- */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-6 lg:px-10 xl:px-14">
              {/* Left Column: Explore & Participate */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: phaseCOpacity, x: phaseCLeftX }}
                className="absolute left-6 lg:left-12 xl:left-16 max-w-[320px] xl:max-w-[360px] pointer-events-auto space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
                    PLATFORM PILLARS
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    From First Step to Final Ship.
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#22D3EE] uppercase block">
                      01 — DISCOVER
                    </span>
                    <p className="text-xs text-white font-medium mt-0.5">
                      Discover curated hackathons, summer fellowships, and tech internships worth pursuing.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#A78BFA] uppercase block">
                      02 — PARTICIPATE
                    </span>
                    <p className="text-xs text-white font-medium mt-0.5">
                      Join solo or form teams, complete milestones, and submit projects with verifiable proof.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Connect & Grow */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: phaseCOpacity, x: phaseCRightX }}
                className="absolute right-6 lg:right-12 xl:right-16 max-w-[320px] xl:max-w-[360px] pointer-events-auto space-y-4"
              >
                <div className="space-y-3 pt-6">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#A78BFA] uppercase block">
                      03 — CONNECT
                    </span>
                    <p className="text-xs text-white font-medium mt-0.5">
                      Collaborate in real-time team channels with WebSocket chat, invite links, and code sync.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#22D3EE] uppercase block">
                      04 — GROW
                    </span>
                    <p className="text-xs text-white font-medium mt-0.5">
                      Earn on-chain verifiable certificates, skill attestations, and alumni network access.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* PHASE D: FINAL MISSION & LAUNCH COUNTDOWN               */}
            {/* ------------------------------------------------------- */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-6 lg:px-10 xl:px-14">
              {/* Left Column: Final Launch Statement */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: phaseDOpacity, x: phaseDLeftX }}
                className="absolute left-6 lg:left-12 xl:left-16 max-w-[320px] xl:max-w-[380px] pointer-events-auto space-y-4"
              >
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold tracking-[0.25em] text-[#A78BFA] uppercase block">
                    COUNTDOWN TO LAUNCH
                  </span>
                  <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white tracking-tight">
                    Your Next Chapter{" "}
                    <span className="bg-gradient-to-r from-white via-[#F8FAFC] to-[#A78BFA] bg-clip-text text-transparent">
                      Starts Here.
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B8BAD0] leading-relaxed">
                    Great products aren&apos;t built in isolation. Join a community of thousands of
                    ambitious builders shipping the future.
                  </p>
                </div>
              </motion.div>

              {/* Right Column: Direct CTA Button */}
              <motion.div
                style={shouldReduceMotion ? undefined : { opacity: phaseDOpacity, x: phaseDRightX }}
                className="absolute right-6 lg:right-12 xl:right-16 max-w-[320px] xl:max-w-[360px] pointer-events-auto space-y-4"
              >
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-violet-500/25 backdrop-blur-md space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                    <Flame className="w-4 h-4 text-cyan-400" />
                    <span>Engines Primed for Liftoff</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Explore active hackathons, fellowships, and developer grants open for registration today.
                  </p>
                  <div>
                    <Link
                      href="/opportunities"
                      className="w-full justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] text-white font-semibold text-sm shadow-xl shadow-violet-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 group"
                    >
                      <span>EXPLORE OPPORTUNITIES</span>
                      <ArrowRight className="w-4 h-4 text-violet-200 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
