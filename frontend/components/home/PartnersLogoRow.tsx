"use client";

import React from "react";
import { SITE_CONTENT, DeveloperCommunity } from "@/lib/siteContent";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./HomeMotion";

export default function PartnersLogoRow() {
  const communities: DeveloperCommunity[] = SITE_CONTENT.developerCommunities;

  if (!communities || communities.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 sm:py-24 bg-transparent overflow-hidden">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
        <Reveal>
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              Connected Communities
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Discover communities contributing to India&apos;s growing developer ecosystem.
            </p>
          </div>
        </Reveal>

        {/* Restrained Editorial Horizontal Layout — Elegant Text Links (No Boxed Cards or Fake Logos) */}
        <Reveal delay={0.08}>
          <nav
            aria-label="Connected Developer Communities"
            className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4 pt-2 border-y border-white/[0.06] py-8"
          >
            {communities.map((c, idx) => (
              <React.Fragment key={c.id}>
                {idx > 0 && (
                  <span
                    aria-hidden="true"
                    className="hidden sm:inline text-slate-700 font-light select-none"
                  >
                    /
                  </span>
                )}
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${c.name} official website`}
                  className="group inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-slate-300 hover:text-cyan-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md px-1 py-0.5"
                >
                  <span className="border-b border-transparent group-hover:border-cyan-400/50 transition-colors">
                    {c.name}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </a>
              </React.Fragment>
            ))}
          </nav>
        </Reveal>
      </div>
    </section>
  );
}
