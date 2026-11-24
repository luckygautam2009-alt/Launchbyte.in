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
  Compass,
} from "lucide-react";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { Badge } from "@/components/ui/Badge";
import { Countdown } from "@/components/ui/Countdown";
import { OpportunityCardSkeleton } from "@/components/ui/Skeleton";
import { Reveal, MagneticButton } from "./HomeMotion";

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
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
                <Trophy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verified High-Impact Programs</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
                Featured Opportunities
              </h2>
              <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                Handpicked, verified competitions, internships, and fellowships with verified organizers and guaranteed rewards.
              </p>
            </div>

            {/* Filter Pills */}
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
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
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
        </Reveal>

        {/* Opportunities Display: Snap-Scroll Carousel on Mobile, 3 Columns on Desktop */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </div>
        ) : opportunities.length > 0 ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:overflow-visible">
            {opportunities.map((opp, idx) => {
              const oppHref =
                opp.type === "hackathon"
                  ? `/events/${opp.slug || opp.id}`
                  : `/opportunities/${opp.slug || opp.id}`;

              return (
                <Reveal
                  key={opp.id}
                  delay={0.08 * (idx % 3)}
                  className="snap-center shrink-0 w-[86vw] sm:w-auto flex"
                >
                  <div className="group relative w-full rounded-3xl glass-card glow-hover p-6 flex flex-col justify-between transition-all duration-300">
                    <div className="space-y-4">
                      {/* Top: Org Header + Trust Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {opp.organization?.logo_url ? (
                            <img
                              src={opp.organization.logo_url}
                              alt={opp.organization.name || "Host logo"}
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
                              {/* Trust Badge */}
                              <TrustBadge
                                score={opp.trust_score}
                                status={opp.verification_status}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Opportunity Type Badge */}
                        <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 bg-violet-950/70 px-2.5 py-0.5 rounded-full border border-violet-500/30 shrink-0">
                          {opp.type}
                        </span>
                      </div>

                      {/* Title & Summary */}
                      <div>
                        <Link
                          href={oppHref}
                          className="text-base sm:text-lg font-bold text-[#F8FAFC] group-hover:text-violet-200 transition-colors line-clamp-1 block focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
                        >
                          {opp.title}
                        </Link>
                        {opp.summary && (
                          <p className="text-xs text-[#CBD5E1] line-clamp-2 mt-1.5 leading-relaxed">
                            {opp.summary}
                          </p>
                        )}
                      </div>

                      {/* Deadline Countdown or Rolling Status */}
                      <div className="pt-2 border-t border-slate-800/80">
                        {opp.deadline_at ? (
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                            <Countdown
                              targetDate={opp.deadline_at}
                              label="Closes in"
                              className="text-xs text-slate-200"
                            />
                          </div>
                        ) : opp.is_rolling ? (
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Rolling Admissions</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ongoing Program</span>
                          </div>
                        )}
                      </div>

                      {/* Meta Tags & Compensation */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <DollarSign className="w-3 h-3" />
                          <span>{getCompensationText(opp)}</span>
                        </span>

                        {opp.location_type && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800">
                            {opp.location_type === "remote" ? (
                              <Globe className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <MapPin className="w-3 h-3 text-amber-400" />
                            )}
                            <span className="capitalize">{opp.location_type}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action CTA */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">
                        {opp.tags?.[0]?.name ? `#${opp.tags[0].name}` : "Verified listing"}
                      </span>
                      <MagneticButton>
                        <Link
                          href={oppHref}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 rounded-lg p-1"
                        >
                          <span>Apply Now</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </MagneticButton>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        ) : (
          /* Proper Empty State */
          <Reveal>
            <div className="rounded-3xl glass-card glow-hover p-10 sm:p-14 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-950/70 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400 shadow-lg">
                <Compass className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC]">
                No listings in this category right now
              </h3>
              <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                Organizers are currently reviewing and posting new hackathons and fellowships. Check all opportunities across the full catalog.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-violet-600/30 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                >
                  View All Opportunities
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {/* View All Button */}
        <Reveal delay={0.2}>
          <div className="text-center pt-4">
            <MagneticButton>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass-card hover:border-violet-500/50 text-[#F8FAFC] text-sm font-semibold transition-all shadow-lg focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span>Browse All Active Opportunities</span>
                <ArrowRight className="w-4 h-4 text-violet-400" />
              </Link>
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
