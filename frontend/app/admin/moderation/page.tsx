"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  Calendar,
  Building2,
  Loader2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function AdminModerationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState<OpportunityAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");

  // Moderation Action State
  const [activeOpp, setActiveOpp] = useState<OpportunityAdminItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [trustScore, setTrustScore] = useState(85);
  const [verificationStatus, setVerificationStatus] = useState("verified");
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.listAdminOpportunities({
        status: statusFilter,
        limit: 50,
      });
      setOpportunities(res.items);
    } catch (err: any) {
      showToast(err?.message || "Failed to load moderation queue.", "error");
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
        fetchQueue();
      }
    }
  }, [user, authLoading, statusFilter]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOpp) return;

    setProcessing(true);
    try {
      await api.approveOpportunity(activeOpp.id, verificationStatus, trustScore);
      showToast(`Approved "${activeOpp.title}" as published!`, "success");
      closeModal();
      fetchQueue();
    } catch (err: any) {
      showToast(err?.message || "Failed to approve opportunity.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOpp) return;
    if (!rejectReason.trim()) {
      showToast("Rejection reason is required to notify the organizer.", "error");
      return;
    }

    setProcessing(true);
    try {
      await api.rejectOpportunity(activeOpp.id, rejectReason.trim());
      showToast(`Rejected "${activeOpp.title}". Organizer notified.`, "info");
      closeModal();
      fetchQueue();
    } catch (err: any) {
      showToast(err?.message || "Failed to reject opportunity.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setActiveOpp(null);
    setActionType(null);
    setRejectReason("");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Moderation Portal
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Opportunity Review Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit and verify submissions before they go live on the public feed.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {["pending_review", "published", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Items */}
      {opportunities.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8 max-w-md mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">All clear!</h3>
          <p className="text-sm text-slate-400">
            No opportunities currently waiting in the {statusFilter.replace("_", " ")} queue.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {opp.type}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {opp.organization?.name || "Organization"}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      Submitted: {new Date(opp.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white tracking-tight">{opp.title}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {opp.summary || opp.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                  <button
                    onClick={() => {
                      setActiveOpp(opp);
                      setActionType("approve");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setActiveOpp(opp);
                      setActionType("reject");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>

              {/* Extra Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500">Deadline: </span>
                  {opp.deadline_at ? new Date(opp.deadline_at).toLocaleDateString() : "Rolling"}
                </div>
                <div>
                  <span className="text-slate-500">Location: </span>
                  {opp.location_type || "N/A"} {opp.location_text ? `(${opp.location_text})` : ""}
                </div>
                <div>
                  <span className="text-slate-500">Application URL: </span>
                  {opp.application_url ? (
                    <a
                      href={opp.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline inline-flex items-center gap-1"
                    >
                      Visit <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    "None"
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {actionType === "approve" && activeOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Approve Opportunity
            </h3>
            <p className="text-xs text-slate-400">
              Publishing: <span className="text-white font-medium">{activeOpp.title}</span>
            </p>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Verification Badge
                </label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="verified">Verified (Official / Vetted)</option>
                  <option value="featured_partner">Featured Partner (High Priority)</option>
                  <option value="unverified">Unverified (Standard Community)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Trust Score (0 - 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={trustScore}
                  onChange={(e) => setTrustScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {processing ? "Approving..." : "Confirm & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {actionType === "reject" && activeOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Reject Opportunity
            </h3>
            <p className="text-xs text-slate-400">
              Rejecting: <span className="text-white font-medium">{activeOpp.title}</span>
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain clearly to the organizer why this opportunity cannot be published (e.g. Broken links, misleading prize pool, inappropriate content)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {processing ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
