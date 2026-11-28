"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { TeammateCandidateRead } from "@/lib/types";
import { Search, UserSearch, ExternalLink } from "lucide-react";
import PageHero from "@/components/common/PageHero";

export default function PeopleDiscoverPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<TeammateCandidateRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    loadPeople();
  }, [search, skillFilter, eventId]);

  async function loadPeople() {
    setLoading(true);
    try {
      const skills = skillFilter.split(",").map(s => s.trim()).filter(Boolean);
      const res = await api.discoverPeople({
        q: search || undefined,
        skills: skills.length ? skills : undefined,
        event_id: eventId || undefined,
        limit: 50,
      });
      setCandidates(res);
    } catch {
      console.error("Failed to load people");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-[#050510]">
      <PageHero
        eyebrow="TEAMMATE DISCOVERY"
        title={
          <>
            Find{" "}
            <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 dark:from-cyan-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              Teammates
            </span>
          </>
        }
        subtitle="Discover ambitious developers open to teaming up for hackathons and projects."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-7">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, handle, or institution..."
              aria-label="Search teammates by name, handle, or institution"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-[#17172B] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition shadow-sm dark:shadow-none"
            />
          </div>
          <input
            type="text"
            placeholder="Skills (comma-separated)"
            aria-label="Filter by skills"
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="sm:w-56 min-h-[44px] px-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-[#17172B] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition shadow-sm dark:shadow-none"
          />
          <input
            type="text"
            placeholder="Event ID (optional)"
            aria-label="Filter by event ID"
            value={eventId}
            onChange={e => setEventId(e.target.value)}
            className="sm:w-56 min-h-[44px] px-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-[#17172B] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition shadow-sm dark:shadow-none"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 glass-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-10 sm:p-14 rounded-2xl bg-white/85 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-3 shadow-sm dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-slate-800 text-[#5B3DF5] dark:text-violet-300 flex items-center justify-center mx-auto">
              <UserSearch className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#17172B] dark:text-white">No teammates found</h3>
            <p className="text-[#4B5565] dark:text-slate-300 text-sm leading-relaxed">
              Try broadening your name, skill, or event search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map(c => (
              <div key={c.id} className="glass-card glow-hover rounded-2xl p-5 flex flex-col transition">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar
                    src={c.avatar_url}
                    name={c.full_name || "?"}
                    size="fill"
                    className="w-11 h-11 bg-slate-200 dark:bg-slate-700 text-[#17172B] dark:text-white font-semibold"
                  />
                  <div className="min-w-0 flex-1">
                    <Link href={`/u/${c.handle}`} className="text-[#17172B] dark:text-white font-semibold hover:text-[#7552D9] dark:hover:text-brand-400 transition truncate block">
                      {c.full_name}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">@{c.handle}</p>
                    {c.headline && <p className="text-xs text-[#424C63] dark:text-slate-400 mt-0.5 truncate">{c.headline}</p>}
                  </div>
                  {/* Match Score */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className={`text-lg font-bold ${c.match_score >= 70 ? "text-emerald-700 dark:text-emerald-400" : c.match_score >= 40 ? "text-amber-700 dark:text-amber-400" : "text-slate-500"}`}>
                      {c.match_score}%
                    </div>
                    <span className="text-[10px] text-slate-500">match</span>
                  </div>
                </div>

                {c.institution && (
                  <p className="text-xs text-slate-500 mb-2">{c.institution}</p>
                )}

                {c.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {c.skills.slice(0, 5).map(skill => (
                      <span
                        key={skill}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          c.shared_skills.includes(skill.toLowerCase())
                            ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                            : "bg-slate-100 dark:bg-slate-800 text-[#424C63] dark:text-slate-400 border-slate-300 dark:border-slate-700/50"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                    {c.skills.length > 5 && <span className="text-xs text-slate-600">+{c.skills.length - 5}</span>}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-slate-200 dark:border-slate-800/50">
                  {c.looking_for_roles.length > 0 && (
                    <span className="text-[11px] text-[#4B5565] dark:text-slate-400 truncate">
                      Looking for: {c.looking_for_roles.slice(0, 2).join(", ")}
                    </span>
                  )}
                  <Link
                    href={`/u/${c.handle}`}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1 ml-auto text-xs font-semibold text-[#5B3DF5] dark:text-brand-400 hover:underline transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                  >
                    Profile <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
