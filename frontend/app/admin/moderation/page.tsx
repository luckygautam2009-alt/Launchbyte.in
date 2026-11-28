"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { OpportunityAdminItem } from "@/lib/types";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Users,
  Calendar,
  Ban,
} from "lucide-react";


export default function AdminModerationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<"opportunities" | "access" | "events">("opportunities");
  const [opportunities, setOpportunities] = useState<OpportunityAdminItem[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [eventSubmissions, setEventSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");

  const fetchAll = async () => {
    setLoading(true);
    try {
      if (tab === "opportunities") {
        const res = await api.listAdminOpportunities({ status: statusFilter, limit: 50 });
        setOpportunities(res.items);
      } else if (tab === "access") {
        const res = await api.authFetch(`/admin/contributor-access`, {
        });
        if (res.ok) setAccessRequests(await res.json());
      } else {
        const res = await api.authFetch(`/admin/host-events`, {
        });
        if (res.ok) setEventSubmissions(await res.json());
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to load queue.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin" && user.role !== "moderator") {
        showToast("Admin / Moderator access required", "error");
        router.push("/");
      } else {
        fetchAll();
      }
    }
  }, [user, authLoading, tab, statusFilter]);

  async function handleOppApprove(opp: OpportunityAdminItem) {
    try {
      await api.approveOpportunity(opp.id, "verified", 90);
      showToast(`Published "${opp.title}"!`, "success");
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || "Approve failed", "error");
    }
  }

  async function handleOppReject(opp: OpportunityAdminItem) {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      await api.rejectOpportunity(opp.id, reason);
      showToast("Opportunity rejected.", "success");
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || "Reject failed", "error");
    }
  }

  async function handleAccessAction(id: string, action: "approve" | "reject" | "revoke") {
    try {
      const res = await api.authFetch(`/admin/contributor-access/${id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Action ${action} failed`);
      showToast(`Contributor request ${action}d.`, "success");
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || "Action failed", "error");
    }
  }

  async function handleEventAction(id: string, action: "approve" | "reject") {
    try {
      const res = await api.authFetch(`/admin/host-events/${id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Action ${action} failed`);
      showToast(`Event submission ${action}d.`, "success");
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || "Action failed", "error");
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent dark:bg-[#050510] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-700 dark:text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-[#050510] text-[#17172B] dark:text-slate-100 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-cyan-700 dark:text-cyan-400" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17172B] dark:text-white">LaunchByte Admin Moderation</h1>
              <p className="text-xs sm:text-sm text-[#424C63] dark:text-slate-400">
                Review opportunities, contributor access requests, and public event submissions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "opportunities", label: "Opportunities" },
              { id: "access", label: "Team Access Requests" },
              { id: "events", label: "Public Host Events" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  tab === t.id
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#424C63] dark:text-slate-400 hover:text-[#17172B] dark:hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "opportunities" && (
          <div className="flex flex-wrap gap-2">
            {["pending_review", "published", "draft", "rejected", "archived"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${
                  statusFilter === s
                    ? "bg-violet-600/30 border border-violet-400 text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#424C63] dark:text-slate-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-7 h-7 text-violet-700 dark:text-violet-400 animate-spin" />
          </div>
        ) : tab === "opportunities" ? (
          <div className="space-y-3">
            {opportunities.length === 0 ? (
              <div className="p-8 rounded-2xl glass-card text-center text-sm text-[#424C63] dark:text-slate-400">
                No opportunities in &ldquo;{statusFilter}&rdquo;.
              </div>
            ) : (
              opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-bold text-[#17172B] dark:text-white break-words">{opp.title}</h3>
                    <p className="text-xs text-[#424C63] dark:text-slate-400">
                      {opp.organizer_name_override || opp.organization?.name} • {opp.type} • {opp.status}
                    </p>
                    {opp.application_url && (
                      <a
                        href={opp.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-cyan-700 dark:text-cyan-300 inline-flex items-center gap-1 hover:underline break-all"
                      >
                        <span>{opp.application_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {opp.status !== "published" && (
                      <button
                        type="button"
                        onClick={() => handleOppApprove(opp)}
                        className="min-h-[42px] inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Publish</span>
                      </button>
                    )}
                    {opp.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleOppReject(opp)}
                        className="min-h-[42px] inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-600 dark:text-red-300 text-xs font-semibold cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : tab === "access" ? (
          <div className="space-y-3">
            {accessRequests.length === 0 ? (
              <div className="p-8 rounded-2xl glass-card text-center text-sm text-[#424C63] dark:text-slate-400">
                No contributor access requests yet.
              </div>
            ) : (
              accessRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                      <span className="font-bold text-[#17172B] dark:text-white">{req.full_name}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 border border-violet-500/30 text-violet-700 dark:text-violet-200">
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#424C63] dark:text-slate-400">
                      {req.email} • {req.team_role}
                    </p>
                    <p className="text-xs text-[#2F3A52] dark:text-slate-300">{req.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAccessAction(req.id, "approve")}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccessAction(req.id, "reject")}
                          className="px-3.5 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-600 dark:text-red-300 text-xs font-semibold cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => handleAccessAction(req.id, "revoke")}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {eventSubmissions.length === 0 ? (
              <div className="p-8 rounded-2xl glass-card text-center text-sm text-[#424C63] dark:text-slate-400">
                No public event submissions yet.
              </div>
            ) : (
              eventSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                      <span className="font-bold text-[#17172B] dark:text-white">{sub.event_name}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 border border-violet-500/30 text-violet-700 dark:text-violet-200">
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#424C63] dark:text-slate-400">
                      {sub.organizer_name} ({sub.organizer_organization}) • {sub.organizer_email}
                    </p>
                    <a
                      href={sub.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cyan-700 dark:text-cyan-300 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{sub.registration_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEventAction(sub.id, "approve")}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEventAction(sub.id, "reject")}
                          className="px-3.5 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-600 dark:text-red-300 text-xs font-semibold cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
