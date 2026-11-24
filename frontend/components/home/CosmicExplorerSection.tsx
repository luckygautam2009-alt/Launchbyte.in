"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, Compass, Trophy, Users } from "lucide-react";
import { useReducedMotion } from "framer-motion";

// Lazy-load Three.js WebGL canvas (zero SSR hydration errors, paused when off-screen)
const SolarSystemCanvas = dynamic(() => import("./SolarSystemCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#050510]">
      <Image
        src="/brand/universe-cosmic-backdrop.webp"
        alt="Cosmic universe backdrop"
        fill
        sizes="100vw"
        className="object-cover select-none opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]" />
    </div>
  ),
});

export default function CosmicExplorerSection() {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const miniCards = [
    {
      title: "Hackathons",
      tagline: "Compete in high-stakes 24–48h sprints & win prizes.",
      href: "/events",
      icon: Trophy,
      accent: "text-violet-400",
      accentBg: "bg-violet-500/15 border-violet-500/30",
      badge: "Sprints",
    },
    {
      title: "Fellowships",
      tagline: "Grants, research fellowships & funded tech programs.",
      href: "/opportunities",
      icon: Compass,
      accent: "text-cyan-400",
      accentBg: "bg-cyan-500/15 border-cyan-500/30",
      badge: "Grants",
    },
    {
      title: "Teams",
      tagline: "Find complementary builders & assemble your crew.",
      href: "/teams",
      icon: Users,
      accent: "text-indigo-400",
      accentBg: "bg-indigo-500/15 border-indigo-500/30",
      badge: "Squads",
    },
  ];

  return (
    <section className="relative w-full min-h-[780px] sm:min-h-[860px] lg:min-h-[940px] flex flex-col justify-between overflow-hidden bg-[#050510]">
      {/* Top Transition Blend with Section 2 (OrbitalBrandSection) */}
      <div className="absolute top-0 inset-x-0 h-32 sm:h-44 bg-gradient-to-b from-[#050510] via-[#050510]/80 to-transparent z-20 pointer-events-none" />

      {/* Background: Three.js SolarSystemCanvas or Static Reduced-Motion Fallback */}
      <div className="absolute inset-0 z-0">
        {mounted && shouldReduceMotion ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#050510]">
            <img
              src="/brand/universe-cosmic-backdrop.jpg"
              alt="Cosmic universe backdrop"
              className="w-full h-full object-cover select-none"
            />
            <div className="absolute inset-0 bg-[#050510]/40" />
          </div>
        ) : (
          <SolarSystemCanvas
            className="absolute inset-0 w-full h-full"
            showForegroundAstronaut={false}
          />
        )}

        {/* Ambient Cosmic Violet & Electric Blue Glow Highlights */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]/60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Safe Upper Content Zone with Radial Dark Scrim for Crisp Text Readability */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 text-center space-y-6">
        {/* Radial Dark Scrim */}
        <div className="absolute -inset-x-8 -inset-y-6 bg-[radial-gradient(ellipse_at_center,rgba(5,5,16,0.85)_0%,rgba(5,5,16,0.55)_55%,transparent_75%)] -z-10 pointer-events-none rounded-3xl" />

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

      {/* Over-the-scene Glass Mini-Cards Row */}
      <div className="relative z-20 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {miniCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link
                key={i}
                href={card.href}
                className="glass-card glow-hover group p-4 sm:p-5 rounded-2xl flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.accentBg}`}
                    >
                      <Icon className={`w-4 h-4 ${card.accent}`} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/5">
                      {card.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-violet-200 transition-colors flex items-center gap-1">
                      <span>{card.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-violet-400" />
                    </h3>
                    <p className="text-xs text-[#B8BAD0] leading-relaxed mt-1">
                      {card.tagline}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Gradient Blend into Section 4 (AboutLaunchByteSection) */}
      <div className="absolute bottom-0 inset-x-0 h-32 sm:h-44 bg-gradient-to-t from-[#050510] via-[#050510]/80 to-transparent z-20 pointer-events-none" />
    </section>
  );
}
