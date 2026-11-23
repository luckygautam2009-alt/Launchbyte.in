"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Globe,
  Terminal,
} from "lucide-react";

export default function CommunityNetworkSection() {
  const squads = [
    {
      name: "Neural Nexus AI",
      target: "Autonomous Agents Global Hackathon",
      membersCount: 3,
      maxMembers: 4,
      skills: ["PyTorch", "Next.js", "FastAPI"],
      seeking: "Senior Frontend & UI/UX Specialist",
      accent: "#8B5CF6",
    },
    {
      name: "Solidity Zero Protocol",
      target: "Decentralized Finance Sprint",
      membersCount: 2,
      maxMembers: 4,
      skills: ["Solidity", "Rust", "Foundry"],
      seeking: "Smart Contract Auditor / Backend Lead",
      accent: "#3B82F6",
    },
    {
      name: "CloudNative Distributed",
      target: "Kubernetes & Edge Computing Challenge",
      membersCount: 3,
      maxMembers: 4,
      skills: ["Go", "Kubernetes", "gRPC"],
      seeking: "Systems Architect & Benchmarking Engineer",
      accent: "#22D3EE",
    },
  ];

  const features = [
    {
      icon: Users,
      title: "Algorithmic Teammate Matching",
      description:
        "Filter thousands of active student developers by target hackathons, complementary skillsets, programming languages, and timezone.",
    },
    {
      icon: Terminal,
      title: "Instant Crew Dashboards",
      description:
        "Create private team spaces in seconds, generate shareable invite tokens, coordinate repository links, and submit projects without hassle.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Builder Reputation",
      description:
        "Every hackathon attended, placement won, and project deployed creates an immutable, verifiable proof of execution on your builder profile.",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[350px] bg-violet-800/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>The Builder Network</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight">
            Never Hack Alone. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#22D3EE] bg-clip-text text-transparent">
              Assemble Your Ultimate Crew.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B8BAD0] leading-relaxed font-normal">
            Whether you need a backend wizard, an AI researcher, or a product designer, LaunchByte connects you with student builders who share your work ethic, speed, and hunger to win.
          </p>
        </div>

        {/* 3 Core Community Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-[#09091B]/80 border border-slate-800 hover:border-violet-500/40 transition-all duration-300 space-y-4 shadow-xl shadow-black/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-950/50 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-[#B8BAD0] leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Active Squads Showcase & Recruiting Preview */}
        <div className="rounded-3xl bg-[#09091B]/90 border border-violet-500/25 p-6 sm:p-10 space-y-8 backdrop-blur-md shadow-2xl shadow-black/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                Live Hackathon Squads
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Teams Actively Recruiting Collaborators
              </h3>
            </div>
            <Link
              href="/teams"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-200 hover:text-white text-xs font-semibold border border-violet-500/30 transition-all"
            >
              <span>Explore All Teams</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {squads.map((squad, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-violet-500/40 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-violet-950 border border-violet-500/30 text-violet-300">
                      {squad.membersCount} / {squad.maxMembers} Members
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      1 Spot Open
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white line-clamp-1">{squad.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono line-clamp-1">
                    Target: {squad.target}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {squad.skills.map((skill, skIdx) => (
                      <span
                        key={skIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-900/30 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-cyan-300 font-semibold block">
                      Looking For:
                    </span>
                    <span className="text-xs text-slate-200 font-medium line-clamp-1">
                      {squad.seeking}
                    </span>
                  </div>
                </div>

                <Link
                  href="/teams"
                  className="w-full mt-2 py-2 rounded-xl bg-slate-900 hover:bg-violet-950/60 border border-slate-800 hover:border-violet-500/40 text-center text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                  <span>Request to Join Squad</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
