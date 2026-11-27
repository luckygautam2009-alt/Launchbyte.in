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
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Teams
            </span>
          </>
        }
        subtitle="Find teams to join or create your own squad for the next hackathon."
      >
        <Link
          href="/teams/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl shadow-lg shadow-brand-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </Link>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search teams by name, description, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-[#17172B] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none transition shadow-sm dark:shadow-none"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by skills (comma-separated)"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="sm:w-64 px-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-[#17172B] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none transition shadow-sm dark:shadow-none"
          />
          <label className="flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-[#424C63] dark:text-slate-300 cursor-pointer hover:border-violet-400 dark:hover:border-slate-600 transition shadow-sm dark:shadow-none">
            <input
              type="checkbox"
              checked={openSpotsOnly}
              onChange={(e) => setOpenSpotsOnly(e.target.checked)}
              className="accent-brand-500"
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
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-[#424C63] dark:text-slate-400 text-lg">No teams found</p>
            <p className="text-[#647084] dark:text-slate-500 text-sm mt-1">
              Try adjusting your filters or create a new team
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.slug}`}
                className="group block glass-card glow-hover rounded-2xl p-5 transition-all"
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
                        className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs text-white font-medium"
                        title={m.full_name}
                      >
                        {m.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    ))}
                  </div>
                  {team.open_spots > 0 ? (
                    <span className="text-xs text-emerald-400">
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
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition"
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
