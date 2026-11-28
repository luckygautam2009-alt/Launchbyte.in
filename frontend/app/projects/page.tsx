"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ProjectListItem } from "@/lib/types";
import {
  FolderGit2,
  Plus,
  Search,
  Users,
  Sparkles,
} from "lucide-react";
import PageHero from "@/components/common/PageHero";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [lookingForFilter, setLookingForFilter] = useState("");

  useEffect(() => {
    loadProjects();
  }, [search, techFilter, lookingForFilter]);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await api.listProjects({
        search: search || undefined,
        tech_stack: techFilter || undefined,
        looking_for: lookingForFilter || undefined,
      });
      setProjects(res.items);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-[#050510]">
      <PageHero
        eyebrow="PROJECT SHOWCASE"
        title={
          <>
            Collaborative{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 dark:from-indigo-400 dark:via-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Projects
            </span>
          </>
        }
        subtitle="Showcase what you're building, recruit hackathon teammates, and contribute to open projects."
      >
        {user && (
          <Link
            href="/projects/new"
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition shadow-lg shadow-brand-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        )}
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              aria-label="Search projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-[#17172B] dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 shadow-sm dark:shadow-none"
            />
          </div>

          <input
            type="text"
            placeholder="Filter by tech stack (e.g. react, python)..."
            aria-label="Filter by tech stack"
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-[#17172B] dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 shadow-sm dark:shadow-none"
          />

          <input
            type="text"
            placeholder="Filter by looking for (e.g. frontend, designer)..."
            aria-label="Filter by looking for role"
            value={lookingForFilter}
            onChange={(e) => setLookingForFilter(e.target.value)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-[#17172B] dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 shadow-sm dark:shadow-none"
          />
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 glass-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-10 sm:p-14 text-center glass-card rounded-2xl max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-slate-800 text-[#5B3DF5] dark:text-violet-300 flex items-center justify-center mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#17172B] dark:text-white">No projects found</h3>
              <p className="text-[#4B5565] dark:text-slate-300 text-sm leading-relaxed">
                Be the first to share an ambitious project or adjust your search filters.
              </p>
            </div>
            {user && (
              <Link
                href="/projects/new"
                className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                Create a Project
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl glass-card glow-hover transition flex flex-col justify-between group shadow-sm dark:shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link href={`/projects/${p.slug}`} className="hover:underline">
                      <h3 className="text-lg font-bold text-[#17172B] dark:text-white group-hover:text-[#7552D9] dark:group-hover:text-brand-400 transition leading-snug">
                        {p.title}
                      </h3>
                    </Link>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-[#424C63] dark:text-slate-400 border border-slate-300 dark:border-slate-700/60">
                      {p.visibility}
                    </span>
                  </div>

                  <p className="text-xs text-[#424C63] dark:text-slate-400 mb-3">
                    by <span className="text-[#2F3A52] dark:text-slate-300 font-medium">{p.owner_name || `@${p.owner_handle}`}</span>
                  </p>

                  {p.summary && (
                    <p className="text-sm text-[#2F3A52] dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                      {p.summary}
                    </p>
                  )}

                  {/* Looking For Badges */}
                  {p.looking_for && p.looking_for.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Looking For:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.looking_for.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tech Stack Chips */}
                  {p.tech_stack && p.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {p.tech_stack.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-[#2F3A52] dark:text-slate-300 border border-slate-300 dark:border-slate-700/50"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-[#424C63] dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {p.member_count} member{p.member_count === 1 ? "" : "s"}
                  </span>

                  <Link
                    href={`/projects/${p.slug}`}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center font-semibold text-[#5B3DF5] dark:text-brand-400 hover:underline gap-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 rounded"
                  >
                    View Details &rarr;
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
