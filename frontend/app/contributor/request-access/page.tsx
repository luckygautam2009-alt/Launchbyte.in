"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  ShieldCheck,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Lock,
} from "lucide-react";
import { LAUNCHBYTE_SOCIALS } from "@/lib/siteContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function RequestContributorAccessPage() {
  const { user, loading: authLoading } = useAuth();
  const [statusLoading, setStatusLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [latestRequest, setLatestRequest] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [teamRole, setTeamRole] = useState("Core Team Member");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      loadStatus();
    } else if (!authLoading) {
      setStatusLoading(false);
    }
  }, [user, authLoading]);

  async function loadStatus() {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem("lb_token");
      const res = await fetch(`${API_BASE}/contributor-access/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHasAccess(data.has_access);
        setLatestRequest(data.latest_request);
      }
    } catch {
      // ignore
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("lb_token");
      const res = await fetch(`${API_BASE}/contributor-access/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          team_role: teamRole.trim(),
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error?.message || "Failed to submit access request.");
      }
      setLatestRequest(data);
      setSuccessMsg(
        `Access request submitted! Admin notification sent to ${LAUNCHBYTE_SOCIALS.email}.`
      );
      setReason("");
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not submit access request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] text-slate-100 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Contributor Permissions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Request Opportunity Listing Access
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            LaunchByte core team members can request contributor access to draft and submit verified opportunities for admin review.
          </p>
        </div>

        {!user ? (
          <div className="p-8 rounded-3xl glass-card border border-violet-500/30 text-center space-y-4">
            <Lock className="w-10 h-10 text-violet-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Sign In Required</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Please sign in with your verified LaunchByte account before requesting opportunity listing access.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white text-sm font-semibold"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : !user.is_email_verified ? (
          <div className="p-8 rounded-3xl glass-card border border-amber-500/30 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Email Verification Required</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Your email ({user.email}) must be verified before you can request contributor permissions.
            </p>
            <Link
              href="/verify-email"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-200 text-sm font-semibold"
            >
              <span>Verify Email</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : hasAccess ? (
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Listing Access Active</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Your account has contributor permissions. You can create drafts, preview opportunities, and submit them for publishing.
            </p>
            <Link
              href="/dashboard/opportunities"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white text-sm font-semibold"
            >
              <span>Open Opportunity Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : latestRequest?.status === "pending" ? (
          <div className="p-8 rounded-3xl glass-card border border-cyan-500/30 text-center space-y-4">
            <Clock className="w-10 h-10 text-cyan-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Request Pending Admin Review</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Your access request ({latestRequest.team_role}) is currently awaiting review by the LaunchByte admin.
            </p>
            <div className="text-xs font-mono text-slate-400">
              Submitted on {new Date(latestRequest.created_at).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl glass-card border border-violet-500/30 space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Full Name *
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Verified Account Email *
              </label>
              <input
                type="email"
                required
                readOnly
                value={email}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-sm outline-none cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Team Role *
              </label>
              <select
                value={teamRole}
                onChange={(e) => setTeamRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm outline-none cursor-pointer"
              >
                <option value="Co-Founder">Co-Founder</option>
                <option value="Head of Community & Event Management">Head of Community & Event Management</option>
                <option value="Technical Head">Technical Head</option>
                <option value="Core Team Member">Core Team Member</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Reason for Requesting Access *
              </label>
              <textarea
                rows={4}
                required
                minLength={10}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe which opportunities or hackathons you plan to curate and list..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] disabled:opacity-60 text-white text-sm font-semibold shadow-lg transition cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{submitting ? "Sending Request..." : "Submit Access Request"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
