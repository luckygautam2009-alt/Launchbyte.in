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
  Activity,
} from "lucide-react";
import { AvatarGroup, AvatarItem } from "@/components/ui/AvatarGroup";
import { Reveal, MagneticButton } from "./HomeMotion";

interface SquadItem {
  id: string;
  name: string;
  target: string;
  skills: string[];
  seeking: string;
  accent: string;
  members: AvatarItem[];
}

export default function CommunityNetworkSection() {
  const squads: SquadItem[] = [
    {
      id: "squad-1",
      name: "Neural Nexus AI",
      target: "Autonomous Agents Global Hackathon",
      skills: ["PyTorch", "Next.js", "FastAPI"],
      seeking: "Senior Frontend & UI/UX Specialist",
      accent: "#8B5CF6",
      members: [
        { id: "u1", name: "Alex Chen", role: "AI Engineer" },
        { id: "u2", name: "Maya Patel", role: "Systems Architect" },
        { id: "u3", name: "David Kim", role: "Backend Lead" },
      ],
    },
    {
      id: "squad-2",
      name: "Solidity Zero Protocol",
      target: "Decentralized Finance Sprint",
      skills: ["Solidity", "Rust", "Foundry"],
      seeking: "Smart Contract Auditor & Protocol Lead",
      accent: "#3B82F6",
      members: [
        { id: "u4", name: "Elena Rostova", role: "Rust Dev" },
        { id: "u5", name: "Samir Vance", role: "Security Auditor" },
      ],
    },
    {
      id: "squad-3",
      name: "CloudNative Distributed",
      target: "Kubernetes & Edge Computing Challenge",
      skills: ["Go", "Kubernetes", "gRPC"],
      seeking: "Systems Architect & Benchmarking Engineer",
      accent: "#22D3EE",
      members: [
        { id: "u6", name: "Marcus Brody", role: "Go Engineer" },
        { id: "u7", name: "Tanya Sen", role: "DevOps Lead" },
        { id: "u8", name: "Leo Rivera", role: "Fullstack" },
      ],
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
        <Reveal>
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

            <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed font-normal">
              Whether you need a backend wizard, an AI researcher, or a product designer, LaunchByte connects you with student builders who share your work ethic, speed, and hunger to win.
            </p>
          </div>
        </Reveal>

        {/* 3 Core Community Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Reveal key={idx} delay={0.1 * idx}>
                <div className="p-7 rounded-3xl glass-card glow-hover space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-950/70 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#F8FAFC]">{feat.title}</h3>
                    <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Active Squads Showcase with Visual Connection Lines & Online Pulse Dots */}
        <Reveal delay={0.2}>
          <div className="rounded-3xl glass-card p-6 sm:p-10 space-y-8 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    Live Hackathon Squads Matching Now
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Teams Actively Recruiting Collaborators
                </h3>
              </div>

              <MagneticButton>
                <Link
                  href="/teams"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-200 hover:text-white text-xs font-semibold border border-violet-500/30 transition-all focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <span>Explore All Teams</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </MagneticButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {squads.map((squad) => (
                <div
                  key={squad.id}
                  className="relative p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-violet-500/40 transition-all space-y-5 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Subtle Background SVG Connection Lines between avatars/skills */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id={`line-grad-${squad.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={squad.accent} stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 30,50 Q 120,20 220,70 T 320,50"
                      fill="none"
                      stroke={`url(#line-grad-${squad.id})`}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <circle cx="30" cy="50" r="3" fill={squad.accent} />
                    <circle cx="220" cy="70" r="3" fill="#22D3EE" />
                  </svg>

                  <div className="relative z-10 space-y-4">
                    {/* Header: Squad Size & Live Pulse Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300">
                        {squad.members.length} / 4 Members
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1.5 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>Recruiting</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white line-clamp-1 group-hover:text-violet-200 transition-colors">
                        {squad.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono line-clamp-1 mt-0.5">
                        Target: {squad.target}
                      </p>
                    </div>

                    {/* Member Avatars Visual with AvatarGroup & Connection Status */}
                    <div className="pt-2 flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                          Squad Roster
                        </span>
                        <AvatarGroup users={squad.members} max={4} size="sm" />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                          Status
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300">
                          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                          <span>Active Now</span>
                        </span>
                      </div>
                    </div>

                    {/* Tech Stack Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {squad.skills.map((skill, skIdx) => (
                        <span
                          key={skIdx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Seeking Role */}
                    <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-semibold block">
                        Seeking Complementary Role:
                      </span>
                      <p className="text-xs font-medium text-slate-200">
                        {squad.seeking}
                      </p>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Open squad token
                    </span>
                    <MagneticButton>
                      <Link
                        href="/teams"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1"
                      >
                        <span>Join Squad</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </MagneticButton>
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
