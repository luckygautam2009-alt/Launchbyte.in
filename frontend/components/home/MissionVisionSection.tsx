"use client";

import React from "react";
import { SITE_CONTENT } from "@/lib/siteContent";
import { Compass, Eye, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal, MagneticButton } from "./HomeMotion";

export default function MissionVisionSection() {
  const { eyebrow, heading, mission, vision } = SITE_CONTENT.missionVision;

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{eyebrow}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight">
              {heading}
            </h2>
          </div>
        </Reveal>

        {/* Mission and Vision Bento Duo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Mission Card */}
          <Reveal delay={0.1} className="flex">
            <div className="group relative w-full p-8 sm:p-10 rounded-3xl glass-card glow-hover flex flex-col justify-between space-y-8 transition-all duration-300">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-violet-900/30">
                    <Compass className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono tracking-wider text-violet-300 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-500/30">
                    The Mission
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">
                    {mission.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                    {mission.statement}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {mission.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  Driven by open code
                </span>
                <MagneticButton>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cyan-300 hover:text-white transition-colors"
                  >
                    <span>Read Company Story</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </MagneticButton>
              </div>
            </div>
          </Reveal>

          {/* Vision Card */}
          <Reveal delay={0.2} className="flex">
            <div className="group relative w-full p-8 sm:p-10 rounded-3xl glass-card glow-hover flex flex-col justify-between space-y-8 transition-all duration-300">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-900/30">
                    <Eye className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono tracking-wider text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                    The Long View
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">
                    {vision.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                    {vision.statement}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {vision.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  Global student ecosystem
                </span>
                <MagneticButton>
                  <Link
                    href="/opportunities"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-violet-300 hover:text-white transition-colors"
                  >
                    <span>View Opportunities</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </MagneticButton>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
