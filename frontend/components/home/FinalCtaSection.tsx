"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Users, Trophy } from "lucide-react";

export default function FinalCtaSection() {
  return (
    <section className="relative py-24 sm:py-32 bg-[#050510] overflow-hidden">
      {/* Background Cinematic Nebula Glow & Space Grid */}
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-violet-600/20 via-indigo-600/15 to-cyan-500/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Atmospheric Star Sparks */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-12 left-1/4 w-2 h-2 rounded-full bg-violet-300 animate-star-twinkle" />
        <div className="absolute bottom-16 right-1/4 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-star-twinkle-delayed" />
        <div className="absolute top-1/3 right-1/6 w-1 h-1 rounded-full bg-indigo-200 animate-star-twinkle-slow" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        {/* Editorial Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/70 border border-violet-500/40 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md shadow-lg shadow-violet-950/50">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Launch Your Trajectory</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        </div>

        {/* Main Heading */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.15]">
            Ready to Build Your <br />
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#22D3EE] bg-clip-text text-transparent">
              Next Breakthrough?
            </span>
          </h2>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#B8BAD0] leading-relaxed font-normal">
            Join thousands of student developers teaming up, claiming prize pools, and landing high-impact software careers on LaunchByte.
          </p>
        </div>

        {/* Prominent Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/register"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#8B5CF6] hover:from-[#4338CA] hover:via-[#6D28D9] hover:to-[#7C3AED] text-white text-sm sm:text-base font-bold shadow-2xl shadow-violet-500/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2.5 group"
          >
            <span>Create Free Builder Account</span>
            <ArrowRight className="w-4 h-4 text-violet-200 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/events"
            className="px-8 py-4 rounded-2xl bg-[#09091B]/90 hover:bg-violet-950/60 border border-violet-500/30 hover:border-violet-500/60 text-[#F8FAFC] text-sm sm:text-base font-semibold backdrop-blur-md transition-all flex items-center gap-2 shadow-lg shadow-black/40"
          >
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span>Browse Active Hackathons</span>
          </Link>
        </div>

        {/* Trust & Guarantee Indicators */}
        <div className="pt-8 border-t border-slate-800/80 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
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
      </div>
    </section>
  );
}
