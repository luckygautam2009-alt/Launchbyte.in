"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Briefcase,
  Sparkles,
  Award,
  Calendar,
  Users,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Reveal, MagneticButton } from "./HomeMotion";

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  tag: string;
  spanClass: string;
}

function SpotlightBentoCard({ cat }: { cat: CategoryItem }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);
  const Icon = cat.icon;

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <Link
      ref={cardRef}
      href={cat.href}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: -1000, y: -1000 });
      }}
      className={`group relative p-6 sm:p-7 rounded-3xl glass-card glow-hover overflow-hidden flex flex-col justify-between transition-all duration-300 ${cat.spanClass} focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none`}
    >
      {/* Cursor-Following Spotlight Effect INSIDE each card only */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${cat.accentColor}25, transparent 80%)`,
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          {/* Icon with Soft Glow in its accent color */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg"
            style={{
              backgroundColor: `${cat.accentColor}18`,
              border: `1px solid ${cat.accentColor}45`,
              boxShadow: `0 0 20px -3px ${cat.accentColor}40`,
            }}
          >
            <Icon className="w-6 h-6" style={{ color: cat.accentColor }} />
          </div>

          <span className="text-[11px] font-mono tracking-wider text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/60">
            {cat.tag}
          </span>
        </div>

        <div>
          <span
            className="text-[11px] font-mono uppercase tracking-wider font-semibold block mb-1"
            style={{ color: cat.accentColor }}
          >
            {cat.subtitle}
          </span>
          <h3 className="text-xl font-bold text-[#F8FAFC] group-hover:text-white transition-colors">
            {cat.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed mt-2">
            {cat.description}
          </p>
        </div>
      </div>

      <div className="relative z-10 pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
          Explore opportunities
        </span>
        <ArrowRight
          className="w-4 h-4 transition-transform group-hover:translate-x-1"
          style={{ color: cat.accentColor }}
        />
      </div>
    </Link>
  );
}

export default function ExploreCategoriesSection() {
  const categories: CategoryItem[] = [
    {
      id: "hackathons",
      title: "Hackathons",
      subtitle: "High-Stakes Sprints",
      description:
        "Compete in intense 24 to 48 hour building sprints, ship production MVPs, and win cash prizes and venture grants.",
      href: "/events",
      icon: Trophy,
      accentColor: "#8B5CF6", // Violet
      tag: "Flagship",
      spanClass: "lg:col-span-7",
    },
    {
      id: "internships",
      title: "Internships",
      subtitle: "Career Launchpad",
      description:
        "Discover high-growth technical and engineering roles at verified startups, venture studios, and tech organizations.",
      href: "/opportunities",
      icon: Briefcase,
      accentColor: "#3B82F6", // Electric Blue
      tag: "High Demand",
      spanClass: "lg:col-span-5",
    },
    {
      id: "opportunities",
      title: "Tech Opportunities",
      subtitle: "Fellowships & Grants",
      description:
        "Explore funded research fellowships, open-source grants, and builder residency programs across Web3, AI, and systems engineering.",
      href: "/opportunities",
      icon: Sparkles,
      accentColor: "#22D3EE", // Cyan
      tag: "Funded",
      spanClass: "lg:col-span-4",
    },
    {
      id: "projects",
      title: "Projects & Team Building",
      subtitle: "Assemble Your Crew",
      description:
        "Match with teammates based on complementary tech stacks (frontend, backend, ML, smart contracts) for your next hackathon.",
      href: "/teams",
      icon: Layers,
      accentColor: "#6366F1", // Indigo
      tag: "Live Squads",
      spanClass: "lg:col-span-4",
    },
    {
      id: "ambassadors",
      title: "Ambassador Programs",
      subtitle: "Campus Leadership",
      description:
        "Represent premier developer tools, organize campus meetups, gain industry mentorship, and earn exclusive builder gear.",
      href: "/people",
      icon: Award,
      accentColor: "#10B981", // Emerald
      tag: "Leadership",
      spanClass: "lg:col-span-4",
    },
    {
      id: "workshops",
      title: "Workshops & Events",
      subtitle: "Hands-on Masterclasses",
      description:
        "Join live system architecture walkthroughs, consensus workshops, and framework deep dives led by senior engineers.",
      href: "/events",
      icon: Calendar,
      accentColor: "#F59E0B", // Amber
      tag: "Interactive",
      spanClass: "lg:col-span-6",
    },
    {
      id: "community",
      title: "Community Network",
      subtitle: "Builder Network",
      description:
        "Network with over 10,000 student developers, share code reviews, exchange ideas, and find lifelong collaborators.",
      href: "/network",
      icon: Users,
      accentColor: "#EC4899", // Rose
      tag: "10K+ Peers",
      spanClass: "lg:col-span-6",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/50 border border-blue-500/30 text-xs font-mono uppercase tracking-widest text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ecosystem Pathways</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
                What You Can Explore
              </h2>
              <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                Every phase of your technical journey is covered. Pick a domain to unlock verified opportunities, team formations, and live events.
              </p>
            </div>

            <MagneticButton>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 hover:text-violet-300 transition shrink-0 focus-visible:ring-2 focus-visible:ring-violet-400 rounded-lg p-1"
              >
                <span>Browse Full Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </MagneticButton>
          </div>
        </Reveal>

        {/* 7 Distinct Cards Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {categories.map((cat, idx) => (
            <Reveal
              key={cat.id}
              className={`flex ${cat.spanClass}`}
              delay={0.08 * (idx % 4)}
            >
              <SpotlightBentoCard cat={cat} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
