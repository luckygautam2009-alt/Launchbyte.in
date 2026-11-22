"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { OpportunityListItem } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";
import HeroSection from "@/components/home/HeroSection";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Trophy,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { OpportunityCardSkeleton } from "@/components/ui/Skeleton";

export default function HomePage() {
  const [featuredHackathons, setFeaturedHackathons] = useState<OpportunityListItem[]>([]);
  const [closingSoon, setClosingSoon] = useState<OpportunityListItem[]>([]);
  const [latestOpportunities, setLatestOpportunities] = useState<OpportunityListItem[]>([]);
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
        console.error("Failed to load home feed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-24 pb-28 overflow-hidden bg-[#050510]">
      {/* Cinematic Opening Hero Section */}
      <HeroSection />

      {/* Featured Hackathons Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold tracking-wider uppercase">
              <Trophy className="w-4 h-4" />
              <span>Flagship Events</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Top Verified Hackathons
            </h2>
            <p className="text-slate-400 text-sm">
              Competitions with guaranteed prize pools and transparent judging rubrics.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300 transition"
          >
            View all hackathons <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </div>
        ) : featuredHackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredHackathons.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/40">
            No featured hackathons at the moment.
          </div>
        )}
      </section>

      {/* Why LaunchByte Beats Competitors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 sm:p-12 space-y-10 relative overflow-hidden">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineered to Beat Legacy Portals
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Devfolio is slow to review; Unstop is cluttered with ads; Hack2skill lacks real transparency.
              LaunchByte was built from the ground up for modern developer trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-brand-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Zero-Scam Trust Scores</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every host undergoes verified business registry, domain verification, and escrow validation before a hackathon goes live.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-accent-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Speed of Hosting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Launch clean event pages in under 2 minutes. Automatic waitlist promotion, offline-ready QR passes, and instant team locks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-purple-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Algorithmic Teammate Matching</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Never hack alone. Find teammates by complementary skills, target event, and desired roles with live in-app chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Soon Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-wider uppercase">
              <Flame className="w-4 h-4" />
              <span>Deadlines Approaching</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Closing Soon
            </h2>
            <p className="text-slate-400 text-sm">
              Don't miss the registration cutoff for these high-priority opportunities.
            </p>
          </div>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300 transition"
          >
            Explore all opportunities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </div>
        ) : closingSoon.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {closingSoon.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/40">
            No opportunities closing soon.
          </div>
        )}
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-900/60 via-indigo-900/40 to-slate-900 border border-brand-500/30 p-8 sm:p-14 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Build Your Next Breakthrough?
          </h2>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Join thousands of developers teaming up, claiming prizes, and finding career opportunities on LaunchByte.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/register">
              <Button variant="accent" size="lg">
                Create Free Builder Account
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" size="lg">
                Browse Active Hackathons
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
