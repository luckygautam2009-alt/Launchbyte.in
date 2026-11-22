"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { OpportunityListItem } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";
import { OpportunityCardSkeleton } from "@/components/ui/Skeleton";
import {
  Zap,
  Briefcase,
  Users,
  TrendingUp,
  ArrowRight,
  Flame,
  Trophy,
  Sparkles,
} from "lucide-react";

const FEATURE_CARDS = [
  {
    icon: Zap,
    title: "Top Hackathons",
    description: "Stay updated with the best hackathons and compete for real prizes.",
    href: "/hackathons",
    tag: "High Trust",
  },
  {
    icon: Briefcase,
    title: "Real Opportunities",
    description: "Internships, fellowships & grants, all verified in one place.",
    href: "/opportunities",
    tag: "Curated",
  },
  {
    icon: Users,
    title: "Active Community",
    description: "Connect with like-minded innovators and find complementary teammates.",
    href: "/people",
    tag: "Builders",
  },
  {
    icon: TrendingUp,
    title: "Learn & Grow",
    description: "Level up your skills, showcase projects, and accelerate your career.",
    href: "/projects",
    tag: "Showcase",
  },
];

export default function DiscoverSection() {
  const [featuredHackathons, setFeaturedHackathons] = useState<OpportunityListItem[]>([]);
  const [closingSoon, setClosingSoon] = useState<OpportunityListItem[]>([]);
  const [latestOpportunities, setLatestOpportunities] = useState<OpportunityListItem[]>([]);
  const [activeTab, setActiveTab] = useState<"featured" | "closing" | "latest">("featured");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [featured, closing, latest] = await Promise.all([
          api.listOpportunities({ type: ["hackathon"], limit: 3, sort: "trust_score" }),
          api.listOpportunities({ sort: "deadline_soon", limit: 3 }),
          api.listOpportunities({ sort: "newest", limit: 3 }),
        ]);
        setFeaturedHackathons(featured.items || []);
        setClosingSoon(closing.items || []);
        setLatestOpportunities(latest.items || []);
      } catch (err) {
        console.error("Failed to load home feed opportunities:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeItems =
    activeTab === "featured"
      ? featuredHackathons
      : activeTab === "closing"
      ? closingSoon
      : latestOpportunities;

  return (
    <section className="relative py-24 bg-[#070716] overflow-hidden">
      {/* Anchor for Navbar Community Link */}
      <div id="community" className="scroll-mt-24" />

      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Section 4A: Feature Cards Grid */}
        <div className="space-y-12">
          {/* Header */}
          <div className="text-left md:text-center space-y-3 max-w-2xl md:mx-auto">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-purple-950/60 border border-purple-500/30 text-purple-300">
              Why LaunchByte?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Built for the next generation of builders.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Everything you need to launch your journey, discover opportunities, and team up with passionate creators.
            </p>
          </div>

          {/* 4 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group relative rounded-3xl border border-purple-900/30 bg-[#0B0B1D]/80 backdrop-blur-md p-6 hover:border-purple-500/50 hover:bg-slate-900/90 transition-all duration-300 hover:shadow-[0_0_30px_rgba(101,31,255,0.2)] flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:text-purple-300 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800/40">
                        {card.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 flex items-center gap-1.5 text-xs font-semibold text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Section 4B: Dynamic Opportunities Feed */}
        <div className="rounded-3xl border border-purple-900/30 bg-[#0B0B1D]/60 backdrop-blur-xl p-6 sm:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-purple-900/20 pb-6">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Live Opportunities Feed
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
                Explore What's Happening Now
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Verified competitions with transparent judging and guaranteed prizes.
              </p>
            </div>

            {/* Feed Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-purple-900/30">
              <button
                type="button"
                onClick={() => setActiveTab("featured")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "featured"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Featured Hackathons</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("closing")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "closing"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Closing Soon</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("latest")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "latest"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Latest Postings</span>
              </button>
            </div>
          </div>

          {/* Feed Cards Display */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <OpportunityCardSkeleton />
              <OpportunityCardSkeleton />
              <OpportunityCardSkeleton />
            </div>
          ) : activeItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeItems.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-purple-900/20 bg-slate-950/40 space-y-2">
              <p className="text-sm font-medium text-slate-300">
                No opportunities in this category right now.
              </p>
              <p className="text-xs text-slate-500">
                Check back soon or explore our full catalog.
              </p>
            </div>
          )}

          {/* View Catalog Footer Link */}
          <div className="flex justify-center pt-2">
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 text-xs font-semibold tracking-wide transition-all"
            >
              <span>View All Opportunities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
