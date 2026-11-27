"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  Terminal,
  Rocket,
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Layers,
  Compass,
  CheckCircle2,
} from "lucide-react";
import RevealHeading from "@/components/ui/RevealHeading";
import { Reveal, MagneticButton } from "./HomeMotion";
import { LAUNCHBYTE_SOCIALS } from "@/lib/siteContent";

const COMMUNITY_DESTINATION = LAUNCHBYTE_SOCIALS.whatsapp;

export default function CommunityNetworkSection() {
  const shouldReduceMotion = useReducedMotion();
  const [activeNode, setActiveNode] = useState<string>("fullstack");

  const nodes = [
    {
      id: "fullstack",
      label: "Full-Stack Devs",
      sublabel: "React, Next.js, Node, Go",
      accent: "#8B5CF6",
      x: "25%",
      y: "26%",
    },
    {
      id: "aiml",
      label: "AI / ML Engineers",
      sublabel: "PyTorch, LLMs, Agents",
      accent: "#22D3EE",
      x: "75%",
      y: "24%",
    },
    {
      id: "systems",
      label: "Systems & Cloud",
      sublabel: "Rust, Distributed, K8s",
      accent: "#6366F1",
      x: "26%",
      y: "74%",
    },
    {
      id: "design",
      label: "Product & UI/UX",
      sublabel: "Figma, Design Systems",
      accent: "#A78BFA",
      x: "74%",
      y: "76%",
    },
  ];

  return (
    <section className="relative py-16 sm:py-24 bg-transparent overflow-hidden select-none">
      {/* Background Cosmic Atmosphere */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[450px] bg-gradient-to-tr from-violet-900/20 via-indigo-900/15 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[400px] bg-gradient-to-bl from-cyan-950/20 via-violet-950/20 to-transparent rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 lg:space-y-16">
        {/* ================= SECTION HEADER ================= */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <RevealHeading
            text="Build Something Bigger Than Yourself."
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#17172B] dark:text-[#F8FAFC] tracking-tight leading-[1.12]"
          />

          <p className="text-base sm:text-lg text-[#424C63] dark:text-[#CBD5E1] leading-relaxed font-normal max-w-2xl mx-auto">
            Find your people, discover opportunities, collaborate on ideas and
            turn what you learn into something real.
          </p>

          {/* Micro Brand Ethos Strip */}
          <div className="inline-flex items-center gap-3 pt-1 text-xs font-mono font-semibold tracking-widest uppercase text-[#7552D9] dark:text-cyan-400">
            <span>BUILD</span>
            <span className="text-violet-500">•</span>
            <span>COLLABORATE</span>
            <span className="text-violet-500">•</span>
            <span>LAUNCH</span>
          </div>
        </div>

        {/* ================= ASYMMETRIC COMMUNITY COMPOSITION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* ================= LEFT ANCHOR (7 Cols): Constellation & Find Your People ================= */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8 rounded-3xl p-6 sm:p-10 bg-white/85 dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] border border-violet-200 dark:border-violet-500/20 backdrop-blur-xl relative overflow-hidden shadow-lg dark:shadow-2xl dark:shadow-black/60 group">
            {/* Ambient Background Aura */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-400/15 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-400/15 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Pillar A: FIND YOUR PEOPLE */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7552D9] dark:text-cyan-300">
                    PILLAR 01 // DISCOVER YOUR PEERS
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#17172B] dark:text-white tracking-tight">
                  Find Your People
                </h3>
                <p className="text-sm sm:text-base text-[#424C63] dark:text-slate-300/90 leading-relaxed max-w-xl">
                  Connect with developers, designers, innovators and students who
                  share your interests. Meet builders who complement your skills
                  and challenge you to build higher.
                </p>
              </div>

              {/* Dynamic Interactive Builder Constellation Diagram */}
              <div className="relative w-full h-[240px] sm:h-[280px] rounded-2xl bg-slate-50/90 dark:bg-[#070719]/90 border border-violet-200/80 dark:border-white/[0.08] p-4 overflow-hidden">
                {/* SVG Connecting Vectors */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    x1="18%"
                    y1="28%"
                    x2="50%"
                    y2="50%"
                    stroke="#8B5CF6"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="78%"
                    y1="24%"
                    x2="50%"
                    y2="50%"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="24%"
                    y1="74%"
                    x2="50%"
                    y2="50%"
                    stroke="#6366F1"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="72%"
                    y1="76%"
                    x2="50%"
                    y2="50%"
                    stroke="#A78BFA"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* Outer cross-connections */}
                  <line
                    x1="18%"
                    y1="28%"
                    x2="78%"
                    y2="24%"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                  />
                  <line
                    x1="24%"
                    y1="74%"
                    x2="72%"
                    y2="76%"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                  />
                </svg>

                {/* Center Core Node: LaunchByte Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_24px_rgba(139,92,246,0.6)] border border-violet-300/40">
                    <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
                  </div>
                  <span className="mt-1.5 text-[9px] font-mono tracking-widest text-[#7552D9] dark:text-cyan-300 uppercase font-semibold">
                    LAUNCHBYTE HUB
                  </span>
                </div>

                {/* Orbiting Discipline Nodes */}
                {nodes.map((node) => {
                  const isActive = activeNode === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setActiveNode(node.id)}
                      onMouseEnter={() => setActiveNode(node.id)}
                      style={{ left: node.x, top: node.y }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-xl border backdrop-blur-md transition-all duration-300 text-left cursor-pointer focus:outline-none ${
                        isActive
                          ? "bg-violet-50 dark:bg-violet-950/90 border-violet-500 dark:border-cyan-400 shadow-md dark:shadow-[0_0_20px_rgba(34,211,238,0.35)] scale-105 z-20"
                          : "bg-white/90 dark:bg-black/60 border-slate-200 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-400/50 hover:bg-white dark:hover:bg-black/80 z-10 shadow-sm dark:shadow-none"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: node.accent,
                            boxShadow: `0 0 6px ${node.accent}`,
                          }}
                        />
                        <span className="text-[10px] sm:text-xs font-mono font-bold text-[#17172B] dark:text-white whitespace-nowrap">
                          {node.label}
                        </span>
                      </div>
                      <span className="hidden sm:block text-[9px] font-mono text-[#647084] dark:text-slate-400 mt-0.5 whitespace-nowrap">
                        {node.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Action in Left Anchor */}
            <div className="relative z-10 pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-white/[0.08]">
              <span className="text-xs font-mono text-[#647084] dark:text-slate-400">
                Cross-disciplinary developer squads
              </span>
              <Link
                href="/network"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#7552D9] hover:text-[#5B39B8] dark:text-cyan-300 dark:hover:text-white transition-colors"
              >
                <span>Browse Builder Network</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (5 Cols): Pillars B, C, D Staggered Stack ================= */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            {/* ================= PILLAR B: BUILD TOGETHER ================= */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-transparent border border-slate-200 dark:border-white/[0.08] hover:border-violet-400 dark:hover:border-violet-500/40 shadow-sm dark:shadow-none transition-all duration-300 space-y-3 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/80 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center text-[#7552D9] dark:text-violet-300 shadow-sm dark:shadow-md">
                    <Terminal className="w-4 h-4 text-[#7552D9] dark:text-violet-400" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#7552D9] dark:text-violet-300 font-semibold">
                    PILLAR 02 // COLLABORATION
                  </span>
                </div>
                <Link
                  href="/teams"
                  className="text-[11px] font-mono text-[#647084] hover:text-[#7552D9] dark:text-slate-400 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>Squads</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <h4 className="text-xl sm:text-2xl font-bold text-[#17172B] dark:text-white tracking-tight">
                Build Together
              </h4>
              <p className="text-xs sm:text-sm text-[#424C63] dark:text-slate-300/85 leading-relaxed">
                Find collaborators, exchange ideas, build projects and work on
                real-world challenges. Form squads for hackathons or assemble
                teams to turn side ideas into production software.
              </p>
            </div>

            {/* ================= PILLAR C: GROW THROUGH EXPERIENCE ================= */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-transparent border border-slate-200 dark:border-white/[0.08] hover:border-cyan-400 dark:hover:border-cyan-500/40 shadow-sm dark:shadow-none transition-all duration-300 space-y-3 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-300 shadow-sm dark:shadow-md">
                    <Rocket className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-300 font-semibold">
                    PILLAR 03 // TRAJECTORY
                  </span>
                </div>
                <Link
                  href="/events"
                  className="text-[11px] font-mono text-[#647084] hover:text-[#7552D9] dark:text-slate-400 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>Events</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <h4 className="text-xl sm:text-2xl font-bold text-[#17172B] dark:text-white tracking-tight">
                Grow Through Experience
              </h4>
              <p className="text-xs sm:text-sm text-[#424C63] dark:text-slate-300/85 leading-relaxed">
                Explore hackathons, workshops, internships, programs and
                opportunities to expand your skills. Move from theoretical
                knowledge to hands-on shipping with real teammates.
              </p>
            </div>

            {/* ================= PILLAR D: BE PART OF SOMETHING ================= */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-transparent border border-slate-200 dark:border-white/[0.08] hover:border-indigo-400 dark:hover:border-indigo-500/40 shadow-sm dark:shadow-none transition-all duration-300 space-y-3 relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shadow-sm dark:shadow-md">
                  <Users className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-semibold">
                  PILLAR 04 // BELONGING
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-bold text-[#17172B] dark:text-white tracking-tight">
                Be Part of Something
              </h4>
              <p className="text-xs sm:text-sm text-[#424C63] dark:text-slate-300/85 leading-relaxed">
                Become part of a community that encourages building, learning,
                sharing and creating. Where student developers support each
                other, celebrate wins, and launch what matters.
              </p>
            </div>
          </div>
        </div>

        {/* ================= COMMUNITY CTA STRIP ================= */}
        <div className="pt-6 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center">
          <MagneticButton>
            <a
              href={COMMUNITY_DESTINATION}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-semibold text-sm tracking-wide shadow-xl shadow-violet-500/25 dark:shadow-violet-950/50 hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Users className="w-4 h-4" />
              <span>Join the LaunchByte Community</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </MagneticButton>

          <Link
            href="/teams"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/85 hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/40 text-[#17172B] dark:text-slate-300 dark:hover:text-white font-medium text-sm shadow-sm dark:shadow-none transition-all duration-300"
          >
            <span>Explore Squad Finder</span>
            <ArrowRight className="w-4 h-4 text-[#7552D9] dark:text-slate-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
