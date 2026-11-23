"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Sparkles, Compass } from "lucide-react";

// Client-only dynamic import of the Three.js WebGL canvas (zero SSR hydration errors)
const SolarSystemCanvas = dynamic(() => import("./SolarSystemCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[700px] sm:h-[800px] lg:h-[900px] flex items-center justify-center bg-[#050510]">
      <div className="flex flex-col items-center gap-3 text-violet-400 animate-pulse">
        <Compass className="w-8 h-8 animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
          Initializing 3D Planetary Universe...
        </span>
      </div>
    </div>
  ),
});

export default function SolarSystemSection() {
  return (
    <section
      id="solar-system"
      aria-label="LaunchByte 3D Solar System"
      className="relative w-full py-20 sm:py-28 lg:py-36 scroll-mt-20 bg-[#050510] overflow-hidden select-none"
    >
      {/* Background Ambience & Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#09091B]/80 to-[#050510] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[500px] rounded-full bg-violet-600/[0.06] blur-[160px] pointer-events-none" />

      {/* Top subtle boundary line from previous section */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent pointer-events-none" />

      {/* Editorial Header */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-8 sm:mb-12 z-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-violet-500/30 bg-violet-950/40 text-violet-300 text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
          <span>Interactive 3D Universe</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
          What Will You Discover{" "}
          <span className="bg-gradient-to-r from-white via-[#F8FAFC] to-[#A78BFA] bg-clip-text text-transparent">
            on LaunchByte?
          </span>
        </h2>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#B8BAD0] leading-relaxed font-normal">
          Your Universe of Possibilities. Hover or tap a planet to explore hackathons,
          fellowships, community networks, and live builder projects.
        </p>
      </div>

      {/* Genuine 3D Interactive Three.js Planetary Scene */}
      <div className="relative z-10 w-full">
        <SolarSystemCanvas />
      </div>

      {/* Bottom subtle boundary line */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent pointer-events-none" />
    </section>
  );
}
