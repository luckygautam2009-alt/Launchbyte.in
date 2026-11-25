"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  Zap,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import RevealHeading from "@/components/ui/RevealHeading";
import TiltCard from "@/components/ui/TiltCard";
import { Reveal, MagneticButton } from "./HomeMotion";

export default function AboutLaunchByteSection() {
  return (
    <section className="relative py-16 sm:py-24 bg-transparent overflow-hidden">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header (Minimal, Editorial — no generic pill label) */}
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <RevealHeading
              text="The Launchpad Built by Builders, for the Next Generation of Tech."
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight"
            />

            <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed font-normal">
              Legacy student portals are slow, cluttered with spam, and disconnected from real developer needs. LaunchByte is an integrated platform engineered to help students discover verified opportunities, assemble squads, ship real products, and grow in tech.
            </p>
          </div>
        </Reveal>

        {/* 3 Pillars Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 1. Large Pillar (7 columns on desktop) */}
          <Reveal className="lg:col-span-7 flex" delay={0.1}>
            <TiltCard className="p-[1px] rounded-3xl w-full flex">
              <div className="relative rounded-[23px] w-full bg-[#09091B]/85 glass-card glow-hover p-7 sm:p-9 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center shadow-lg shadow-violet-900/30">
                    <Compass className="w-7 h-7 text-cyan-400" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                      Curated Opportunity Engine
                    </h3>
                  </div>

                  <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                    Verified hackathons, developer fellowships, and high-impact internships curated with zero sponsored clutter and transparent evaluation criteria so you can focus on building.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      "Zero spam or unverified listings",
                      "Direct official registration links",
                      "Transparent organizer criteria",
                      "Moderation & quality verification",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    Verified opportunity discovery
                  </span>
                  <MagneticButton>
                    <Link
                      href="/opportunities"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cyan-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1"
                    >
                      <span>Explore Catalog</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </TiltCard>
          </Reveal>

          {/* 2 & 3. Two Stacked Pillars (5 columns on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            <Reveal delay={0.2} className="flex-1 flex">
              <div className="relative p-[1px] rounded-3xl overflow-hidden group w-full flex">
                <div className="relative rounded-[23px] w-full bg-[#09091B]/85 glass-card glow-hover p-6 sm:p-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-400" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#F8FAFC]">
                      Skill Acceleration Sprints
                    </h3>

                    <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                      Hands-on building sprints that turn classroom concepts into deployable full-stack software and real engineering portfolios.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-blue-300">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Real-world production architectures</span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.3} className="flex-1 flex">
              <div className="relative p-[1px] rounded-3xl overflow-hidden group w-full flex">
                <div className="relative rounded-[23px] w-full bg-[#09091B]/85 glass-card glow-hover p-6 sm:p-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#F8FAFC]">
                      Team & Squad Discovery
                    </h3>

                    <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                      Find collaborators across complementary skillsets—frontend developers, backend engineers, AI/ML builders, and designers ready to build together.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified student & builder profiles</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
