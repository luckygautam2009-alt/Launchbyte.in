"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { PublicProfileRead } from "@/lib/types";
import {
  User,
  GraduationCap,
  Sparkles,
  Briefcase,
  Github,
  Linkedin,
  Globe,
  UsersRound,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const handle = params?.handle as string;

  const [profile, setProfile] = useState<PublicProfileRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (handle) {
      loadProfile(handle);
    }
  }, [handle]);

  async function loadProfile(h: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPublicProfile(h);
      setProfile(data);
    } catch (err: any) {
      setError(err?.message || "Profile not found or is private.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Profile Unavailable</h2>
          <p className="text-sm text-slate-400">
            {error || "This profile either does not exist or has been made private by the user."}
          </p>
          <div className="pt-2">
            <Link
              href="/people"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium transition"
            >
              Browse Teammate Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 text-3xl font-bold shrink-0">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name || "U"}
                size="fill"
                className="text-slate-400 text-3xl font-bold"
              />
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{profile.full_name}</h1>
                <span className="text-sm text-brand-400 font-medium bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20">
                  @{profile.handle}
                </span>
                {profile.open_to_teams ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                    <Sparkles className="w-3 h-3" />
                    Open to teams
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                    Not looking
                  </span>
                )}
              </div>

              {profile.headline && (
                <p className="text-base text-slate-300 font-medium">{profile.headline}</p>
              )}

              {profile.institution && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    {profile.institution}
                    {profile.field_of_study && ` • ${profile.field_of_study}`}
                    {profile.graduation_year && ` (Class of ${profile.graduation_year})`}
                  </span>
                </div>
              )}
            </div>

            {/* Social Links & Action */}
            <div className="flex sm:flex-col items-center gap-2 self-stretch sm:self-auto justify-end">
              <div className="flex items-center gap-2">
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {profile.portfolio_url && (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
                    title="Portfolio"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
              <Link
                href={`/teams`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition whitespace-nowrap"
              >
                <UsersRound className="w-3.5 h-3.5" />
                Find / Invite
              </Link>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}
        </div>

        {/* Roles & Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2 text-slate-200">
              <Briefcase className="w-4 h-4 text-brand-400" />
              Target Roles & Teaming
            </h2>
            {profile.looking_for_roles && profile.looking_for_roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.looking_for_roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 rounded-lg bg-brand-950/60 border border-brand-800 text-brand-300 text-xs font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No specific roles specified.</p>
            )}

            {profile.availability_note && (
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Note</span>
                <p className="text-xs text-slate-300 mt-1">{profile.availability_note}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2 text-slate-200">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Skills & Tech Stack
            </h2>
            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No skills listed yet.</p>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60 space-y-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Interests</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2 py-0.5 rounded-md bg-slate-800/50 text-slate-400 text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
