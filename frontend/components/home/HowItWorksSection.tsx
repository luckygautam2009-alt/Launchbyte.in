"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  Terminal,
  Trophy,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Cpu,
  Layers,
  Award,
} from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      name: "DISCOVER",
      phase: "Cosmic Reconnaissance",
      title: "Explore Verified Tech Opportunities",
      description:
        "Filter through high-tier hackathons, grants, and internships. Every event is verified with real prize pools, transparent rubrics, and zero clutter.",
      icon: Compass,
      accent: "#8B5CF6", // Violet
      glow: "shadow-violet-500/20",
      bullets: [
        "Curated by developer relevance and tech stack",
        "Transparent judging rubrics & escrow verification",
        "Custom alerts for upcoming registration deadlines",
      ],
      linkText: "Find Competitions",
      linkHref: "/events",
    },
    {
      step: "02",
      name: "PARTICIPATE",
      phase: "Sprint Assembly",
      title: "Assemble Squads & Build in Sprints",
      description:
        "Match with complementary developers in the squad finder, generate your offline-ready QR pass, and build high-performance software during 48-hour sprints.",
      icon: Terminal,
      accent: "#3B82F6", // Electric Blue
      glow: "shadow-blue-500/20",
      bullets: [
        "One-click squad creation & shareable invite tokens",
        "Instant QR badge generation for live check-in",
        "In-app team chat & submission management",
      ],
      linkText: "Form a Team",
      linkHref: "/teams",
    },
    {
      step: "03",
      name: "GROW",
      phase: "Ascent & Validation",
      title: "Claim Prizes & Launch Your Career",
      description:
        "Deploy your builds, earn cryptographically verifiable credentials, split cash prizes directly, and get scouted by engineering recruiters and founders.",
      icon: Trophy,
      accent: "#22D3EE", // Cyan
      glow: "shadow-cyan-500/20",
      bullets: [
        "Verifiable proof-of-execution on your builder profile",
        "Direct access to startup seed grants & bounties",
        "High-priority recruiter intros for top performers",
      ],
      linkText: "Join Network",
      linkHref: "/network",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-violet-900/10 via-blue-900/10 to-cyan-900/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>The 3-Step Journey</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight">
            How It Works: <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#22D3EE] bg-clip-text text-transparent">
              From Curiosity to Shipped Software.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B8BAD0] leading-relaxed font-normal">
            A frictionless, streamlined progression designed to take any student from browsing to winning hackathons and claiming career breakthroughs.
          </p>
        </div>

        {/* 3 Step Trajectory Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Connecting Trajectory Glow Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-violet-500/40 via-blue-500/40 to-cyan-500/40 -translate-y-8 z-0 pointer-events-none" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative z-10 p-8 rounded-3xl bg-[#09091B]/95 border border-slate-800/90 hover:border-violet-500/50 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/50 hover:-translate-y-2 group"
              >
                <div className="space-y-6">
                  {/* Step Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg"
                      style={{
                        backgroundColor: `${step.accent}18`,
                        border: `1px solid ${step.accent}50`,
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: step.accent }} />
                    </div>

                    <div className="text-right">
                      <span
                        className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tighter"
                        style={{ color: step.accent }}
                      >
                        {step.step}
                      </span>
                      <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        {step.name}
                      </span>
                    </div>
                  </div>

                  {/* Title & Phase */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      Phase: {step.phase}
                    </span>
                    <h3 className="text-xl font-bold text-[#F8FAFC] leading-snug group-hover:text-white transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#B8BAD0] leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Bullets */}
                  <ul className="space-y-2.5 pt-2 border-t border-slate-800/70">
                    {step.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2
                          className="w-3.5 h-3.5 shrink-0 mt-0.5"
                          style={{ color: step.accent }}
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Action */}
                <div className="pt-6 mt-6 border-t border-slate-800/80">
                  <Link
                    href={step.linkHref}
                    className="inline-flex items-center gap-2 text-xs font-semibold transition-all group-hover:translate-x-1"
                    style={{ color: step.accent }}
                  >
                    <span>{step.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
