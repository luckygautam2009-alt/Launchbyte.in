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
    <div className="min-h-screen bg-[#050510]">
      <PageHero
        eyebrow="TEAMMATE DISCOVERY"
        title={
          <>
            Find{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Teammates
            </span>
          </>
        }
        subtitle="Discover ambitious developers open to teaming up for hackathons and projects."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, handle, or institution..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
            />
          </div>
          <input
            type="text"
            placeholder="Skills (comma-separated)"
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="sm:w-56 px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
          />
          <input
            type="text"
            placeholder="Event ID (optional)"
            value={eventId}
            onChange={e => setEventId(e.target.value)}
            className="sm:w-56 px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
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
          <div className="text-center py-20">
            <UserSearch className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No teammates found</p>
            <p className="text-slate-500 text-sm mt-1">Try different search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map(c => (
              <div key={c.id} className="glass-card glow-hover rounded-2xl p-5 transition">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar
                    src={c.avatar_url}
                    name={c.full_name || "?"}
                    size="fill"
                    className="w-11 h-11 bg-slate-700 text-white font-semibold"
                  />
                  <div className="min-w-0 flex-1">
                    <Link href={`/u/${c.handle}`} className="text-white font-semibold hover:text-brand-400 transition truncate block">
                      {c.full_name}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">@{c.handle}</p>
                    {c.headline && <p className="text-xs text-slate-400 mt-0.5 truncate">{c.headline}</p>}
                  </div>
                  {/* Match Score */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className={`text-lg font-bold ${c.match_score >= 70 ? "text-emerald-400" : c.match_score >= 40 ? "text-amber-400" : "text-slate-500"}`}>
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
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800/50"
                            : "bg-slate-800 text-slate-400 border-slate-700/50"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                    {c.skills.length > 5 && <span className="text-xs text-slate-600">+{c.skills.length - 5}</span>}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50">
                  {c.looking_for_roles.length > 0 && (
                    <span className="text-[10px] text-slate-500">
                      Looking for: {c.looking_for_roles.slice(0, 2).join(", ")}
                    </span>
                  )}
                  <Link href={`/u/${c.handle}`} className="text-xs text-brand-400 hover:text-brand-300 transition flex items-center gap-1">
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
