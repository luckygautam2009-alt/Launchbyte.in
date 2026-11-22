"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ProjectDetail, ProjectCollabRequest } from "@/lib/types";
import {
  FolderGit2,
  ArrowLeft,
  Users,
  Github,
  Globe,
  MessageSquare,
  Sparkles,
  Check,
  X,
  Clock,
  Trash2,
  Shield,
  UserPlus,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [collabRequests, setCollabRequests] = useState<ProjectCollabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request modal
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabMessage, setCollabMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadProject();
  }, [slug, user]);

  async function loadProject() {
    setLoading(true);
    setError(null);
    try {
      const p = await api.getProject(slug);
      setProject(p);

      // If owner, load collab requests
      if (user && p.owner_id === user.id) {
        try {
          const reqs = await api.listProjectCollabRequests(slug);
          setCollabRequests(reqs.filter((r) => r.status === "pending"));
        } catch {}
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCollabRequest() {
    setRequestLoading(true);
    try {
      await api.requestProjectCollab(slug, collabMessage.trim() || undefined);
      setShowCollabModal(false);
      setCollabMessage("");
      await loadProject();
    } catch (err: any) {
      alert(err?.message || "Failed to submit collaboration request");
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!confirm("Withdraw your collaboration request?")) return;
    try {
      await api.withdrawProjectCollab(slug);
      await loadProject();
    } catch (err: any) {
      alert(err?.message || "Failed to withdraw request");
    }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this project?")) return;
    try {
      await api.leaveProject(slug);
      await loadProject();
    } catch (err: any) {
      alert(err?.message || "Failed to leave project");
    }
  }

  async function handleAcceptRequest(requestId: string) {
    try {
      await api.acceptProjectCollab(slug, requestId);
      await loadProject();
    } catch (err: any) {
      alert(err?.message || "Failed to accept request");
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      await api.rejectProjectCollab(slug, requestId);
      await loadProject();
    } catch (err: any) {
      alert(err?.message || "Failed to reject request");
    }
  }

  async function handleDeleteProject() {
    if (!confirm("Permanently delete this project? This cannot be undone.")) return;
    try {
      await api.deleteProject(slug);
      router.push("/projects");
    } catch (err: any) {
      alert(err?.message || "Failed to delete project");
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-500">
        Loading project details...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Project not found</h2>
        <p className="text-slate-400 text-sm mb-6">{error || "This project may be private or has been removed."}</p>
        <Link
          href="/projects"
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === project.owner_id;
  const isMember = project.members.some((m) => m.user_id === user?.id);
  const isPending = project.my_collab_request_status === "pending";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Projects
      </Link>

      {/* Main Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                {project.visibility}
              </span>
              <span className="text-xs text-slate-500">
                Created {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-2">
              {project.title}
            </h1>

            <p className="text-sm text-slate-400">
              Created by <span className="text-slate-200 font-semibold">{project.owner_name || `@${project.owner_handle}`}</span>
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isOwner ? (
              <button
                onClick={handleDeleteProject}
                className="px-3.5 py-2 rounded-xl border border-rose-900/60 hover:bg-rose-950/40 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Project
              </button>
            ) : isMember ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/messages"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-purple-600/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Team Chat
                </Link>
                <button
                  onClick={handleLeave}
                  className="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 text-xs font-medium transition"
                >
                  Leave
                </button>
              </div>
            ) : isPending ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Request Pending
                </span>
                <button
                  onClick={handleWithdraw}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 text-xs font-medium transition"
                >
                  Withdraw
                </button>
              </div>
            ) : user ? (
              <button
                onClick={() => setShowCollabModal(true)}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold flex items-center gap-2 transition shadow-lg shadow-brand-600/20"
              >
                <UserPlus className="w-4 h-4" />
                Request to Collaborate
              </button>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition"
              >
                Sign In to Collaborate
              </Link>
            )}
          </div>
        </div>

        {/* Links bar */}
        {(project.repo_url || project.demo_url) && (
          <div className="flex items-center gap-4 py-3 px-4 rounded-2xl bg-slate-950/40 border border-slate-800 mb-6 text-xs">
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white font-medium transition"
              >
                <Github className="w-4 h-4 text-slate-400" />
                Repository
              </a>
            )}
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white font-medium transition"
              >
                <Globe className="w-4 h-4 text-slate-400" />
                Live Demo
              </a>
            )}
          </div>
        )}

        {/* Summary */}
        {project.summary && (
          <p className="text-base text-slate-200 leading-relaxed mb-6 font-medium">
            {project.summary}
          </p>
        )}

        {/* Looking For */}
        {project.looking_for && project.looking_for.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40">
            <h4 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Open Roles / Looking For
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.looking_for.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-200 border border-emerald-800/60"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="mb-8">
            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Tech Stack
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {project.tech_stack.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700/60"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full Markdown Description */}
        {project.description && (
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider text-slate-300">
              About the Project
            </h3>
            <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {project.description}
            </div>
          </div>
        )}
      </div>

      {/* Collaborators & Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collaborators List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            Project Members ({project.members.length})
          </h3>
          <div className="divide-y divide-slate-800">
            {project.members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200">
                    {m.user?.full_name?.[0]?.toUpperCase() || m.user?.handle?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm">
                      {m.user?.full_name || `@${m.user?.handle}`}
                    </h5>
                    <p className="text-xs text-slate-400">@{m.user?.handle}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* If Owner: Pending Inbound Collaboration Requests */}
        {isOwner && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Inbound Collab Requests ({collabRequests.length})
            </h3>
            {collabRequests.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                No pending collaboration requests.
              </p>
            ) : (
              <div className="space-y-4">
                {collabRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-white">
                        {req.user?.full_name || `@${req.user?.handle}`}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {req.message && (
                      <p className="text-xs text-slate-300 italic mb-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        "{req.message}"
                      </p>
                    )}

                    {req.user?.skills && req.user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {req.user.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-4 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collab Request Modal */}
      {showCollabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Join {project.title}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Tell the project owner about your background, relevant skills, and how you want to contribute.
            </p>

            <textarea
              rows={4}
              placeholder="Hi, I'd love to help with frontend architecture and smart contract testing..."
              value={collabMessage}
              onChange={(e) => setCollabMessage(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCollabModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCollabRequest}
                disabled={requestLoading}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold transition"
              >
                {requestLoading ? "Submitting..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
