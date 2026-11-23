"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { OpportunityListItem } from "@/lib/types";
import {
  Calendar,
  Globe,
  MapPin,
  DollarSign,
  ArrowRight,
  Sparkles,
  Trophy,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { Badge } from "@/components/ui/Badge";
import { OpportunityCardSkeleton } from "@/components/ui/Skeleton";

export default function FeaturedOpportunitiesSection() {
  const [activeTab, setActiveTab] = useState<"all" | "hackathon" | "internship" | "event">("all");
  const [opportunities, setOpportunities] = useState<OpportunityListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params: any = { limit: 6, sort: "newest" };
        if (activeTab !== "all") {
          params.type = [activeTab];
        }
        const res = await api.listOpportunities(params);
        setOpportunities(res.items || []);
      } catch (err) {
        console.error("Failed to fetch featured opportunities:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTab]);

  const formatDeadline = (dateStr?: string | null, rolling?: boolean) => {
    if (rolling) return "Rolling Admissions";
    if (!dateStr) return "Ongoing Program";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Applications Closed";
    if (diffDays === 0) return "Closes Today";
    if (diffDays === 1) return "1 day remaining";
    if (diffDays <= 7) return `${diffDays} days left`;
    return `Deadline: ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const getCompensationText = (opp: OpportunityListItem) => {
    if (opp.compensation_type === "unpaid") return "Unpaid / Portfolio";
    if (opp.compensation_min || opp.compensation_max) {
      const cur = opp.compensation_currency || "$";
      if (opp.compensation_min && opp.compensation_max) {
        return `${cur}${Number(opp.compensation_min).toLocaleString()} - ${cur}${Number(opp.compensation_max).toLocaleString()}`;
      }
      return `${cur}${Number(opp.compensation_min || opp.compensation_max).toLocaleString()}`;
    }
    if (opp.compensation_note) return opp.compensation_note;
    return opp.compensation_type?.toUpperCase() || "Competitive";
  };

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header with Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verified High-Impact Programs</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
              Featured Opportunities
            </h2>
            <p className="text-sm sm:text-base text-[#B8BAD0] leading-relaxed">
              Handpicked, verified competitions, internships, and fellowships with verified organizers and guaranteed rewards.
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-[#09091B]/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            {[
              { id: "all", label: "All Opportunities" },
              { id: "hackathon", label: "Hackathons" },
              { id: "internship", label: "Internships" },
              { id: "event", label: "Events & Workshops" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white shadow-md shadow-violet-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Opportunities Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </div>
        ) : opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="group relative rounded-3xl border border-slate-800/90 bg-[#09091B]/90 hover:border-violet-500/50 transition-all duration-300 p-6 flex flex-col justify-between shadow-xl shadow-black/40 hover:-translate-y-1.5 hover:shadow-violet-950/20"
              >
                <div>
                  {/* Top: Org Header + Trust Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {opp.organization?.logo_url ? (
                        <img
                          src={opp.organization.logo_url}
                          alt={opp.organization.name}
                          className="w-11 h-11 rounded-2xl object-cover bg-slate-800 border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-violet-400 shrink-0 shadow-inner">
                          <Building className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-300 line-clamp-1">
                          {opp.organization?.name || "Verified Host"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <TrustBadge
                            score={opp.trust_score}
                            status={opp.verification_status}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 font-semibold">
                      {opp.type}
                    </span>
                  </div>

                  {/* Title */}
                  <Link href={`/opportunities/${opp.slug}`} className="block group-hover:text-violet-300 transition-colors">
                    <h3 className="text-lg font-bold text-[#F8FAFC] line-clamp-2 mb-2 leading-snug">
                      {opp.title}
                    </h3>
                  </Link>

                  {/* Summary */}
                  <p className="text-xs sm:text-sm text-[#B8BAD0] line-clamp-2 leading-relaxed mb-5">
                    {opp.summary || "No summary provided. Click below to inspect problem statements, timeline, and prize pool structure."}
                  </p>
                </div>

                {/* Bottom Metadata & CTA */}
                <div className="space-y-4 pt-4 border-t border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-300">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                      {opp.location_type === "remote" ? (
                        <Globe className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <MapPin className="w-3 h-3 text-amber-400" />
                      )}
                      <span>{opp.location_text || opp.location_type || "Remote"}</span>
                    </span>

                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                      <DollarSign className="w-3 h-3" />
                      <span>{getCompensationText(opp)}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-violet-400" />
                      <span>{formatDeadline(opp.deadline_at, opp.is_rolling)}</span>
                    </span>

                    <Link
                      href={`/opportunities/${opp.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-200 hover:text-white text-xs font-semibold border border-violet-500/30 transition-all group-hover:border-violet-500"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl border border-slate-800 bg-[#09091B]/60 space-y-3">
            <Trophy className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-300">No active listings in this category right now</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Our curation team audits submissions continuously. Check back shortly or browse all categories.
            </p>
          </div>
        )}

        {/* View All CTAs */}
        <div className="text-center pt-4">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#09091B] hover:bg-violet-950/40 border border-violet-500/30 hover:border-violet-500/60 text-[#F8FAFC] text-sm font-semibold transition-all shadow-lg shadow-black/40"
          >
            <span>Explore All 450+ Verified Opportunities</span>
            <ArrowRight className="w-4 h-4 text-violet-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
