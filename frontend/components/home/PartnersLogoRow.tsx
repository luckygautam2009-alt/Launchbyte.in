"use client";

import React from "react";
import { SITE_CONTENT, DeveloperCommunity } from "@/lib/siteContent";
import { ExternalLink } from "lucide-react";
import { Reveal } from "./HomeMotion";

export default function PartnersLogoRow() {
  const communities: DeveloperCommunity[] = SITE_CONTENT.developerCommunities;

  if (!communities || communities.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 sm:py-20 bg-[#050510] overflow-hidden">
      <div className="absolute inset-0 bg-space-grid opacity-15 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Reveal>
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold block">
              Ecosystem
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F8FAFC]">
              Developer Communities
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Communities building together across campus chapters and technical collectives.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {communities.map((c, idx) => (
            <Reveal key={c.id} delay={0.05 * idx}>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${c.name} official website`}
                className="group h-full p-5 rounded-2xl glass-card glow-hover border border-white/[0.08] hover:border-cyan-400/40 flex flex-col justify-between gap-3 transition-all duration-300"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-white leading-snug">
                      {c.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 shrink-0 mt-0.5 transition-colors" />
                  </div>
                  {c.shortLabel && (
                    <span className="text-[11px] font-mono text-slate-400 block">
                      {c.shortLabel}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-cyan-400/80 group-hover:text-cyan-300 transition-colors">
                  Visit Website →
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
