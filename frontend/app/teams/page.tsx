"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { TeamDetail } from "@/lib/types";
import {
  Search,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageHero from "@/components/common/PageHero";

export default function TeamsDiscoverPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Raw user inputs (instant for UI typing)
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [openSpotsOnly, setOpenSpotsOnly] = useState(false);

  // Debounced search & skill states
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedSkillFilter, setDebouncedSkillFilter] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 12;

  // Track active request to prevent out-of-order race conditions
  const activeRequestId = useRef(0);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce skill filter input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSkillFilter(skillFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [skillFilter]);

  // When debounced search, debounced skill, or open spots change, reset page to 1
  const prevFiltersRef = useRef({ debouncedSearch, debouncedSkillFilter, openSpotsOnly });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.debouncedSearch !== debouncedSearch ||
      prev.debouncedSkillFilter !== debouncedSkillFilter ||
      prev.openSpotsOnly !== openSpotsOnly
    ) {
      prevFiltersRef.current = { debouncedSearch, debouncedSkillFilter, openSpotsOnly };
      setPage(1);
    }
  }, [debouncedSearch, debouncedSkillFilter, openSpotsOnly]);

  const loadTeams = useCallback(async () => {
    const requestId = ++activeRequestId.current;
    setLoading(true);
    try {
      const skills = debouncedSkillFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await api.listTeams({
        q: debouncedSearch.trim() || undefined,
        skills: skills.length ? skills : undefined,
        has_open_spots: openSpotsOnly || undefined,
        page,
        per_page: perPage,
      });

      // Prevent race conditions where slower early requests overwrite newer ones
      if (requestId === activeRequestId.current) {
        setTeams(res.items || []);
        setTotal(res.total || 0);
      }
    } catch {
      if (requestId === activeRequestId.current) {
        setTeams([]);
        setTotal(0);
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, debouncedSkillFilter, openSpotsOnly, page]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="min-h-screen bg-transparent dark:bg-[#050510]">
      <PageHero
        eyebrow="SQUAD FINDER"
        title={
          <>
            Discover{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 dark:from-violet-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Teams
            </span>
          </>
        }
        subtitle="Find teams to join or create your own squad for the next hackathon."
      >
        <Link
          href="/teams/new"
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/25 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </Link>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-7">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search teams by name, description, or skills..."
              aria-label="Search teams"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-[#17172B] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition shadow-sm dark:shadow-none"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by skills (comma-separated)"
            aria-label="Filter by skills"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="sm:w-64 min-h-[44px] px-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-[#17172B] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition shadow-sm dark:shadow-none"
          />
          <label className="min-h-[44px] flex items-center gap-2.5 px-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm font-medium text-[#424C63] dark:text-slate-200 cursor-pointer hover:border-violet-400 dark:hover:border-slate-600 transition shadow-sm dark:shadow-none">
            <input
              type="checkbox"
              checked={openSpotsOnly}
              onChange={(e) => setOpenSpotsOnly(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            Open spots only
          </label>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 glass-card rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="p-10 sm:p-14 rounded-2xl bg-white/85 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-4 shadow-sm dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-slate-800 text-[#5B3DF5] dark:text-violet-300 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#17172B] dark:text-white">No teams found</h3>
              <p className="text-sm text-[#4B5565] dark:text-slate-300 leading-relaxed">
                Try adjusting your filters or start your own squad to recruit teammates.
              </p>
            </div>
            <Link
              href="/teams/new"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <Plus className="w-4 h-4" />
              Create Team
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.slug}`}
                className="group flex flex-col glass-card glow-hover rounded-2xl p-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#17172B] dark:text-white group-hover:text-[#7552D9] dark:group-hover:text-brand-400 transition truncate">
                    {team.name}
                  </h3>
                  <span className="shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#59647A] dark:text-slate-400 border border-slate-200 dark:border-transparent">
                    {(team.members || []).length}/{team.max_size}
                  </span>
                </div>

                {team.event_title && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 mb-2">
                    {team.event_title}
                  </span>
                )}

                {team.description && (
                  <p className="text-sm text-[#424C63] dark:text-slate-400 line-clamp-2 mb-3">
                    {team.description}
                  </p>
                )}

                {(team.looking_for_skills || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(team.looking_for_skills || []).slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-brand-950 text-[#7552D9] dark:text-brand-300 border border-violet-200 dark:border-brand-800/40"
                      >
                        {skill}
                      </span>
                    ))}
                    {(team.looking_for_skills || []).length > 4 && (
                      <span className="text-xs text-[#647084] dark:text-slate-500">
                        +{(team.looking_for_skills || []).length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-200 dark:border-slate-800/50">
                  <div className="flex -space-x-2">
                    {(team.members || []).slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-900 flex items-center justify-center text-xs text-[#17172B] dark:text-white font-medium"
                        title={m.full_name}
                      >
                        {m.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    ))}
                  </div>
                  {team.open_spots > 0 ? (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">
                      {team.open_spots} spot{team.open_spots !== 1 ? "s" : ""}{" "}
                      open
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Full</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[#424C63] dark:text-slate-300 hover:text-[#17172B] dark:hover:text-white disabled:opacity-40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[#4B5565] dark:text-slate-300 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[#424C63] dark:text-slate-300 hover:text-[#17172B] dark:hover:text-white disabled:opacity-40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
