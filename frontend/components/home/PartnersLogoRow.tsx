"use client";

import React from "react";
import { SITE_CONTENT, PartnerLogo } from "@/lib/siteContent";
import { Sparkles } from "lucide-react";
import { Reveal } from "./HomeMotion";

export default function PartnersLogoRow() {
  const partners: PartnerLogo[] = SITE_CONTENT.partners;

  if (!partners || partners.length === 0) {
    return (
      <section className="relative py-12 bg-[#050510] border-y border-violet-950/40 text-center">
        <p className="text-xs text-slate-500 font-mono">
          Partner organizations & sponsor networks updating soon.
        </p>
      </section>
    );
  }

  // Duplicate for smooth seamless infinite marquee loop
  const marqueeItems = [...partners, ...partners, ...partners, ...partners];

  return (
    <section className="relative py-16 sm:py-20 bg-[#050510] border-y border-violet-950/40 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-15 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Reveal>
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold block">
              Ecosystem Collaborators & Sponsors
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
              Trusted by Developer Communities & Campus Chapters
            </h3>
          </div>
        </Reveal>

        {/* Slow Infinite Marquee Strip: Pause on hover */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee-slow flex items-center gap-6 py-2">
            {marqueeItems.map((p, idx) => (
              <div
                key={`${p.id}-${idx}`}
                className="group relative w-64 p-4 rounded-2xl glass-card glow-hover flex items-center gap-4 transition-all duration-300 filter grayscale hover:grayscale-0 cursor-default shrink-0"
              >
                {/* Brand Symbol */}
                <div className="w-11 h-11 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-white font-mono font-bold text-xs shadow-md group-hover:scale-105 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all shrink-0">
                  <span className="bg-gradient-to-tr from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                    {p.symbol}
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors block truncate">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block truncate">
                    {p.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
