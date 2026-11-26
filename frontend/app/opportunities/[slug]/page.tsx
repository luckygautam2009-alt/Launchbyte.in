"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { OpportunityDetail, OpportunityListItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import OpportunityCard from "@/components/OpportunityCard";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Flag,
  Globe,
  MapPin,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Building,
  Clock,
  Eye,
  X,
} from "lucide-react";

export default function OpportunityDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [opp, setOpp] = useState<OpportunityDetail | null>(null);
  const [related, setRelated] = useState<OpportunityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("scam");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showTrustTooltip, setShowTrustTooltip] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      const nextTarget =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/opportunities/${slug}`;
      router.replace(`/login?next=${encodeURIComponent(nextTarget)}`);
    }
  }, [authLoading, user, router, slug]);

  useEffect(() => {
    if (!slug || authLoading || !user) return;
    setLoading(true);
    setError(null);

    api
      .getOpportunity(slug)
      .then((data) => {
        setOpp(data);
        // Load related items of the same type
        api
          .listOpportunities({ type: [data.type], limit: 3 })
          .then((res) => {
            setRelated(res.items.filter((item) => item.id !== data.id));
          })
          .catch(() => {});
      })
      .catch((err) => {
        setError(err?.message || "Opportunity not found or has been unlisted.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, authLoading, user]);

  const toggleSave = async () => {
    if (!user) {
      toast.info("Please log in to save opportunities.");
      return;
    }
    if (!opp) return;

    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) {
        await api.saveOpportunity(opp.id);
        toast.success("Saved to bookmarks");
      } else {
        await api.unsaveOpportunity(opp.id);
        toast.info("Removed from bookmarks");
      }
    } catch {
      setIsSaved(!next);
      toast.error("Failed to update bookmark.");
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please log in to submit a report.");
      return;
    }
    if (!opp) return;

    setSubmittingReport(true);
    try {
      await api.reportOpportunity(opp.id, reportReason, reportDetails);
      toast.success("Thank you for your report. Our trust & safety team has been notified.");
      setReportModalOpen(false);
      setReportDetails("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit report.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const calculateCountdown = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    if (diff <= 0) return "Application deadline has passed";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-6">
        <div className="h-8 w-40 rounded-xl bg-slate-900 animate-pulse" />
        <div className="h-64 rounded-3xl bg-slate-900 animate-pulse" />
        <div className="h-96 rounded-3xl bg-slate-900 animate-pulse" />
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-900 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Posting Unavailable</h2>
        <p className="text-sm text-slate-400">{error || "This posting does not exist or has been removed."}</p>
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all opportunities
        </Link>
      </div>
    );
  }

  const countdown = calculateCountdown(opp.deadline_at);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      {/* Hero Banner Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {opp.organization.logo_url ? (
              <img
                src={opp.organization.logo_url}
                alt={opp.organization.name}
                className="w-16 h-16 rounded-2xl object-cover bg-slate-800 border border-slate-700 shrink-0 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <Building className="w-8 h-8" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-300">
                  {opp.organization.name}
                </span>

                {opp.verification_status === "verified" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Organization
                  </span>
                )}
                {opp.verification_status === "flagged" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-400 border border-amber-800/80">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Community Flagged
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                {opp.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {opp.location_text || opp.location_type || "Remote"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <DollarSign className="w-3.5 h-3.5" />
                  {opp.compensation_note || opp.compensation_type}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  {opp.view_count} views
                </span>
              </div>
            </div>
          </div>

          {/* Right Hero Controls: Trust score & Actions */}
          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            {opp.trust_score !== null && opp.trust_score !== undefined && (
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowTrustTooltip(true)}
                  onMouseLeave={() => setShowTrustTooltip(false)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    opp.trust_score >= 80
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                      : opp.trust_score >= 50
                      ? "bg-amber-950/80 text-amber-300 border-amber-700"
                      : "bg-rose-950/80 text-rose-300 border-rose-700"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Trust Score: {opp.trust_score}%
                </button>

                {showTrustTooltip && (
                  <div className="absolute right-0 top-9 w-64 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 shadow-2xl z-30">
                    <p className="font-bold text-white mb-1">
                      Algorithmic Trust Evaluation
                    </p>
                    <p className="leading-relaxed text-slate-400 text-[11px]">
                      This score evaluates organizer domain matching, automated DNS & registry verification, community feedback, and staff reviews to ensure posting integrity.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSave}
                className={`p-2.5 rounded-xl border transition ${
                  isSaved
                    ? "bg-brand-950 text-brand-300 border-brand-700"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                }`}
                title="Save opportunity"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white transition"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setReportModalOpen(true)}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-rose-400 hover:bg-rose-950/40 transition"
                title="Report posting"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Countdown Banner */}
        {countdown && (
          <div className="p-3.5 rounded-2xl bg-brand-950/40 border border-brand-900/60 flex items-center justify-between text-xs text-brand-200">
            <span className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-brand-400" />
              Application Countdown: <strong>{countdown}</strong>
            </span>

            {opp.application_url && (
              <a
                href={opp.application_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                Apply Now <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Main Body Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Requirements */}
        <div className="lg:col-span-2 space-y-8">
          {opp.summary && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Overview
              </h3>
              <p className="text-slate-300 leading-relaxed text-sm bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80">
                {opp.summary}
              </p>
            </div>
          )}

          {opp.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Detailed Description
              </h3>
              <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80">
                {opp.description}
              </div>
            </div>
          )}

          {opp.eligibility && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Eligibility
              </h3>
              <div className="text-slate-300 leading-relaxed text-sm bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80">
                {opp.eligibility}
              </div>
            </div>
          )}

          {opp.requirements && opp.requirements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Requirements & Prerequisites
              </h3>
              <ul className="space-y-2 bg-slate-900/30 p-5 rounded-2xl border border-slate-800/80">
                {opp.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Sidebar: Key Facts & Dates */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="font-bold text-white text-sm">Key Information</h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Opportunity Type</span>
                <span className="font-medium text-slate-200 uppercase">{opp.type}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Location Mode</span>
                <span className="font-medium text-slate-200 capitalize">
                  {opp.location_type} ({opp.location_text || opp.country_code || "Global"})
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Application Deadline</span>
                <span className="font-medium text-slate-200">
                  {opp.is_rolling
                    ? "Rolling Basis"
                    : opp.deadline_at
                    ? new Date(opp.deadline_at).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Open"}
                </span>
              </div>

              {opp.starts_at && (
                <div>
                  <span className="text-slate-500 block">Event / Term Dates</span>
                  <span className="font-medium text-slate-200">
                    {new Date(opp.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                    {opp.ends_at
                      ? new Date(opp.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "TBD"}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-500 block">Compensation / Award</span>
                <span className="font-medium text-emerald-400">
                  {opp.compensation_note || opp.compensation_type.toUpperCase()}
                </span>
              </div>
            </div>

            {opp.application_url && (
              <a
                href={opp.application_url}
                target="_blank"
                rel="noreferrer"
                className="w-full mt-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition"
              >
                Apply on Official Site
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Tags */}
          {opp.tags.length > 0 && (
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
              <h3 className="font-bold text-white text-sm">Tags & Topics</h3>
              <div className="flex flex-wrap gap-1.5">
                {opp.tags.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/opportunities?tag=${t.slug}`}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition"
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related items */}
      {related.length > 0 && (
        <div className="pt-10 border-t border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white">Similar Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((item) => (
              <OpportunityCard key={item.id} opportunity={item} />
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-400" />
                Report this posting
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select Reason
                </label>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {[
                    { id: "scam", label: "Scam or fraudulent fee requested" },
                    { id: "expired", label: "Expired or dead link" },
                    { id: "misleading", label: "Misleading compensation or criteria" },
                    { id: "duplicate", label: "Duplicate listing" },
                    { id: "inappropriate", label: "Inappropriate or abusive content" },
                    { id: "other", label: "Other issue" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={opt.id}
                        checked={reportReason === opt.id}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-brand-500 focus:ring-brand-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context to help moderators inspect this posting..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  {submittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
