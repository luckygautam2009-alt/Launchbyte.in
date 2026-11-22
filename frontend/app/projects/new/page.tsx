"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  FolderGit2,
  ArrowLeft,
  Plus,
  X,
  Code2,
  Sparkles,
  Globe,
  Github,
  Lock,
} from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [visibility, setVisibility] = useState("public");

  // Tag inputs
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [lookingInput, setLookingInput] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddTech() {
    const val = techInput.trim().toLowerCase();
    if (val && !techStack.includes(val)) {
      setTechStack([...techStack, val]);
      setTechInput("");
    }
  }

  function handleAddLooking() {
    const val = lookingInput.trim();
    if (val && !lookingFor.includes(val)) {
      setLookingFor([...lookingFor, val]);
      setLookingInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const project = await api.createProject({
        title: title.trim(),
        slug: slug.trim() || undefined,
        summary: summary.trim() || undefined,
        description: description.trim() || undefined,
        repo_url: repoUrl.trim() || undefined,
        demo_url: demoUrl.trim() || undefined,
        tech_stack: techStack,
        looking_for: lookingFor,
        visibility,
      });
      router.push(`/projects/${project.slug}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create project");
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 mb-4">Please log in to publish a project.</p>
        <Link href="/login" className="px-5 py-2 rounded-xl bg-brand-600 text-white font-medium">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Projects
      </Link>

      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2.5">
          <FolderGit2 className="w-7 h-7 text-brand-400" />
          Create Collaborative Project
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Publish your project to find collaborators, showcase achievements, and automatically provision a team chat room.
        </p>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Custom Slug */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Project Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Autonomous AI Hackathon Matcher"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom URL Slug (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. autonomous-ai-matcher"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Short Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Elevator Pitch / Summary</label>
            <input
              type="text"
              placeholder="A one-sentence summary of what this project does and who it's for."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Markdown Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Description (Markdown)</label>
            <textarea
              rows={6}
              placeholder="## Overview&#10;Describe problem statement, tech architecture, roadmap, and how others can contribute..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Tech Stack Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tech Stack</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Add skill (e.g. nextjs, python, rust)..."
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTechStack(techStack.filter((x) => x !== t))}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Looking For Roles Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Looking for Roles (Collaborator recruiting)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Role needed (e.g. Frontend Dev, UI/UX Designer, DevOps)..."
                value={lookingInput}
                onChange={(e) => setLookingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLooking();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddLooking}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lookingFor.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5"
                >
                  {role}
                  <button
                    type="button"
                    onClick={() => setLookingFor(lookingFor.filter((x) => x !== role))}
                    className="text-emerald-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Repo & Demo URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">GitHub / Repo URL</label>
              <input
                type="url"
                placeholder="https://github.com/org/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Live Demo URL</label>
              <input
                type="url"
                placeholder="https://myproject.dev"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200"
            >
              <option value="public">Public (Visible to everyone on LaunchByte)</option>
              <option value="connections">Connections Only (Only your approved connections can view)</option>
              <option value="private">Private (Only explicitly added team members)</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Link
              href="/projects"
              className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-brand-600/20"
            >
              {submitting ? "Publishing..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
