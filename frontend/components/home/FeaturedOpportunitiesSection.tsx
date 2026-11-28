"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { OpportunityListItem } from "@/lib/types";
import {
  Calendar,
  Globe,
  MapPin,
  ArrowRight,
  Trophy,
  Building,
  Users,
  ExternalLink,
  Compass,
} from "lucide-react";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { Avatar } from "@/components/ui/Avatar";
import { OpportunityCardSkeleton } from "@/components/ui/Skeleton";
import { Reveal, MagneticButton } from "./HomeMotion";
import RevealHeading from "@/components/ui/RevealHeading";
import TiltCard from "@/components/ui/TiltCard";

function formatEventDateRange(start?: string | null, end?: string | null): string | null {
  if (!start) return null;
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (!end) return s.toLocaleDateString("en-IN", opts);
  const e = new Date(end);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;
  }
  return `${s.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-IN", opts)}`;
}

export default function FeaturedOpportunitiesSection() {
  const [activeTab, setActiveTab] = useState<"all" | "hackathon" | "internship" | "event">("all");
  const [opportunities, setOpportunities] = useState<OpportunityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Browsing needs an account: don't call the (login-gated) API for visitors.
      setLoading(false);
      return;
    }
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const params: any = { limit: 4, sort: "deadline", include_expired: true };
        if (activeTab !== "all") {
          params.type = [activeTab];
        } else {
          params.is_featured = true;
        }
        const res = await api.listOpportunities(params);
        setOpportunities((res.items || []).slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch featured opportunities:", err);
        setError("Unable to load featured opportunities at this time.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTab, user, authLoading]);

  return (
    <section className="relative py-16 sm:py-24 bg-transparent overflow-hidden">
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header with Filter Tabs */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <RevealHeading
                text="Featured Opportunities"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17172B] dark:text-[#F8FAFC] tracking-tight"
              />
              <p className="text-sm sm:text-base text-[#424C63] dark:text-[#CBD5E1] leading-relaxed">
                Verified upcoming hackathons and opportunities with direct official registration links.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white/85 dark:bg-[#09091B]/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm dark:shadow-none">
              {[
                { id: "all", label: "Featured" },
                { id: "hackathon", label: "Hackathons" },
                { id: "internship", label: "Internships" },
                { id: "event", label: "Events" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white shadow-md shadow-violet-500/20"
                      : "text-[#59647A] hover:text-[#17172B] hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {isGuest ? (
          <Reveal>
            <div className="rounded-3xl glass-card p-10 text-center max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/15 border border-violet-300/60 dark:border-violet-400/30 flex items-center justify-center mx-auto text-violet-700 dark:text-violet-300">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#17172B] dark:text-[#F8FAFC]">
                Create a free account to explore
              </h3>
              <p className="text-sm text-[#424C63] dark:text-slate-300">
                Verified hackathons, internships and events are available to LaunchByte members. It takes under a minute to join.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white text-sm font-semibold shadow-md shadow-violet-500/20 hover:opacity-95 transition"
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-[#17172B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </Reveal>
        ) : loading || authLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </div>
        ) : error ? (
          <Reveal>
            <div className="rounded-3xl glass-card p-10 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/70 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Failed to load opportunities</h3>
              <p className="text-xs sm:text-sm text-slate-300">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer transition"
              >
                Retry
              </button>
            </div>
          </Reveal>
        ) : opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map((opp, idx) => {
              const detailsHref = `/opportunities/${opp.slug || opp.id}`;
              const organizerName = opp.organizer_name_override || opp.organization?.name || "Verified Organizer";
              const dateRange = formatEventDateRange(opp.starts_at, opp.ends_at);
              const isExpired =
                !opp.is_rolling &&
                opp.deadline_at != null &&
                new Date(opp.deadline_at).getTime() < Date.now();
              const formatLabel =
                opp.location_type === "remote"
                  ? "Online"
                  : opp.location_type === "onsite"
                  ? "Offline"
                  : opp.location_type === "hybrid"
                  ? "Hybrid"
                  : null;

              return (
                <Reveal key={opp.id} delay={0.07 * idx} className="flex">
                  <TiltCard maxTilt={4} className="w-full flex">
                    <div className="group relative w-full rounded-3xl glass-card glow-hover p-6 flex flex-col justify-between gap-5 transition-all duration-300">
                      <div className="space-y-4">
                        {/* Header: Logo/Thumbnail + Organizer + Type */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              src={opp.thumbnail_url || opp.organization?.logo_url}
                              name={organizerName || opp.title}
                              alt={opp.title}
                              size="fill"
                              shape="rounded"
                              className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-[#7552D9] dark:text-violet-400"
                              fallback={<Building className="w-5 h-5" />}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#59647A] dark:text-slate-300 line-clamp-1">
                                {organizerName}
                              </p>
                              <div className="mt-0.5">
                                <TrustBadge
                                  score={opp.trust_score}
                                  status={opp.verification_status}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7552D9] dark:text-violet-300 bg-violet-100 dark:bg-violet-950/70 px-2.5 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30 shrink-0">
                            {opp.type}
                          </span>
                        </div>

                        {/* Event Name & Short Description */}
                        <div>
                          <Link
                            href={detailsHref}
                            className="text-lg sm:text-xl font-bold text-[#17172B] group-hover:text-[#7552D9] dark:text-[#F8FAFC] dark:group-hover:text-violet-200 transition-colors line-clamp-1 block"
                          >
                            {opp.title}
                          </Link>
                          {opp.summary && (
                            <p className="text-xs sm:text-sm text-[#424C63] dark:text-[#CBD5E1] line-clamp-2 mt-1.5 leading-relaxed">
                              {opp.summary}
                            </p>
                          )}
                        </div>

                        {/* Metadata Pills: Dates, Location, Format, Team Size, Entry Fee */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                          {dateRange && (
                            <span className="inline-flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-500/20">
                              <Calendar className="w-3 h-3" />
                              <span>{dateRange}</span>
                            </span>
                          )}
                          {formatLabel && (
                            <span className="inline-flex items-center gap-1 text-[#424C63] dark:text-slate-200 bg-slate-100 dark:bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                              <Globe className="w-3 h-3 text-[#7552D9] dark:text-violet-400" />
                              <span>{formatLabel}</span>
                            </span>
                          )}
                          {opp.location_text && (
                            <span className="inline-flex items-center gap-1 text-[#424C63] dark:text-slate-300 bg-slate-100 dark:bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                              <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span className="line-clamp-1">{opp.location_text}</span>
                            </span>
                          )}
                          {opp.team_size && (
                            <span className="inline-flex items-center gap-1 text-[#424C63] dark:text-slate-300 bg-slate-100 dark:bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                              <Users className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                              <span>{opp.team_size}</span>
                            </span>
                          )}
                          {opp.compensation_note && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                              <span>{opp.compensation_note}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom CTAs: View Details + Register Now */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3">
                        <Link
                          href={detailsHref}
                          className="text-xs font-mono text-[#59647A] hover:text-[#17172B] dark:text-slate-300 dark:hover:text-white transition-colors inline-flex items-center gap-1"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        {isExpired ? (
                          <span className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-500 cursor-not-allowed">
                            Registration Closed
                          </span>
                        ) : opp.application_url ? (
                          <MagneticButton>
                            <a
                              href={opp.application_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] text-white text-xs font-semibold shadow-md shadow-violet-500/20 transition-all"
                            >
                              <span>Register Now</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </MagneticButton>
                        ) : (
                          <Link
                            href={detailsHref}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-200 text-xs font-semibold"
                          >
                            <span>View Details</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <Reveal>
            <div className="rounded-3xl glass-card p-10 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-950/70 border border-violet-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">No active listings in this category</h3>
              <p className="text-xs sm:text-sm text-[#CBD5E1]">
                Browse all verified opportunities across hackathons, internships, and fellowships.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Show Featured
              </button>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.15}>
          <div className="text-center pt-2">
            <MagneticButton>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass-card hover:border-violet-400 dark:hover:border-violet-500/50 text-[#17172B] dark:text-[#F8FAFC] text-sm font-semibold transition-all shadow-lg"
              >
                <span>Browse All Active Opportunities</span>
                <ArrowRight className="w-4 h-4 text-[#7552D9] dark:text-violet-400" />
              </Link>
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
