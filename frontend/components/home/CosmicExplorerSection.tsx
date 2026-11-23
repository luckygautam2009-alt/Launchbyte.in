"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Compass, Shield, Terminal, Users } from "lucide-react";

export default function CosmicExplorerSection() {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section className="relative w-full min-h-[640px] sm:min-h-[760px] lg:min-h-[860px] flex flex-col justify-between overflow-hidden bg-[#050510]">
      {/* Top Transition Blend with Previous Section */}
      <div className="absolute top-0 inset-x-0 h-32 sm:h-44 bg-gradient-to-b from-[#050510] via-[#050510]/80 to-transparent z-20 pointer-events-none" />

      {/* Primary Visual Background: Astronaut on Alien Planet Reference Asset */}
      <div className="absolute inset-0 z-0">
        <img
          src="/brand/alien-planet-universe.jpg"
          alt="Astronaut looking out across the cosmic universe on an alien planet"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover object-bottom select-none transition-opacity duration-1000 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            // Keep the composition authentic without stretching or distorting
            objectPosition: "center 75%",
          }}
        />

        {/* Ambient Cosmic Violet & Electric Blue Glow Enhancements */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]/60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      </div>

      {/* Atmospheric Space Particles Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-16 left-[15%] w-1.5 h-1.5 rounded-full bg-violet-200/80 animate-star-twinkle" />
        <div className="absolute top-28 right-[20%] w-2 h-2 rounded-full bg-cyan-200/90 animate-star-twinkle-delayed" />
        <div className="absolute top-44 left-[35%] w-1 h-1 rounded-full bg-indigo-200/70 animate-star-twinkle-slow" />
        <div className="absolute top-36 right-[38%] w-1.5 h-1.5 rounded-full bg-violet-300/80 animate-star-twinkle" />
        <div className="absolute top-52 right-[12%] w-1 h-1 rounded-full bg-cyan-100/60 animate-star-twinkle-delayed" />
        <div className="absolute top-20 left-[48%] w-1 h-1 rounded-full bg-white/70 animate-star-twinkle-slow" />
      </div>

      {/* Safe Upper Zone: Content and Headlines positioned strictly in the upper nebula sky */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 text-center space-y-6">
        {/* Editorial Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-[11px] sm:text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md shadow-lg shadow-violet-950/40">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>The LaunchByte Frontier</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        </div>

        {/* Section Heading */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.15]">
          A Vast Universe of <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#22D3EE] bg-clip-text text-transparent">
            Builder Possibilities.
          </span>
        </h2>

        {/* Subtitle Description */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base lg:text-lg text-[#B8BAD0] leading-relaxed font-normal">
          Where ambitious students step beyond standard classroom boundaries, discover high-impact hackathons, form squads, and ship technology that shapes the future.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/events"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all flex items-center gap-2 group"
          >
            <span>Explore Hackathons</span>
            <ArrowRight className="w-4 h-4 text-violet-200 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/opportunities"
            className="px-5 py-2.5 rounded-xl bg-[#09091B]/80 hover:bg-violet-950/50 border border-violet-500/30 hover:border-violet-500/60 text-[#F8FAFC] text-xs sm:text-sm font-semibold backdrop-blur-md transition-all flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Discover Fellowships</span>
          </Link>
        </div>
      </div>

      {/* Atmospheric Mid-Level Subtle Horizon Telemetry (Left & Right margins only, keeping center astronaut pristine) */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-6 lg:px-8 pb-8 sm:pb-12 flex items-end justify-between pointer-events-none">
        {/* Left Telemetry */}
        <div className="hidden sm:flex flex-col gap-1 text-[11px] font-mono text-[#B8BAD0]/70">
          <div className="flex items-center gap-1.5 text-violet-400">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="uppercase tracking-wider">Sector: LaunchByte</span>
          </div>
          <span className="text-[10px] text-slate-500">Coordinates: 01.LB // 2026.EXP</span>
        </div>

        {/* Center Space Left Strictly Blank: The Astronaut Stands Uncovered */}
        <div className="w-1" />

        {/* Right Telemetry */}
        <div className="hidden sm:flex flex-col items-end gap-1 text-[11px] font-mono text-[#B8BAD0]/70">
          <span className="text-[10px] text-slate-500">Autonomous Ecosystem</span>
          <span className="text-cyan-400 font-semibold uppercase tracking-wider">Zero Barriers • 100% Student Driven</span>
        </div>
      </div>

      {/* Bottom Gradient Blend with Next Section */}
      <div className="absolute bottom-0 inset-x-0 h-32 sm:h-44 bg-gradient-to-t from-[#050510] via-[#050510]/80 to-transparent z-20 pointer-events-none" />
    </section>
  );
}
