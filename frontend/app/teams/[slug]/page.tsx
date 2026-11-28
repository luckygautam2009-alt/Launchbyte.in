"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { TeamDetail, TeamInviteRead, TeamJoinRequestRead } from "@/lib/types";
import OtpVerifyModal from "@/components/auth/OtpVerifyModal";
import {
  Users,
  Crown,
  UserMinus,
  UserPlus,
  Send,
  ArrowLeft,
  Settings,
  LogOut,
  Trash2,
  X,
  Check,
  Clock,
  Lock,
  Shield,
} from "lucide-react";

type Tab = "members" | "invites" | "requests";

export default function TeamDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("members");

  // Invite state
  const [invites, setInvites] = useState<TeamInviteRead[]>([]);
  const [inviteHandle, setInviteHandle] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviting, setInviting] = useState(false);

  // Join requests state
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequestRead[]>([]);

  // Modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDisbandModal, setShowDisbandModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [joinRequestLoading, setJoinRequestLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      const t = await api.getTeamBySlug(slug);
      setTeam(t);
    } catch {
      setError("Team not found");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    if (!team || !team.is_leader) return;
    if (activeTab === "invites") {
      api.listTeamInvites(team.id).then(setInvites).catch(() => {});
    } else if (activeTab === "requests") {
      api.listTeamJoinRequests(team.id).then(setJoinRequests).catch(() => {});
    }
  }, [activeTab, team]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="h-48 bg-white/90 dark:bg-slate-900/60 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <p className="text-[#424C63] dark:text-slate-400 text-lg">{error || "Team not found"}</p>
        <Link href="/teams" className="text-[#7552D9] dark:text-brand-400 hover:text-[#7552D9] dark:hover:text-brand-300 text-sm mt-4 inline-block">
          ← Back to Teams
        </Link>
      </div>
    );
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteHandle.trim() || !team) return;
    setInviting(true);
    setActionError("");
    try {
      await api.createTeamInvite(team.id, {
        handle: inviteHandle.trim(),
        message: inviteMsg.trim() || undefined,
      });
      setInviteHandle("");
      setInviteMsg("");
      const updated = await api.listTeamInvites(team.id);
      setInvites(updated);
    } catch (err: any) {
      setActionError(err?.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!team) return;
    try {
      await api.revokeInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch {}
  }

  async function handleAcceptRequest(reqId: string) {
    try {
      await api.acceptJoinRequest(reqId);
      await loadTeam();
      if (team) {
        const updated = await api.listTeamJoinRequests(team.id);
        setJoinRequests(updated);
      }
    } catch {}
  }

  async function handleRejectRequest(reqId: string) {
    try {
      await api.rejectJoinRequest(reqId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch {}
  }

  async function handleRemoveMember(userId: string) {
    if (!team) return;
    try {
      await api.removeTeamMember(team.id, userId);
      await loadTeam();
    } catch {}
  }

  async function handleTransfer() {
    if (!team || !transferTarget) return;
    setActionLoading(true);
    try {
      await api.transferLeadership(team.id, transferTarget);
      setShowTransferModal(false);
      await loadTeam();
    } catch (err: any) {
      setActionError(err?.message || "Transfer failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisband() {
    if (!team) return;
    setActionLoading(true);
    try {
      await api.disbandTeam(team.id);
      router.push("/teams");
    } catch (err: any) {
      setActionError(err?.message || "Disband failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    if (!team) return;
    setActionLoading(true);
    try {
      await api.leaveTeam(team.id);
      router.push("/teams");
    } catch (err: any) {
      setActionError(err?.message || "Leave failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoinRequest() {
    if (!team) return;
    setJoinRequestLoading(true);
    setActionError("");
    try {
      await api.createJoinRequest(team.id, { message: "I'd love to join!" });
      await loadTeam();
    } catch (err: any) {
      if (err?.code === "EMAIL_NOT_VERIFIED" || String(err?.message || "").toLowerCase().includes("email verification required")) {
        setShowOtpModal(true);
        return;
      }
      setActionError(err?.message || "Failed to send join request");
    } finally {
      setJoinRequestLoading(false);
    }
  }

  const nonLeaderMembers = team.members.filter((m) => m.role !== "leader");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/teams" className="inline-flex items-center gap-1.5 text-sm text-[#424C63] dark:text-slate-400 hover:text-[#17172B] dark:hover:text-white transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Teams
      </Link>

      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#17172B] dark:text-white flex items-center gap-3">
              {team.name}
              {team.is_locked && (
                <span title="Teams locked">
                  <Lock className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#424C63] dark:text-slate-400">
                {team.visibility}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#424C63] dark:text-slate-400">
                {team.members.length}/{team.max_size} members
              </span>
              {team.event_title && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                  {team.event_title}
                </span>
              )}
              {team.open_spots > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {team.open_spots} open spot{team.open_spots !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {team.description && <p className="text-[#424C63] dark:text-slate-400 text-sm mt-3">{team.description}</p>}
            {team.looking_for_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {team.looking_for_skills.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-violet-50 dark:bg-brand-950 text-[#7552D9] dark:text-brand-300 border border-violet-200 dark:border-brand-800/40">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {team.is_leader && (
              <>
                <button onClick={() => setShowTransferModal(true)} className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#2F3A52] dark:text-slate-300 rounded-lg transition">
                  <Crown className="w-3.5 h-3.5 inline mr-1" /> Transfer
                </button>
                <button onClick={() => setShowDisbandModal(true)} className="px-3 py-2 text-xs bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg transition">
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Disband
                </button>
              </>
            )}
            {team.is_member && !team.is_leader && (
              <button onClick={() => setShowLeaveModal(true)} className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#2F3A52] dark:text-slate-300 rounded-lg transition">
                <LogOut className="w-3.5 h-3.5 inline mr-1" /> Leave
              </button>
            )}
            {!team.is_member && !team.has_pending_join_request && team.accepting_requests && !team.is_locked && team.open_spots > 0 && (
              <button onClick={handleJoinRequest} disabled={joinRequestLoading} className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition disabled:opacity-50">
                {joinRequestLoading ? "Sending..." : "Request to Join"}
              </button>
            )}
            {team.has_pending_join_request && (
              <span className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-[#424C63] dark:text-slate-400 rounded-xl flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Pending...
              </span>
            )}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-300 text-sm">
          {actionError}
        </div>
      )}

      {/* Tabs */}
      {team.is_member && (
        <div className="flex gap-1 mb-6 bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
          {(["members", ...(team.is_leader ? ["invites", "requests"] : [])] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition capitalize ${
                activeTab === tab ? "bg-slate-100 dark:bg-slate-800 text-[#17172B] dark:text-white" : "text-[#424C63] dark:text-slate-400 hover:text-[#17172B] dark:hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-3">
          {team.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm text-[#17172B] dark:text-white font-semibold">
                  {m.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/u/${m.handle || m.user_id}`} className="text-[#17172B] dark:text-white font-medium hover:text-[#7552D9] dark:hover:text-brand-400 transition">
                      {m.full_name}
                    </Link>
                    {m.role === "leader" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-semibold uppercase">
                        Leader
                      </span>
                    )}
                  </div>
                  {m.handle && <p className="text-xs text-slate-500">@{m.handle}</p>}
                </div>
              </div>
              {team.is_leader && m.role !== "leader" && (
                <button onClick={() => handleRemoveMember(m.user_id)} className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition" title="Remove">
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invites Tab */}
      {activeTab === "invites" && team.is_leader && (
        <div>
          <form onSubmit={handleSendInvite} className="flex gap-3 mb-6">
            <input
              type="text"
              value={inviteHandle}
              onChange={(e) => setInviteHandle(e.target.value)}
              placeholder="@handle"
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[#17172B] dark:text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition"
            />
            <button type="submit" disabled={inviting || !inviteHandle.trim()} className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition disabled:opacity-50 flex items-center gap-2">
              <Send className="w-4 h-4" />
              {inviting ? "..." : "Invite"}
            </button>
          </form>
          {invites.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No pending invites</p>
          ) : (
            <div className="space-y-3">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-[#17172B] dark:text-white text-sm font-medium">{inv.invited_handle || inv.invited_name || "Invited User"}</p>
                    <p className="text-xs text-slate-500">{inv.status} · expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                  </div>
                  {inv.status === "pending" && (
                    <button onClick={() => handleRevokeInvite(inv.id)} className="text-xs text-[#424C63] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition">
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Join Requests Tab */}
      {activeTab === "requests" && team.is_leader && (
        <div>
          {joinRequests.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No pending join requests</p>
          ) : (
            <div className="space-y-3">
              {joinRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm text-[#17172B] dark:text-white font-semibold">
                      {req.user_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-[#17172B] dark:text-white text-sm font-medium">{req.user_name}</p>
                      {req.user_skills.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {req.user_skills.slice(0, 3).map((s) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-brand-950 text-[#7552D9] dark:text-brand-300">{s}</span>
                          ))}
                        </div>
                      )}
                      {req.message && <p className="text-xs text-slate-500 mt-0.5">&quot;{req.message}&quot;</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptRequest(req.id)} className="p-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition" title="Accept">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRejectRequest(req.id)} className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition" title="Reject">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#17172B] dark:text-white mb-4">Transfer Leadership</h3>
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-[#17172B] dark:text-white mb-4"
            >
              <option value="">Select a member</option>
              {nonLeaderMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.full_name}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-sm text-[#424C63] dark:text-slate-400 hover:text-[#17172B] dark:hover:text-white transition">Cancel</button>
              <button onClick={handleTransfer} disabled={!transferTarget || actionLoading} className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition disabled:opacity-50">
                {actionLoading ? "..." : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disband Modal */}
      {showDisbandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#17172B] dark:text-white mb-2">Disband Team</h3>
            <p className="text-[#424C63] dark:text-slate-400 text-sm mb-6">This will permanently disband &quot;{team.name}&quot;. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDisbandModal(false)} className="px-4 py-2 text-sm text-[#424C63] dark:text-slate-400 hover:text-[#17172B] dark:hover:text-white transition">Cancel</button>
              <button onClick={handleDisband} disabled={actionLoading} className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition disabled:opacity-50">
                {actionLoading ? "..." : "Disband"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#17172B] dark:text-white mb-2">Leave Team</h3>
            <p className="text-[#424C63] dark:text-slate-400 text-sm mb-6">Are you sure you want to leave &quot;{team.name}&quot;?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowLeaveModal(false)} className="px-4 py-2 text-sm text-[#424C63] dark:text-slate-400 hover:text-[#17172B] dark:hover:text-white transition">Cancel</button>
              <button onClick={handleLeave} disabled={actionLoading} className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition disabled:opacity-50">
                {actionLoading ? "..." : "Leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      <OtpVerifyModal
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleJoinRequest}
        title="Verify your email to join this team"
      />
    </div>
  );
}
