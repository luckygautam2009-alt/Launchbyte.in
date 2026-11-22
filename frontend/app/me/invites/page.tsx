"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { TeamInviteRead } from "@/lib/types";
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  UsersRound,
  ExternalLink,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function MyInvitesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [invites, setInvites] = useState<TeamInviteRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("pending");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (user) {
      loadInvites();
    }
  }, [user, authLoading, router]);

  async function loadInvites() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listMyInvites();
      setInvites(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load invites.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(invite: TeamInviteRead) {
    setActingId(invite.id);
    setError(null);
    setSuccess(null);
    try {
      await api.acceptInvite(invite.id);
      setSuccess(`Joined "${invite.team_name}" successfully!`);
      // Reload list
      await loadInvites();
    } catch (err: any) {
      setError(err?.message || "Failed to accept invite.");
    } finally {
      setActingId(null);
    }
  }

  async function handleDecline(inviteId: string) {
    setActingId(inviteId);
    setError(null);
    setSuccess(null);
    try {
      await api.declineInvite(inviteId);
      setSuccess("Invite declined.");
      await loadInvites();
    } catch (err: any) {
      setError(err?.message || "Failed to decline invite.");
    } finally {
      setActingId(null);
    }
  }

  const filteredInvites = invites.filter((inv) => {
    if (filter === "pending") return inv.status === "pending";
    if (filter === "responded") return inv.status !== "pending";
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Invitations</h1>
            <p className="text-slate-400 text-sm mt-1">
              Review invites sent by team leaders to join their hackathon teams.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/teams"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-sm font-medium transition"
            >
              Browse Teams
            </Link>
            <Link
              href="/me/teams"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition"
            >
              My Teams
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
        {success && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm">{success}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === "pending"
                ? "bg-brand-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Pending ({invites.filter((i) => i.status === "pending").length})
          </button>
          <button
            onClick={() => setFilter("responded")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === "responded"
                ? "bg-brand-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Past / Responded ({invites.filter((i) => i.status !== "pending").length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === "all"
                ? "bg-brand-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({invites.length})
          </button>
        </div>

        {/* List */}
        {filteredInvites.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <Mail className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">
              {filter === "pending"
                ? "You have no pending team invitations."
                : "No invitations match this view."}
            </p>
            <div className="pt-2">
              <Link
                href="/people"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium transition"
              >
                Find Hackers & Teams
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvites.map((invite) => {
              const isPending = invite.status === "pending";
              const isBusy = actingId === invite.id;

              return (
                <div
                  key={invite.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/teams/${invite.team_slug}`}
                        className="text-lg font-semibold hover:text-brand-400 transition flex items-center gap-1.5"
                      >
                        {invite.team_name}
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                      </Link>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          invite.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : invite.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {invite.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Invited by <strong className="text-slate-200">{invite.inviter_name}</strong> on{" "}
                      {new Date(invite.created_at).toLocaleDateString()}
                    </p>

                    {invite.message && (
                      <p className="text-sm text-slate-300 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        "{invite.message}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => handleAccept(invite)}
                        disabled={isBusy}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(invite.id)}
                        disabled={isBusy}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition border border-slate-700 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
