"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { TeamMember } from "@/lib/types";
import {
  ShieldCheck,
  Zap,
  Users2,
  Linkedin,
  Github,
  Globe,
  Loader2,
  Sparkles,
  Trophy,
  CheckCircle,
} from "lucide-react";

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPublicTeam()
      .then((members) => setTeam(members))
      .catch(() => setTeam([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero / Mission */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          The LaunchByte Mission
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Where Ambition Meets Opportunity, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Built on Trust & Velocity
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          LaunchByte was created to solve what broken legacy platforms ignore:
          zero-spam listings, instant hosting setup for organizers, and authentic teammate discovery for hackathon builders.
        </p>
      </section>

      {/* Why We're Different */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition group">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Uncompromising Trust</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every listing passes through strict moderation and automated anti-ghosting checks. We flag suspicious postings and verify legitimate organizations so hackers never waste time on scams.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition group">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Speed of Hosting</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            No endless paperwork or 2-week delays. Organizers publish clean, beautiful hackathon microsites with countdowns, rich markdown descriptions, and automated review queues in minutes.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/40 transition group">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
            <Users2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Teammate Discovery</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Find collaborators who match your exact stack, timezone, and project vision. Never compete alone unless you choose to.
          </p>
        </div>
      </section>

      {/* Trust & Standards Comparison */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 sm:p-12">
        <div className="max-w-3xl mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Setting a New Standard</h2>
          <p className="text-sm text-slate-400">
            How LaunchByte outpaces legacy platforms like Devfolio, Unstop, and Hack2skill
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            "Atomic real-time view counts and anti-scraping protections",
            "Cryptographically hashed single-use verification & reset tokens",
            "Strict MIME magic-byte validation and Pillow EXIF-stripping for all uploads",
            "Automated community reporting thresholds with real-time audit logging",
            "Clean keyboard accessibility, responsive mobile-first layouts, and zero bloat",
            "100% typed API client with zero runtime schema drift",
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-300 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Our Team */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Meet the Team</h2>
          <p className="text-slate-400 text-sm">
            The engineers, community organizers, and designers behind LaunchByte.
          </p>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-2" />
            <span>Loading team members...</span>
          </div>
        ) : team.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Team roster updating shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div
                key={member.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center hover:border-slate-700 transition"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-indigo-500/20 bg-slate-800 relative">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-400 bg-indigo-500/10">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-0.5">{member.name}</h3>
                <p className="text-xs font-semibold text-indigo-400 mb-3">{member.designation}</p>
                {member.bio && (
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                    {member.bio}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-3 pt-3 border-t border-slate-800/80 w-full justify-center">
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      aria-label={`${member.name}'s LinkedIn`}
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.github_url && (
                    <a
                      href={member.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      aria-label={`${member.name}'s GitHub`}
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="text-center py-12 rounded-3xl bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-slate-900/40 border border-indigo-500/20 p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Ready to Host or Compete?
        </h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto mb-6">
          Whether you are launching your university’s flagship hackathon or applying to summer engineering fellowships, LaunchByte is your home.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/opportunities"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition text-sm"
          >
            Explore Opportunities
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition text-sm"
          >
            Create Organizer Account
          </Link>
        </div>
      </section>
    </div>
  );
}
