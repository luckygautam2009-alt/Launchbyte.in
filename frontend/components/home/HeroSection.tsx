"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

// Four-point cross star SVG matching the primary reference
function CrossStar({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
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

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[calc(100vh-4rem)] min-h-[640px] lg:min-h-[90vh] bg-[#050510] bg-space-grid overflow-hidden flex flex-col justify-between select-none">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#09091B]/80 to-[#050510] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-900/10 blur-[140px] pointer-events-none" />

      {/* Subtle architectural grid lines passing through the scene */}
      <div className="absolute top-[28%] inset-x-0 h-px bg-violet-500/[0.07] pointer-events-none" />
      <div className="absolute top-[72%] inset-x-0 h-px bg-violet-500/[0.07] pointer-events-none" />
      <div className="absolute inset-y-0 left-[22%] w-px bg-violet-500/[0.05] pointer-events-none hidden sm:block" />
      <div className="absolute inset-y-0 right-[22%] w-px bg-violet-500/[0.05] pointer-events-none hidden sm:block" />

      {/* Twinkling 4-point cross stars positioned in negative space */}
      <div className="absolute top-[14%] right-[10%] text-white animate-star-twinkle">
        <CrossStar size={24} className="text-violet-200 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
      </div>
      <div className="absolute top-[32%] right-[22%] text-white animate-star-twinkle-delayed">
        <CrossStar size={14} className="text-violet-300 drop-shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
      </div>
      <div className="absolute top-[58%] right-[14%] text-white animate-star-twinkle-slow">
        <CrossStar size={20} className="text-violet-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      </div>
      <div className="absolute top-[78%] right-[26%] text-white animate-star-twinkle">
        <CrossStar size={12} className="text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.7)]" />
      </div>
      <div className="absolute top-[22%] left-[14%] text-white animate-star-twinkle-delayed">
        <CrossStar size={16} className="text-violet-200 drop-shadow-[0_0_6px_rgba(167,139,250,0.7)]" />
      </div>
      <div className="absolute top-[48%] left-[28%] text-white animate-star-twinkle-slow">
        <CrossStar size={12} className="text-violet-400 drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]" />
      </div>
      <div className="absolute bottom-[22%] left-[10%] text-white animate-star-twinkle">
        <CrossStar size={18} className="text-white drop-shadow-[0_0_7px_rgba(255,255,255,0.7)]" />
      </div>
      <div className="absolute top-[38%] left-[4%] text-white animate-star-twinkle-delayed">
        <CrossStar size={10} className="text-slate-300 opacity-60" />
      </div>

      {/* Tiny pinpoint stars */}
      <div className="absolute top-[20%] right-[38%] w-1 h-1 rounded-full bg-white opacity-70 animate-pulse pointer-events-none" />
      <div className="absolute top-[65%] left-[18%] w-1.5 h-1.5 rounded-full bg-violet-300 opacity-80 pointer-events-none" />
      <div className="absolute top-[82%] right-[18%] w-1 h-1 rounded-full bg-cyan-200 opacity-60 pointer-events-none" />
      <div className="absolute top-[12%] left-[45%] w-1 h-1 rounded-full bg-white opacity-50 pointer-events-none" />

      {/* ========================================================= */}
      {/* GIANT BACKGROUND TYPOGRAPHY: LAUNCHBYTE                   */}
      {/* ========================================================= */}
      <div className="absolute top-[10%] sm:top-[12%] lg:top-[11%] inset-x-0 w-full flex justify-center items-center pointer-events-none select-none z-10 overflow-hidden px-2">
        <h1
          className="font-black uppercase tracking-[0.14em] sm:tracking-[0.18em] lg:tracking-[0.22em] text-white/[0.08] text-center w-full leading-none whitespace-nowrap"
          style={{
            fontSize: "clamp(2.8rem, 11.2vw, 12rem)",
            fontFamily: "inherit",
          }}
        >
          LAUNCHBYTE
        </h1>
      </div>

      {/* ========================================================= */}
      {/* CENTER VISUAL: ASTRONAUT HOLDING GLOWING PLANET           */}
      {/* ========================================================= */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] md:w-[580px] lg:w-[680px] xl:w-[740px] max-w-[95vw] pointer-events-none select-none z-20 flex flex-col items-center">
        {/* Ambient atmospheric glow halo behind the planet */}
        <div className="absolute top-[55.86%] left-[50.78%] -translate-x-1/2 -translate-y-1/2 w-44 h-44 sm:w-60 sm:h-60 rounded-full bg-violet-500/25 blur-[50px] pointer-events-none animate-globe-glow" />
        <div className="absolute top-[55.86%] left-[50.78%] -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-cyan-400/20 blur-[30px] pointer-events-none" />

        {/* Astronaut image container (completely stationary) */}
        <div className="relative w-full aspect-square flex items-end justify-center">
          {/* Base astronaut image */}
          <Image
            src="/brand/hero-astronaut-holding-planet.png"
            alt="Astronaut holding a glowing rotating planet representing boundless opportunity"
            width={1024}
            height={1024}
            priority
            className="w-full h-auto object-contain object-bottom drop-shadow-[0_10px_35px_rgba(139,92,246,0.25)]"
          />

          {/* Rotating Planetary Globe nestled between the astronaut's hands */}
          <div
            className="absolute rounded-full overflow-hidden pointer-events-none select-none shadow-[0_0_25px_rgba(167,139,250,0.6),0_0_50px_rgba(139,92,246,0.3)]"
            style={{
              left: "50.78%",
              top: "55.86%",
              width: "14.65%",
              height: "14.65%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Spinning surface texture layer */}
            <div
              className="absolute inset-0 w-full h-full animate-planet-spin"
              style={{
                backgroundImage: "url('/brand/planet-map.png')",
                backgroundSize: "200% 100%",
                backgroundRepeat: "repeat-x",
              }}
            />

            {/* 3D Spherical curvature, atmosphere, and rim lighting lens overlay */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, rgba(167,139,250,0.2) 28%, rgba(5,5,16,0.6) 72%, rgba(34,211,238,0.55) 100%)",
                boxShadow:
                  "inset 4px 0 10px rgba(5,5,16,0.85), inset -4px 0 10px rgba(139,92,246,0.5), inset 0 0 8px rgba(34,211,238,0.4)",
              }}
            />
          </div>

          {/* Forefront stationary hands/gloves overlay ensuring hands cup the front of the globe */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <Image
              src="/brand/hero-astronaut-hands.png"
              alt=""
              width={1024}
              height={1024}
              priority
              className="w-full h-auto object-contain object-bottom"
            />
          </div>
        </div>

        {/* Seamless bottom fade mask to blend with the background */}
        <div className="absolute bottom-0 inset-x-0 h-24 sm:h-32 bg-gradient-to-t from-[#050510] via-[#050510]/80 to-transparent pointer-events-none z-30" />
      </div>

      {/* ========================================================= */}
      {/* EDITORIAL CONTENT: LEFT SIDE ALIGNED                      */}
      {/* ========================================================= */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-12 sm:pt-20 lg:pt-28 pb-32 sm:pb-36 lg:pb-24 flex-1 flex flex-col justify-center">
        <div className="max-w-xl text-left space-y-6">
          {/* Small category / label */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#A78BFA] uppercase">
              LEARN • BUILD • GROW
            </span>
          </div>

          {/* Main headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Explore{" "}
            <span className="bg-gradient-to-r from-white via-[#E2E8F0] to-[#A78BFA] bg-clip-text text-transparent">
              Beyond Limits.
            </span>
          </h2>

          {/* Supporting description */}
          <p className="text-base sm:text-lg text-[#B8BAD0] leading-relaxed max-w-lg font-normal">
            A community for students, developers and innovators to discover hackathons,
            opportunities and build something extraordinary.
          </p>

          {/* Actions / CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/opportunities"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] text-white font-semibold text-sm sm:text-base shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 group"
            >
              <span>Explore Opportunities</span>
              <ArrowRight className="w-4 h-4 text-violet-200 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/register"
              className="px-6 py-3.5 rounded-xl border border-violet-500/30 hover:border-violet-400/60 bg-violet-950/20 hover:bg-violet-900/30 text-[#F8FAFC] font-semibold text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
            >
              <span>Join LaunchByte</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom subtle border separating hero from the rest of the page */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent pointer-events-none relative z-30" />
    </section>
  );
}
