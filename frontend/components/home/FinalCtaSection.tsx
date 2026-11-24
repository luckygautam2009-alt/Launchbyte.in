"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Users, Trophy } from "lucide-react";
import { Reveal, MagneticButton } from "./HomeMotion";

export default function FinalCtaSection() {
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
      className="relative py-28 sm:py-36 bg-[#050510] overflow-hidden"
    >
      {/* Background Cinematic Nebula */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/brand/rocket-nebula.webp"
          alt="Cinematic rocket nebula background"
          fill
          sizes="100vw"
          className="object-cover select-none opacity-40 mix-blend-screen"
        />
        {/* Dark radial and gradient scrims for pristine text contrast >= 4.5:1 */}
        <div className="absolute inset-0 bg-[#050510]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-transparent to-[#050510]" />
      </div>

      {/* Subtle Rising Rocket on Scroll (Desktop) */}
      <div className="hidden lg:block absolute right-[6%] bottom-0 z-10 pointer-events-none">
        {shouldReduceMotion ? (
          <div className="w-64 sm:w-72 h-auto opacity-80 drop-shadow-[0_0_40px_rgba(139,92,246,0.4)]">
            <Image
              src="/brand/launchbyte-mission-rocket.webp"
              alt=""
              aria-hidden="true"
              width={682}
              height={1024}
              className="w-full h-auto select-none"
            />
          </div>
        ) : (
          <motion.div
            style={{ y: rocketY }}
            className="w-64 sm:w-72 h-auto opacity-80 drop-shadow-[0_0_40px_rgba(139,92,246,0.4)]"
          >
            <Image
              src="/brand/launchbyte-mission-rocket.webp"
              alt=""
              aria-hidden="true"
              width={682}
              height={1024}
              className="w-full h-auto select-none"
            />
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        {/* Editorial Pill */}
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/70 border border-violet-500/40 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md shadow-lg shadow-violet-950/50">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Launch Your Trajectory</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
        </Reveal>

        {/* Main Heading & Subtitle */}
        <Reveal delay={0.1}>
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.15]">
              Ready to Build Your <br />
              <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#22D3EE] bg-clip-text text-transparent">
                Next Breakthrough?
              </span>
            </h2>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#CBD5E1] leading-relaxed font-normal">
              Join thousands of student developers teaming up, claiming verified prize pools, and landing high-impact software careers on LaunchByte.
            </p>
          </div>
        </Reveal>

        {/* Strong Primary CTA + Secondary Link */}
        <Reveal delay={0.2}>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <MagneticButton strength={0.3}>
              <Link
                href="/register"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#8B5CF6] hover:from-[#4338CA] hover:via-[#6D28D9] hover:to-[#7C3AED] text-white text-sm sm:text-base font-bold shadow-2xl shadow-violet-500/40 transition-all flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none group"
              >
                <span>Join LaunchByte — Free for Students</span>
                <ArrowRight className="w-4 h-4 text-violet-200 transition-transform group-hover:translate-x-1" />
              </Link>
            </MagneticButton>

            <MagneticButton strength={0.2}>
              <Link
                href="/events"
                className="px-7 py-4 rounded-2xl glass-card glow-hover text-[#F8FAFC] text-sm sm:text-base font-semibold backdrop-blur-md transition-all flex items-center gap-2 shadow-lg focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                <Trophy className="w-4 h-4 text-cyan-400" />
                <span>Browse Active Hackathons</span>
              </Link>
            </MagneticButton>
          </div>
        </Reveal>

        {/* Trust Indicators */}
        <Reveal delay={0.3}>
          <div className="pt-8 border-t border-slate-800/80 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Free for Students</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-violet-400" />
              <span>Instant Squad Matching</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span>Verified Escrow Rewards</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
