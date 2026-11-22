"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { TeamDetail } from "@/lib/types";
import {
  Search,
  Users,
  Plus,
  MapPin,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function TeamsDiscoverPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [openSpotsOnly, setOpenSpotsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    loadTeams();
  }, [search, skillFilter, openSpotsOnly, page]);

  async function loadTeams() {
    setLoading(true);
    try {
      const skills = skillFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await api.listTeams({
        q: search || undefined,
        skills: skills.length ? skills : undefined,
        has_open_spots: openSpotsOnly || undefined,
        page,
        per_page: perPage,
      });
      setTeams(res.items);
      setTotal(res.total);
    } catch {
      console.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-400" />
            Discover Teams
          </h1>
          <p className="text-slate-400 mt-1">
            Find teams to join or create your own
          </p>
        </div>
        <Link
          href="/teams/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl shadow-md shadow-brand-600/20 transition"
        >
          <Plus className="w-5 h-5" />
          Create Team
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
          />
        </div>
        <input
          type="text"
          placeholder="Filter by skills (comma-separated)"
          value={skillFilter}
          onChange={(e) => {
            setSkillFilter(e.target.value);
            setPage(1);
          }}
          className="sm:w-64 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
        />
        <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 cursor-pointer hover:border-slate-600 transition">
          <input
            type="checkbox"
            checked={openSpotsOnly}
            onChange={(e) => {
              setOpenSpotsOnly(e.target.checked);
              setPage(1);
            }}
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
              className="h-52 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No teams found</p>
          <p className="text-slate-500 text-sm mt-1">
            Try adjusting your filters or create a new team
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className="group block bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-brand-500/50 hover:bg-slate-900/80 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white group-hover:text-brand-400 transition truncate">
                  {team.name}
                </h3>
                <span className="shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {team.members.length}/{team.max_size}
                </span>
              </div>

              {team.event_title && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 mb-2">
                  {team.event_title}
                </span>
              )}

              {team.description && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                  {team.description}
                </p>
              )}

              {team.looking_for_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {team.looking_for_skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800/40"
                    >
                      {skill}
                    </span>
                  ))}
                  {team.looking_for_skills.length > 4 && (
                    <span className="text-xs text-slate-500">
                      +{team.looking_for_skills.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/50">
                <div className="flex -space-x-2">
                  {team.members.slice(0, 4).map((m) => (
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
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
