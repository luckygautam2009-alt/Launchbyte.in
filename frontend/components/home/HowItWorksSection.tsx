"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import {
  Compass,
  Terminal,
  Trophy,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Reveal, MagneticButton } from "./HomeMotion";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import RevealHeading from "@/components/ui/RevealHeading";
import TiltCard from "@/components/ui/TiltCard";

export default function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end 45%"],
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

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
    <section ref={containerRef} className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-violet-900/10 via-blue-900/10 to-cyan-900/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <SectionEyebrow
              stage="STAGE 04 // BUILD"
              badge="The 3-Step Journey"
              accentColor="cyan"
            />

            <RevealHeading
              text="How It Works: From Curiosity to Shipped Software."
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight"
            />

            <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed font-normal">
              A frictionless, streamlined progression designed to take any student from browsing to winning hackathons and claiming career breakthroughs.
            </p>
          </div>
        </Reveal>

        {/* 3 Step Trajectory Cards Joined by an SVG Path */}
        <div className="relative">
          {/* Scroll-Drawn SVG Connecting Line Across the 3 Cards (Desktop) */}
          <div className="hidden lg:block absolute top-[115px] left-[15%] right-[15%] h-12 z-0 pointer-events-none">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 1000 40"
              fill="none"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="orbit-track-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
                <filter id="track-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Dim baseline trajectory */}
              <path
                d="M 0,20 C 250,5 250,35 500,20 C 750,5 750,35 1000,20"
                stroke="rgba(167, 139, 250, 0.15)"
                strokeWidth="3"
                strokeDasharray="6 6"
              />

              {/* Active scroll-drawn stroke */}
              {shouldReduceMotion ? (
                <path
                  d="M 0,20 C 250,5 250,35 500,20 C 750,5 750,35 1000,20"
                  stroke="url(#orbit-track-grad)"
                  strokeWidth="3.5"
                  filter="url(#track-glow)"
                />
              ) : (
                <motion.path
                  d="M 0,20 C 250,5 250,35 500,20 C 750,5 750,35 1000,20"
                  stroke="url(#orbit-track-grad)"
                  strokeWidth="3.5"
                  filter="url(#track-glow)"
                  style={{ pathLength }}
                />
              )}
            </svg>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <Reveal key={idx} delay={0.12 * idx} className="flex">
                  <TiltCard maxTilt={5} className="w-full flex">
                    <div className="group relative w-full p-8 rounded-3xl glass-card glow-hover flex flex-col justify-between space-y-6 transition-all duration-300">
                      <div className="space-y-6">
                        {/* Step Header with Glowing Node Indicator */}
                        <div className="flex items-center justify-between">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg relative"
                            style={{
                              backgroundColor: `${step.accent}18`,
                              border: `1px solid ${step.accent}50`,
                              boxShadow: `0 0 25px -4px ${step.accent}50`,
                            }}
                          >
                            <Icon className="w-7 h-7" style={{ color: step.accent }} />

                            {/* Outer Pulsing Glow Node Ring */}
                            <div
                              className="absolute -inset-1 rounded-2xl opacity-40 group-hover:opacity-100 transition-opacity blur-[2px] pointer-events-none"
                              style={{ border: `1px solid ${step.accent}` }}
                            />
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
                          <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        {/* Bullets */}
                        <ul className="space-y-2.5 pt-3 border-t border-slate-800/80">
                          {step.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2 text-xs text-slate-300">
                              <CheckCircle2
                                className="w-4 h-4 shrink-0 mt-0.5"
                                style={{ color: step.accent }}
                              />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Bottom Action CTA */}
                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400">
                          Zero friction
                        </span>
                        <MagneticButton>
                          <Link
                            href={step.linkHref}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 rounded-lg p-1"
                            style={{ color: step.accent }}
                          >
                            <span>{step.linkText}</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </MagneticButton>
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
