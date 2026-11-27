"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { SITE_CONTENT, DeveloperCommunity } from "@/lib/siteContent";
import { ExternalLink, Network } from "lucide-react";
import { Reveal } from "./HomeMotion";

const CURVE_PATHS: Record<string, { d: string; anchor: string }> = {
  codehive: { d: "M 230,118 C 365,118 395,250 500,250", anchor: "right" },
  codersera: { d: "M 770,118 C 635,118 605,250 500,250", anchor: "left" },
  "gdg-noida": { d: "M 230,382 C 365,382 395,250 500,250", anchor: "right" },
  "gdg-dtc": { d: "M 770,382 C 635,382 605,250 500,250", anchor: "left" },
};

function CommunityNodeCard({
  community,
  isHovered,
  onHover,
  onLeave,
}: {
  community: DeveloperCommunity;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const monogram = community.name
    .split(/\s+/)
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase() && /[A-Za-z]/.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const cardInner = (
    <div
      className={`relative h-full p-5 sm:p-6 rounded-2xl backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-4 border ${
        isHovered
          ? "bg-white dark:bg-[#0D0D26]/90 border-violet-400 dark:border-cyan-400/60 shadow-xl shadow-violet-500/15 dark:shadow-[0_12px_40px_-10px_rgba(34,211,238,0.35),0_0_25px_-5px_rgba(139,92,246,0.4)] -translate-y-1 scale-[1.02]"
          : "bg-white/85 dark:bg-[#09091B]/75 border-slate-200 dark:border-violet-500/20 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:border-violet-300 dark:hover:border-violet-400/40"
      }`}
    >
      {/* Subtle hover corner glow */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 pointer-events-none transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative z-10 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {community.logoUrl ? (
              <img
                src={community.logoUrl}
                alt={`${community.name} logo`}
                className="w-10 h-10 rounded-xl object-contain bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-1.5 shrink-0"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors duration-300 ${
                  isHovered
                    ? "bg-violet-100 dark:bg-cyan-950/70 border-violet-300 dark:border-cyan-400/50 text-[#7552D9] dark:text-cyan-200"
                    : "bg-slate-100 dark:bg-violet-950/70 border-slate-200 dark:border-violet-500/30 text-[#7552D9] dark:text-violet-200"
                }`}
              >
                {monogram || <Network className="w-4 h-4" />}
              </div>
            )}
            <div className="min-w-0">
              {community.shortLabel && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7552D9] dark:text-violet-300/80 block">
                  {community.shortLabel}
                </span>
              )}
              <h3 className="text-base sm:text-lg font-bold text-[#17172B] dark:text-white leading-snug group-hover:text-[#7552D9] dark:group-hover:text-cyan-100 transition-colors">
                {community.name}
              </h3>
            </div>
          </div>

          {community.url && (
            <ExternalLink
              className={`w-4 h-4 shrink-0 mt-1 transition-all duration-300 ${
                isHovered
                  ? "text-[#7552D9] dark:text-cyan-300 scale-110 translate-x-0.5 -translate-y-0.5"
                  : "text-[#647084] dark:text-slate-500"
              }`}
              aria-hidden="true"
            />
          )}
        </div>

        <p className="text-xs sm:text-sm text-[#424C63] dark:text-slate-300/85 leading-relaxed">
          {community.description}
        </p>
      </div>

      {community.url && (
        <div className="relative z-10 pt-2 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#647084] dark:text-slate-500">Student Developer Ecosystem</span>
          <span
            className={`transition-colors ${
              isHovered ? "text-[#7552D9] dark:text-cyan-300" : "text-[#59647A] dark:text-slate-400"
            }`}
          >
            Visit Website →
          </span>
        </div>
      )}
    </div>
  );

  if (community.url && community.url.startsWith("http")) {
    return (
      <a
        href={community.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${community.name} official website`}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onFocus={onHover}
        onBlur={onLeave}
        className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl"
      >
        {cardInner}
      </a>
    );
  }

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="h-full"
    >
      {cardInner}
    </div>
  );
}

function CentralLaunchByteHub({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.div
      animate={reduceMotion ? undefined : { y: [-4, 4, -4] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44 mx-auto select-none"
    >
      {/* Ambient Violet/Indigo/Cyan Halo */}
      <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-violet-600/25 via-indigo-500/20 to-cyan-400/20 blur-2xl animate-pulse pointer-events-none" />
      {/* Outer Orbital Ring */}
      <div className="absolute inset-0 rounded-full border border-violet-500/30 bg-[#08081A]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(139,92,246,0.3)]" />
      <div className="absolute inset-2.5 rounded-full border border-cyan-400/20 pointer-events-none" />

      <div className="relative z-10 w-24 sm:w-28 h-auto aspect-[1024/939] flex items-center justify-center p-2">
        <Image
          src="/brand/launchbyte-navbar-logo.png"
          alt="LaunchByte Hub"
          width={1024}
          height={939}
          className="w-full h-auto object-contain filter drop-shadow-[0_0_16px_rgba(167,139,250,0.45)]"
        />
      </div>
    </motion.div>
  );
}

export default function PartnersLogoRow() {
  const communities: DeveloperCommunity[] = SITE_CONTENT.developerCommunities;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  if (!communities || communities.length === 0) {
    return null;
  }

  const c1 = communities[0]; // CodeHive
  const c2 = communities[1]; // CodersEra
  const c3 = communities[2]; // GDG Noida
  const c4 = communities[3]; // GDG On Campus DTC

  return (
    <section
      aria-label="Connected Communities Ecosystem"
      className="relative py-20 sm:py-28 bg-transparent overflow-hidden"
    >
      {/* Atmospheric Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[440px] bg-gradient-to-r from-violet-700/12 via-indigo-700/10 to-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Heading Block */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17172B] dark:text-[#F8FAFC] tracking-tight">
              Connected Communities
            </h2>
            <p className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#7552D9] via-indigo-600 to-cyan-600 dark:from-violet-300 dark:via-indigo-200 dark:to-cyan-300">
              Together, We Build a Stronger Developer Ecosystem.
            </p>
            <p className="text-sm sm:text-base text-[#424C63] dark:text-slate-300/85 max-w-2xl mx-auto leading-relaxed">
              Discover communities, connect with fellow builders and explore the wider student developer ecosystem.
            </p>
          </div>
        </Reveal>

        {/* ================= DESKTOP RADIAL ECOSYSTEM STAGE (lg+) ================= */}
        <div className="hidden lg:block relative max-w-6xl mx-auto">
          {/* SVG Flowing Energy Conduits & Animated Particles */}
          <svg
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          >
            <defs>
              <linearGradient id="eco-line-base" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id="eco-line-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="1" />
                <stop offset="50%" stopColor="#A78BFA" stopOpacity="1" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="1" />
              </linearGradient>
            </defs>

            {communities.map((comm, idx) => {
              const curve = CURVE_PATHS[comm.id];
              if (!curve) return null;
              const isActive = hoveredId === comm.id;

              return (
                <g key={comm.id}>
                  {/* Glow halo path */}
                  <path
                    id={`eco-path-${comm.id}`}
                    d={curve.d}
                    fill="none"
                    stroke={isActive ? "url(#eco-line-active)" : "url(#eco-line-base)"}
                    strokeWidth={isActive ? 2.6 : 1.5}
                    strokeDasharray="6 6"
                    strokeOpacity={isActive ? 1 : 0.48}
                    className="transition-all duration-300"
                  />

                  {/* Moving Particle travelling along the curve */}
                  {!shouldReduceMotion && (
                    <circle
                      r={isActive ? 4.2 : 2.6}
                      fill={isActive ? "#22D3EE" : "#A78BFA"}
                      opacity={isActive ? 1 : 0.7}
                    >
                      <animateMotion
                        dur={`${3.4 + idx * 0.45}s`}
                        repeatCount="indefinite"
                        path={curve.d}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Architectural Grid Placing 4 Nodes Around the Central Hub */}
          <div className="relative z-10 grid grid-cols-[1fr_210px_1fr] grid-rows-2 gap-x-10 gap-y-14 items-center min-h-[500px]">
            {/* Top-Left: CodeHive */}
            <Reveal delay={0.05} className="col-start-1 row-start-1">
              {c1 && (
                <CommunityNodeCard
                  community={c1}
                  isHovered={hoveredId === c1.id}
                  onHover={() => setHoveredId(c1.id)}
                  onLeave={() => setHoveredId(null)}
                />
              )}
            </Reveal>

            {/* Center Hub spanning vertically between rows */}
            <div className="col-start-2 row-start-1 row-span-2 flex flex-col items-center justify-center">
              <CentralLaunchByteHub reduceMotion={shouldReduceMotion} />
            </div>

            {/* Top-Right: CodersEra */}
            <Reveal delay={0.1} className="col-start-3 row-start-1">
              {c2 && (
                <CommunityNodeCard
                  community={c2}
                  isHovered={hoveredId === c2.id}
                  onHover={() => setHoveredId(c2.id)}
                  onLeave={() => setHoveredId(null)}
                />
              )}
            </Reveal>

            {/* Bottom-Left: GDG Noida */}
            <Reveal delay={0.15} className="col-start-1 row-start-2">
              {c3 && (
                <CommunityNodeCard
                  community={c3}
                  isHovered={hoveredId === c3.id}
                  onHover={() => setHoveredId(c3.id)}
                  onLeave={() => setHoveredId(null)}
                />
              )}
            </Reveal>

            {/* Bottom-Right: GDG On Campus DTC */}
            <Reveal delay={0.2} className="col-start-3 row-start-2">
              {c4 && (
                <CommunityNodeCard
                  community={c4}
                  isHovered={hoveredId === c4.id}
                  onHover={() => setHoveredId(c4.id)}
                  onLeave={() => setHoveredId(null)}
                />
              )}
            </Reveal>
          </div>
        </div>

        {/* ================= TABLET & MOBILE RESPONSIVE ECOSYSTEM (< lg) ================= */}
        <div className="lg:hidden space-y-6">
          <div className="relative flex flex-col items-center">
            <CentralLaunchByteHub reduceMotion={shouldReduceMotion} />
            {/* Simplified Vertical Energy Conduit */}
            <div
              aria-hidden="true"
              className="w-px h-10 bg-gradient-to-b from-violet-400/70 via-cyan-400/50 to-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {communities.map((comm, idx) => (
              <Reveal key={comm.id} delay={0.05 * idx}>
                <CommunityNodeCard
                  community={comm}
                  isHovered={hoveredId === comm.id}
                  onHover={() => setHoveredId(comm.id)}
                  onLeave={() => setHoveredId(null)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
