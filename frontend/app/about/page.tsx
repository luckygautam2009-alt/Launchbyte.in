"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { TeamMember } from "@/lib/types";
import { SITE_CONTENT } from "@/lib/siteContent";
import PageHero from "@/components/common/PageHero";
import CoreTeamSection from "@/components/home/CoreTeamSection";
import {
  ShieldCheck,
  Zap,
  Users2,
  Sparkles,
  Linkedin,
  Github,
  Loader2,
  CheckCircle,
  Flag,
  Target,
} from "lucide-react";

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPublicTeam()
      .then((members) => setTeam(members))
      .catch(() => setTeam([]))
      .finally(() => setLoading(false));
  }, []);

  const valueIconMap: Record<string, React.ReactNode> = {
    Zap: <Zap className="w-6 h-6 text-indigo-400" />,
    ShieldCheck: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
    Users: <Users2 className="w-6 h-6 text-cyan-400" />,
    Sparkles: <Sparkles className="w-6 h-6 text-purple-400" />,
  };

  return (
    <div className="min-h-screen bg-[#050510] text-[#CBD5E1]">
      {/* 1. PageHero */}
      <PageHero
        eyebrow="THE LAUNCHBYTE STORY"
        title={
          <>
            Where Ambition Meets Opportunity,{" "}
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Built on Trust & Velocity
            </span>
          </>
        }
        subtitle="LaunchByte was created to solve what broken legacy platforms ignore: zero-spam listings, instant hosting setup for organizers, and authentic teammate discovery for hackathon builders."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {/* 2. Our Story Timeline */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/70 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>TRAJECTORY & MILESTONES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              Our Journey So Far
            </h2>
            <p className="text-sm text-slate-400">
              From an internal campus sprint tool to an interconnected student builder network.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto pl-6 sm:pl-0">
            {/* Glowing vertical connector line */}
            <div className="absolute left-6 sm:left-1/2 top-4 bottom-4 -translate-x-1/2 w-0.5 bg-gradient-to-b from-violet-500 via-indigo-500 to-cyan-500 opacity-40" />

            <div className="space-y-12">
              {SITE_CONTENT.storyTimeline.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                    className={`relative flex flex-col sm:flex-row items-start sm:items-center ${
                      isEven ? "sm:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Center Node Marker */}
                    <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center z-10">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                    </div>

                    {/* Content Card */}
                    <div
                      className={`w-full sm:w-[calc(50%-2.5rem)] ml-12 sm:ml-0 ${
                        isEven ? "sm:text-left sm:pl-0 sm:pr-8" : "sm:text-left sm:pl-8 sm:pr-0"
                      }`}
                    >
                      <div className="glass-card glow-hover rounded-2xl p-6 transition">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
                            {item.year}
                          </span>
                          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                            {item.tag}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Why We're Different */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              Why LaunchByte is Different
            </h2>
            <p className="text-sm text-slate-400">
              Three founding architectural pillars behind every feature we deploy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              className="glass-card glow-hover rounded-2xl p-8 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Uncompromising Trust</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every listing passes through strict moderation and automated anti-ghosting checks. We flag suspicious postings and verify legitimate organizations so hackers never waste time on scams.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card glow-hover rounded-2xl p-8 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Speed of Hosting</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                No endless paperwork or 2-week delays. Organizers publish clean hackathon microsites with countdowns, rich markdown descriptions, and automated review queues in minutes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card glow-hover rounded-2xl p-8 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-6">
                <Users2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Teammate Discovery</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Find collaborators who match your exact stack, timezone, and project vision. Form balanced squads and never compete alone unless you choose to.
              </p>
            </motion.div>
          </div>
        </section>

        {/* 4. Core Values Grid */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/70 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
              <Flag className="w-3.5 h-3.5 text-cyan-400" />
              <span>THE CODE WE LIVE BY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              Our Core Values
            </h2>
            <p className="text-sm text-slate-400">
              Principles guiding how we build software, treat student builders, and scale the ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SITE_CONTENT.coreValues.map((val, idx) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="glass-card glow-hover rounded-2xl p-7 flex items-start gap-5 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-950/70 border border-violet-700/50 flex items-center justify-center shrink-0">
                  {valueIconMap[val.iconName] || <Sparkles className="w-6 h-6 text-indigo-400" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1.5">{val.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. Trust & Standards Comparison */}
        <section className="glass-card rounded-3xl p-8 sm:p-12">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Setting a New Standard</h2>
            <p className="text-sm text-slate-400">
              How LaunchByte outpaces legacy platforms like Devfolio, Unstop, and Hack2skill
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Atomic real-time view counts and anti-scraping protections",
              "Cryptographically hashed single-use verification & reset tokens",
              "Strict MIME magic-byte validation and Pillow EXIF-stripping for all uploads",
              "Automated community reporting thresholds with real-time audit logging",
              "Clean keyboard accessibility, responsive mobile-first layouts, and zero bloat",
              "100% typed API client with zero runtime schema drift",
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Our Team */}
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <CoreTeamSection
            title="Meet the Core Team"
            subtitle="The engineers, community organizers, and designers building the LaunchByte frontier."
            showEyebrow={false}
          />
        </div>

        {/* 7. CTA Section */}
        <section className="text-center py-12 rounded-3xl glass-card border border-indigo-500/30 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-cyan-500/10 pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to Host or Compete?
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
              Whether you are launching your university’s flagship hackathon or applying to summer engineering fellowships, LaunchByte is your home.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/opportunities"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition text-sm"
              >
                Explore Opportunities
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition text-sm"
              >
                Create Organizer Account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
