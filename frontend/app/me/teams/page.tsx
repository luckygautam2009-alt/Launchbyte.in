"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { TeamDetail } from "@/lib/types";
import {
  UsersRound,
  Plus,
  Shield,
  ExternalLink,
  Lock,
  Sparkles,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function MyTeamsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (user) {
      loadMyTeams();
    }
  }, [user, authLoading, router]);

  async function loadMyTeams() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyTeams();
      setTeams(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load your teams.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
            <p className="text-slate-400 text-sm mt-1">
              Teams you lead or participate in across hackathons and challenges.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/teams"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-sm font-medium transition"
            >
              Browse All Teams
            </Link>
            <Link
              href="/teams/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition shadow-lg shadow-brand-600/20"
            >
              <Plus className="w-4 h-4" />
              Create Team
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Teams List */}
        {teams.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <UsersRound className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-200">No Teams Found</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                You haven't formed or joined any teams yet. Create your own team or browse existing teams to find teammates.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/teams/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                Create a Team
              </Link>
              <Link
                href="/teams"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
              >
                Find Teams
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => {
              const isLeader = team.owner_id === user?.id || team.is_leader;
              const memberCount = team.members ? team.members.length : 1;

              return (
                <div
                  key={team.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition space-y-6 relative group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold text-lg overflow-hidden shrink-0">
                          {team.avatar_url ? (
                            <img src={team.avatar_url} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            team.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/teams/${team.slug}`}
                            className="font-bold text-lg text-slate-100 hover:text-brand-400 transition flex items-center gap-1.5"
                          >
                            {team.name}
                            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-400 transition" />
                          </Link>
                          {team.event_title && (
                            <span className="text-xs text-brand-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {team.event_title}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {isLeader && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3" />
                            Leader
                          </span>
                        )}
                        {team.is_locked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {team.description && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {team.description}
                      </p>
                    )}

                    {team.looking_for_skills && team.looking_for_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {team.looking_for_skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <UsersRound className="w-4 h-4 text-slate-500" />
                      <span>
                        {memberCount} / {team.max_size} members
                      </span>
                    </div>

                    <Link
                      href={`/teams/${team.slug}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition"
                    >
                      Team Dashboard
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
