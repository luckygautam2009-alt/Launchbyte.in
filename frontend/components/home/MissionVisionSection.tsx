"use client";

import React from "react";
import { SITE_CONTENT } from "@/lib/siteContent";
import { Compass, Eye, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal, MagneticButton } from "./HomeMotion";

export default function MissionVisionSection() {
  const { heading, mission, vision } = SITE_CONTENT.missionVision;

  return (
    <section className="relative py-16 sm:py-24 bg-transparent overflow-hidden">
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17172B] dark:text-[#F8FAFC] tracking-tight leading-tight">
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
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/80 border border-violet-200 dark:border-violet-500/40 flex items-center justify-center text-[#7552D9] dark:text-cyan-400 shadow-sm dark:shadow-lg dark:shadow-violet-900/30">
                  <Compass className="w-7 h-7" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#17172B] dark:text-[#F8FAFC]">
                    {mission.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#424C63] dark:text-[#CBD5E1] leading-relaxed">
                    {mission.statement}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {mission.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#424C63] dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-[#647084] dark:text-slate-400">
                  Driven by open code
                </span>
                <MagneticButton>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#7552D9] hover:text-[#5B39B8] dark:text-cyan-300 dark:hover:text-white transition-colors"
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
                <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 flex items-center justify-center text-cyan-700 dark:text-cyan-300 shadow-sm dark:shadow-lg dark:shadow-cyan-900/30">
                  <Eye className="w-7 h-7" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#17172B] dark:text-[#F8FAFC]">
                    {vision.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#424C63] dark:text-[#CBD5E1] leading-relaxed">
                    {vision.statement}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {vision.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#424C63] dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-[#7552D9] dark:text-violet-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-[#647084] dark:text-slate-400">
                  Global student ecosystem
                </span>
                <MagneticButton>
                  <Link
                    href="/opportunities"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#7552D9] hover:text-[#5B39B8] dark:text-violet-300 dark:hover:text-white transition-colors"
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
