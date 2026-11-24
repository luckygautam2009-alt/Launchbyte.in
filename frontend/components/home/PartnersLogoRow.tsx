"use client";

import React from "react";
import { SITE_CONTENT, PartnerLogo } from "@/lib/siteContent";
import { ShieldCheck, Building2, Sparkles } from "lucide-react";
import { Reveal } from "./HomeMotion";

export default function PartnersLogoRow() {
  const partners: PartnerLogo[] = SITE_CONTENT.partners;

  return (
    <section className="relative py-16 sm:py-20 bg-[#050510] border-y border-violet-950/40 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-15 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Reveal>
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold block">
              Ecosystem Collaborators & Sponsors
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
              Trusted by Premier Devtools, Venture Labs & Campus Chapters
            </h3>
          </div>
        </Reveal>

        {/* Partners Grid: Grayscale to Color on Hover */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 items-center">
          {partners.map((p, idx) => (
            <Reveal key={p.id} delay={0.05 * idx} className="flex">
              <div
                title={`${p.name} - ${p.category} (TODO: Replace in lib/siteContent.ts)`}
                className="group relative w-full p-4 rounded-2xl glass-card glow-hover flex flex-col items-center justify-center text-center space-y-2 transition-all duration-300 filter grayscale hover:grayscale-0 cursor-default"
              >
                {/* Brand Symbol Placeholder */}
                <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-white font-mono font-bold text-xs shadow-md group-hover:scale-105 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all">
                  <span className="bg-gradient-to-tr from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                    {p.symbol}
                  </span>
                </div>

                <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors line-clamp-1">
                  {p.name}
                </span>

                <span className="text-[9px] font-mono text-slate-500 line-clamp-1">
                  {p.category}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
