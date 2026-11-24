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
    <div className="min-h-screen bg-[#050510]">
      <PageHero
        eyebrow="PROJECT SHOWCASE"
        title={
          <>
            Collaborative{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Projects
            </span>
          </>
        }
        subtitle="Showcase what you're building, recruit hackathon teammates, and contribute to open projects."
      >
        {user && (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition shadow-lg shadow-brand-600/25"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        )}
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <input
            type="text"
            placeholder="Filter by tech stack (e.g. react, python)..."
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />

          <input
            type="text"
            placeholder="Filter by looking for (e.g. frontend, designer)..."
            value={lookingForFilter}
            onChange={(e) => setLookingForFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-3xl">
            <FolderGit2 className="w-14 h-14 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No projects found</h3>
            <p className="text-slate-400 text-sm mb-4">
              Be the first to share an ambitious project or adjust your search filters.
            </p>
            {user && (
              <Link
                href="/projects/new"
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition"
              >
                Create a Project
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-3xl glass-card glow-hover transition flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link href={`/projects/${p.slug}`} className="hover:underline">
                      <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition leading-snug">
                        {p.title}
                      </h3>
                    </Link>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/60">
                      {p.visibility}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">
                    by <span className="text-slate-300 font-medium">{p.owner_name || `@${p.owner_handle}`}</span>
                  </p>

                  {p.summary && (
                    <p className="text-sm text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                      {p.summary}
                    </p>
                  )}

                  {/* Looking For Badges */}
                  {p.looking_for && p.looking_for.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold text-emerald-400 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Looking For:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.looking_for.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
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
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/50"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {p.member_count} member{p.member_count === 1 ? "" : "s"}
                  </span>

                  <Link
                    href={`/projects/${p.slug}`}
                    className="font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
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
