"use client";

import React from "react";
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

export default function ExploreCategoriesSection() {
  const categories = [
    {
      id: "hackathons",
      title: "Hackathons",
      subtitle: "High-Stakes Sprints",
      description: "Compete in intense 24 to 48 hour building sprints, ship production MVPs, and win cash prizes and venture grants.",
      href: "/events",
      icon: Trophy,
      accentColor: "#8B5CF6", // Violet
      glowClass: "group-hover:shadow-violet-500/20",
      borderClass: "hover:border-violet-500/50",
      tag: "Flagship",
    },
    {
      id: "internships",
      title: "Internships",
      subtitle: "Career Launchpad",
      description: "Discover high-growth technical and engineering roles at verified startups, venture studios, and tech organizations.",
      href: "/opportunities",
      icon: Briefcase,
      accentColor: "#3B82F6", // Electric Blue
      glowClass: "group-hover:shadow-blue-500/20",
      borderClass: "hover:border-blue-500/50",
      tag: "High Demand",
    },
    {
      id: "opportunities",
      title: "Tech Opportunities",
      subtitle: "Fellowships & Grants",
      description: "Explore funded research fellowships, open-source grants, and builder residency programs across Web3 and AI.",
      href: "/opportunities",
      icon: Sparkles,
      accentColor: "#22D3EE", // Cyan
      glowClass: "group-hover:shadow-cyan-500/20",
      borderClass: "hover:border-cyan-500/50",
      tag: "Funded",
    },
    {
      id: "ambassadors",
      title: "Ambassador Programs",
      subtitle: "Campus Leadership",
      description: "Represent premier developer tools, organize campus meetups, gain industry mentorship, and earn exclusive builder gear.",
      href: "/people",
      icon: Award,
      accentColor: "#10B981", // Emerald
      glowClass: "group-hover:shadow-emerald-500/20",
      borderClass: "hover:border-emerald-500/50",
      tag: "Leadership",
    },
    {
      id: "workshops",
      title: "Workshops & Events",
      subtitle: "Hands-on Masterclasses",
      description: "Join live system architecture walkthroughs, consensus workshops, and framework deep dives led by senior engineers.",
      href: "/events",
      icon: Calendar,
      accentColor: "#F59E0B", // Amber
      glowClass: "group-hover:shadow-amber-500/20",
      borderClass: "hover:border-amber-500/50",
      tag: "Interactive",
    },
    {
      id: "community",
      title: "Community",
      subtitle: "Builder Network",
      description: "Network with over 10,000 student developers, share code reviews, exchange ideas, and find lifelong collaborators.",
      href: "/network",
      icon: Users,
      accentColor: "#EC4899", // Rose
      glowClass: "group-hover:shadow-pink-500/20",
      borderClass: "hover:border-pink-500/50",
      tag: "10K+ Peers",
    },
    {
      id: "projects",
      title: "Projects & Team Building",
      subtitle: "Assemble Your Crew",
      description: "Match with teammates based on complementary tech stacks (frontend, backend, ML, smart contracts) for your next hackathon.",
      href: "/teams",
      icon: Layers,
      accentColor: "#6366F1", // Indigo
      glowClass: "group-hover:shadow-indigo-500/20",
      borderClass: "hover:border-indigo-500/50",
      tag: "Live Squads",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/50 border border-blue-500/30 text-xs font-mono uppercase tracking-widest text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ecosystem Pathways</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
              What You Can Explore
            </h2>
            <p className="text-sm sm:text-base text-[#B8BAD0] leading-relaxed">
              Every phase of your technical journey is covered. Pick a domain to unlock verified opportunities, team formations, and live events.
            </p>
          </div>

          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 hover:text-violet-300 transition shrink-0"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 7 Distinct Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            // Make the 7th item (Projects & Team Building) span 2 columns on larger displays or take prominent space
            const isWide = idx === 6;

            return (
              <Link
                key={cat.id}
                href={cat.href}
                className={`group relative p-6 rounded-3xl bg-[#09091B]/80 border border-slate-800/90 ${cat.borderClass} transition-all duration-300 flex flex-col justify-between shadow-lg shadow-black/30 hover:-translate-y-1.5 ${cat.glowClass} ${
                  isWide ? "sm:col-span-2 xl:col-span-2" : ""
                }`}
              >
                {/* Accent top pill & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${cat.accentColor}18`,
                        border: `1px solid ${cat.accentColor}40`,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: cat.accentColor }} />
                    </div>
                    <span
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold"
                      style={{
                        backgroundColor: `${cat.accentColor}15`,
                        color: cat.accentColor,
                        border: `1px solid ${cat.accentColor}30`,
                      }}
                    >
                      {cat.tag}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="space-y-1 mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      {cat.subtitle}
                    </span>
                    <h3 className="text-xl font-bold text-[#F8FAFC] group-hover:text-white transition-colors">
                      {cat.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#B8BAD0] leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                {/* Footer Link Indicator */}
                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
                    Explore now
                  </span>
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                    style={{ backgroundColor: `${cat.accentColor}20` }}
                  >
                    <ArrowRight className="w-3.5 h-3.5" style={{ color: cat.accentColor }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
