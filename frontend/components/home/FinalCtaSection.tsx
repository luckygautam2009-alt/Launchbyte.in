"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, LayoutDashboard, ShieldCheck, Users, Trophy } from "lucide-react";
import { Reveal, MagneticButton } from "./HomeMotion";
import RevealHeading from "@/components/ui/RevealHeading";
import { useAuth } from "@/lib/auth-context";

export default function FinalCtaSection() {
  const { user, loading } = useAuth();
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const rocketY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 bg-transparent overflow-hidden"
    >
      {/* Background Cinematic Nebula */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/brand/rocket-nebula.webp"
          alt="Cinematic rocket nebula background"
          fill
          className="object-cover select-none opacity-30 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/40 to-[#050510]" />
      </div>

      {/* Subtle Rising Rocket on Scroll (Desktop) */}
      <div className="hidden lg:block absolute right-[6%] bottom-0 z-10 pointer-events-none">
        {shouldReduceMotion ? (
          <div className="w-64 sm:w-72 h-auto opacity-80 drop-shadow-[0_0_40px_rgba(139,92,246,0.4)]">
            <Image
              src="/brand/launchbyte-mission-rocket.webp"
              alt=""
              width={288}
              height={400}
              aria-hidden="true"
              className="w-full h-auto select-none"
            />
          </div>
        ) : (
          <motion.div
            style={{ y: rocketY }}
            className="w-64 sm:w-72 h-auto opacity-85 drop-shadow-[0_0_45px_rgba(139,92,246,0.45)] will-change-transform"
          >
            <Image
              src="/brand/launchbyte-mission-rocket.webp"
              alt=""
              width={288}
              height={400}
              aria-hidden="true"
              className="w-full h-auto select-none"
            />
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        {/* Main Heading & Subtitle */}
        <Reveal delay={0.1}>
          <div className="space-y-4">
            <RevealHeading
              text="Ready to Build Your Next Breakthrough?"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.15]"
            />

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#CBD5E1] leading-relaxed font-normal">
              Team up with builders, explore verified hackathons and fellowships, and ship real software on LaunchByte.
            </p>
          </div>
        </Reveal>

        {/* Strong Primary CTA + Secondary Link */}
        <Reveal delay={0.2}>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {loading ? (
              <div
                aria-hidden="true"
                className="w-[196px] h-[56px] rounded-2xl bg-violet-950/20 border border-violet-500/20 animate-pulse"
              />
            ) : user ? (
              <MagneticButton strength={0.3}>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#8B5CF6] hover:from-[#4338CA] hover:via-[#6D28D9] hover:to-[#7C3AED] text-white text-sm sm:text-base font-bold shadow-2xl shadow-violet-500/40 transition-all flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none group"
                >
                  <LayoutDashboard className="w-4 h-4 text-violet-200" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-violet-200 transition-transform group-hover:translate-x-1" />
                </Link>
              </MagneticButton>
            ) : (
              <MagneticButton strength={0.3}>
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#8B5CF6] hover:from-[#4338CA] hover:via-[#6D28D9] hover:to-[#7C3AED] text-white text-sm sm:text-base font-bold shadow-2xl shadow-violet-500/40 transition-all flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none group"
                >
                  <span>Join LaunchByte</span>
                  <ArrowRight className="w-4 h-4 text-violet-200 transition-transform group-hover:translate-x-1" />
                </Link>
              </MagneticButton>
            )}

            <MagneticButton strength={0.2}>
              <Link
                href="/opportunities"
                className="px-7 py-4 rounded-2xl glass-card glow-hover text-[#F8FAFC] text-sm sm:text-base font-semibold backdrop-blur-md transition-all flex items-center gap-2 shadow-lg focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                <Trophy className="w-4 h-4 text-cyan-400" />
                <span>Browse Opportunities</span>
              </Link>
            </MagneticButton>
          </div>
        </Reveal>

        {/* Highlights */}
        <Reveal delay={0.3}>
          <div className="pt-8 border-t border-slate-800/80 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Free for Students</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-violet-400" />
              <span>Team & Squad Matching</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span>Verified Event Listings</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
