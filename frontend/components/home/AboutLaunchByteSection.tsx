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
  Trophy,
  Award,
} from "lucide-react";

export default function AboutLaunchByteSection() {
  const pillars = [
    {
      icon: Compass,
      title: "Opportunity Discovery",
      description:
        "Verified hackathons, developer fellowships, and high-impact internships curated with zero spam, guaranteed prize pools, and transparent judging rubrics.",
      badge: "Curated & Verified",
      color: "from-violet-500/20 to-indigo-500/10",
      borderColor: "border-violet-500/30",
      iconColor: "text-violet-400",
    },
    {
      icon: Zap,
      title: "Skill Acceleration",
      description:
        "Real-world building sprints and hands-on masterclasses that transform textbook concepts into deployable full-stack software and verified portfolio entries.",
      badge: "Real-World Experience",
      color: "from-blue-500/20 to-cyan-500/10",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
    },
    {
      icon: Users,
      title: "Teammate Synergy",
      description:
        "Intelligent matchmaking pairing builders across complementary skillsets—frontend architects, systems engineers, and designers ready to sprint together.",
      badge: "Squad Finder",
      color: "from-cyan-500/20 to-teal-500/10",
      borderColor: "border-cyan-500/30",
      iconColor: "text-cyan-400",
    },
    {
      icon: ShieldCheck,
      title: "Verifiable Credibility",
      description:
        "Cryptographically signed proof of attendance, digital builder credentials, and transparent host records that make your achievements indisputable.",
      badge: "Verified Reputation",
      color: "from-emerald-500/20 to-violet-500/10",
      borderColor: "border-emerald-500/30",
      iconColor: "text-emerald-400",
    },
  ];

  const metrics = [
    { value: "10,000+", label: "Student Builders", highlight: "Active across 50+ campuses" },
    { value: "$150,000+", label: "Prizes & Grants Won", highlight: "Transparently disbursed" },
    { value: "450+", label: "Verified Opportunities", highlight: "Zero scam rate" },
    { value: "100%", label: "Free for Students", highlight: "No hidden paywalls" },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience & Delicate Grid */}
      <div className="absolute inset-0 bg-space-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>What Is LaunchByte?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight">
            The Launchpad Built by Builders, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#22D3EE] bg-clip-text text-transparent">
              for the Next Generation of Tech.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B8BAD0] leading-relaxed font-normal">
            Legacy student portals are slow, cluttered with sponsored spam, and disconnected from real developer needs. LaunchByte is an integrated platform engineered to help students discover opportunities, assemble squads, ship real products, and launch careers in tech.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className={`relative p-7 sm:p-8 rounded-3xl bg-[#09091B]/80 border ${pillar.borderColor} hover:border-violet-400/60 transition-all duration-300 shadow-xl shadow-black/40 group hover:-translate-y-1`}
              >
                {/* Subtle Inner Glow */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${pillar.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />

                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-center shadow-inner">
                      <Icon className={`w-6 h-6 ${pillar.iconColor}`} />
                    </div>
                    <span className="text-[11px] font-mono tracking-wider text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#F8FAFC] group-hover:text-white transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-sm text-[#B8BAD0] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Impact Metrics Strip */}
        <div className="rounded-3xl bg-gradient-to-r from-violet-950/40 via-slate-900/60 to-indigo-950/40 border border-violet-500/20 p-6 sm:p-10 backdrop-blur-md">
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
      </div>
    </section>
  );
}
