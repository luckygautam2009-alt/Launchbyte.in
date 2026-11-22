"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, Trophy, Rocket, Compass } from "lucide-react";

export default function FinalDestinationSection() {
  return (
    <section className="relative py-28 bg-[#070716] overflow-hidden border-t border-purple-900/20">
      {/* Planetary Horizon on bottom-left */}
      <div className="absolute -bottom-20 -left-20 w-[450px] sm:w-[600px] aspect-square rounded-full opacity-60 pointer-events-none overflow-hidden">
        <Image
          src="/brand/bottom-planet.jpg"
          alt="Glowing Purple Planetary Horizon"
          fill
          className="object-contain filter blur-[1px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070716] via-transparent to-transparent opacity-80" />
      </div>

      {/* Ambient background glows */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[400px] bg-purple-700/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left / Center Stats Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-[#0B0B1D]/80 border border-purple-900/30 backdrop-blur-md flex flex-col items-center text-center space-y-2 hover:border-purple-500/40 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-1">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-white font-mono tracking-tight">10K+</p>
              <p className="text-xs text-slate-400 font-medium">Community Members</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0B0B1D]/80 border border-purple-900/30 backdrop-blur-md flex flex-col items-center text-center space-y-2 hover:border-indigo-500/40 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-1">
                <Trophy className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-indigo-300 font-mono tracking-tight">100+</p>
              <p className="text-xs text-slate-400 font-medium">Hackathons & Events</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0B0B1D]/80 border border-purple-900/30 backdrop-blur-md flex flex-col items-center text-center space-y-2 hover:border-cyan-500/40 transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-1">
                <Rocket className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-cyan-300 font-mono tracking-tight">50+</p>
              <p className="text-xs text-slate-400 font-medium">Opportunities</p>
            </div>
          </div>

          {/* Right Destination Headline & CTAs */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-purple-400 block">
                Final Destination
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-display">
                Be a Part of{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                  LaunchByte
                </span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-1">
                Let's build, learn and grow together. Your next hackathon victory or breakthrough project starts right here.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all hover:scale-[1.03] active:scale-[0.98] border border-purple-400/30"
              >
                <span>Join Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-purple-900/40 text-slate-200 hover:text-white font-medium text-sm transition-all"
              >
                <Compass className="w-4 h-4 text-purple-400" />
                <span>Explore Opportunities</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
