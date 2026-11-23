"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Compass } from "lucide-react";
import HeroCosmicScene from "./HeroCosmicScene";

export default function CosmicExplorerSection() {
  return (
    <section className="relative w-full min-h-[580px] sm:min-h-[680px] lg:min-h-[760px] flex flex-col justify-between overflow-hidden bg-[#050510]">
      {/* Top Transition Blend with Previous Section */}
      <div className="absolute top-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-b from-[#050510] via-[#050510]/80 to-transparent z-20 pointer-events-none" />

      {/* Ambient Cosmic Radial Violet & Electric Blue Lighting (Clean dark space, no external photo bg) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Hero Cosmic Scene: Floating CSS/SVG Planets, Twinkling Stars & Subtle Parallax */}
      <HeroCosmicScene />

      {/* Content & Headlines */}
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

      {/* Spacer to give room for the floating planets */}
      <div className="h-44 sm:h-52 pointer-events-none" />

      {/* Bottom Gradient Blend with Next Section */}
      <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-t from-[#050510] via-[#050510]/80 to-transparent z-20 pointer-events-none" />
    </section>
  );
}
