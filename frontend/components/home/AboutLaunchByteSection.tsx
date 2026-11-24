"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  Zap,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import RevealHeading from "@/components/ui/RevealHeading";
import TiltCard from "@/components/ui/TiltCard";
import { Reveal, MagneticButton } from "./HomeMotion";

export default function AboutLaunchByteSection() {
  const metrics = [
    { value: "10,000+", label: "Student Builders", highlight: "Active across 50+ campuses" },
    { value: "$150,000+", label: "Prizes & Grants Won", highlight: "Transparently disbursed" },
    { value: "450+", label: "Verified Opportunities", highlight: "Zero scam rate" },
    { value: "100%", label: "Free for Students", highlight: "No hidden paywalls" },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-25 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="flex justify-center">
              <SectionEyebrow stage="ARCHITECTURAL FOUNDATION" />
            </div>

            <RevealHeading
              text="The Launchpad Built by Builders, for the Next Generation of Tech."
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight"
            />

            <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed font-normal">
              Legacy student portals are slow, cluttered with sponsored spam, and disconnected from real developer needs. LaunchByte is an integrated platform engineered to help students discover opportunities, assemble squads, ship real products, and launch careers in tech.
            </p>
          </div>
        </Reveal>

        {/* 3 Pillars Bento Grid: One Large Featured + Two Small */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 1. Large Bento Pillar (7 columns on desktop) */}
          <Reveal className="lg:col-span-7 flex" delay={0.1}>
            <TiltCard className="p-[1px] rounded-3xl w-full flex">
              <div className="relative rounded-[23px] w-full bg-[#09091B]/90 glass-card glow-hover p-7 sm:p-9 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center shadow-lg shadow-violet-900/30">
                      <Compass className="w-7 h-7 text-cyan-400" />
                    </div>
                    <span className="text-xs font-mono tracking-wider text-cyan-300 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-500/30">
                      Flagship Engine
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold">
                      Pillar 01 • Curated Discovery
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                      Curated Opportunity Engine
                    </h3>
                  </div>

                  <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                    Verified hackathons, developer fellowships, and high-impact internships curated with zero sponsored junk, guaranteed escrow prize pools, and transparent judging rubrics so you never waste weekend sprints.
                  </p>

                  {/* Highlights list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      "Zero spam or phantom listings",
                      "Guaranteed prize pool escrow",
                      "Transparent evaluation rubrics",
                      "Automated registration alerts",
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
                    Trusted by 10,000+ student builders
                  </span>
                  <MagneticButton>
                    <Link
                      href="/events"
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

          {/* 2 & 3. Two Small Bento Pillars Stacked (5 columns on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            {/* Pillar 2: Skill Acceleration */}
            <Reveal delay={0.2} className="flex-1 flex">
              <div className="relative p-[1px] rounded-3xl overflow-hidden group w-full flex">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                <div className="relative rounded-[23px] w-full bg-[#09091B]/90 glass-card glow-hover p-6 sm:p-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-[11px] font-mono tracking-wider text-slate-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">
                        Pillar 02
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#F8FAFC]">
                      Skill Acceleration Sprints
                    </h3>

                    <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                      Hands-on 24–48h building sprints that transform textbook concepts into deployable full-stack software and verified portfolio credentials.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-blue-300">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Real-world production architectures</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Pillar 3: Teammate Synergy */}
            <Reveal delay={0.3} className="flex-1 flex">
              <div className="relative p-[1px] rounded-3xl overflow-hidden group w-full flex">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                <div className="relative rounded-[23px] w-full bg-[#09091B]/90 glass-card glow-hover p-6 sm:p-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="text-[11px] font-mono tracking-wider text-slate-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">
                        Pillar 03
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#F8FAFC]">
                      Autonomous Squad Synergy
                    </h3>

                    <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                      Intelligent matchmaking pairing builders across complementary skillsets—frontend architects, systems engineers, and designers ready to sprint together.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified builder reputation system</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Impact Metrics Strip */}
        <Reveal delay={0.4}>
          <div className="rounded-3xl glass-card glow-hover p-6 sm:p-10 border border-violet-500/20 backdrop-blur-md">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {metrics.map((m, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#F8FAFC] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent tracking-tight">
                    {m.value}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-200">
                    {m.label}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {m.highlight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
