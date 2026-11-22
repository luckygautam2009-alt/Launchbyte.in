"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { OpportunityDetail, OpportunityStatus, OpportunityType, LocationType } from "@/lib/types";
import {
  Plus,
  Send,
  Trash2,
  ExternalLink,
  Calendar,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  ArrowRight,
} from "lucide-react";

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState<OpportunityDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Form State
  const [orgId, setOrgId] = useState("");
  const [title, setTitle] = useState("");
  const [oppType, setOppType] = useState<OpportunityType>("hackathon");
  const [locationType, setLocationType] = useState<LocationType>("remote");
  const [locationText, setLocationText] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await api.listOrganizerOpportunities(50, 0);
      setOpportunities(res.items);
      if (res.items.length > 0 && !orgId) {
        setOrgId(res.items[0].organization.id);
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to load organizer opportunities.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "user") {
        showToast("Organizer access required", "warning");
      } else {
        fetchOpportunities();
      }
    }
  }, [user, authLoading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await api.uploadImage(file);
      setUploadedImageUrl(res.url);
      showToast("Banner uploaded successfully!", "success");
    } catch (err: any) {
      showToast(err?.message || "Image upload failed. Ensure image is < 5MB PNG/JPEG/WEBP.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId.trim()) {
      showToast("Please provide your Organization UUID", "error");
      return;
    }
    if (!title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const payload: any = {
        title,
        type: oppType,
        location_type: locationType,
        location_text: locationText.trim() || undefined,
        country_code: countryCode.trim().toUpperCase() || undefined,
        summary: summary.trim() || undefined,
        description: description.trim() || undefined,
        application_url: applicationUrl.trim() || undefined,
        deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : undefined,
        starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
        ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
        tags,
      };

      await api.createOrganizerOpportunity(orgId.trim(), payload);
      showToast("Draft created successfully!", "success");
      setShowModal(false);
      resetForm();
      fetchOpportunities();
    } catch (err: any) {
      showToast(err?.message || "Failed to create draft opportunity.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async (opp: OpportunityDetail) => {
    if (!confirm(`Are you ready to submit "${opp.title}" for review?`)) return;
    setActionId(opp.id);
    try {
      await api.submitOrganizerOpportunity(opp.id);
      showToast("Submitted for review! Our moderators will verify it shortly.", "success");
      fetchOpportunities();
    } catch (err: any) {
      showToast(err?.message || "Failed to submit for review.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (opp: OpportunityDetail) => {
    if (!confirm(`Are you sure you want to delete "${opp.title}"?`)) return;
    setActionId(opp.id);
    try {
      await api.deleteOrganizerOpportunity(opp.id);
      showToast("Opportunity deleted.", "info");
      fetchOpportunities();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete opportunity.", "error");
    } finally {
      setActionId(null);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSummary("");
    setDescription("");
    setApplicationUrl("");
    setDeadlineAt("");
    setStartsAt("");
    setEndsAt("");
    setTagsInput("");
    setUploadedImageUrl(null);
  };

  const getStatusBadge = (status?: OpportunityStatus) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Published
          </span>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> In Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <FileText className="w-3.5 h-3.5" /> Draft
          </span>
        );
    }
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
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            Organizer Portal
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Manage Hosted Opportunities
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Draft, preview, publish, and track applications for your hackathons and programs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Opportunity
        </button>
      </div>

      {/* Postings List */}
      {opportunities.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8 max-w-xl mx-auto">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No opportunities hosted yet</h3>
          <p className="text-sm text-slate-400 mb-6">
            Get started by creating your first hackathon or fellowship listing. Once submitted, our team reviews and promotes it.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create First Draft
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(opp.status)}
                  <span className="text-xs uppercase font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {opp.type}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">
                    {opp.organization?.name || "Organization"}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight hover:text-indigo-400 transition">
                  <Link href={`/opportunities/${opp.slug}`}>{opp.title}</Link>
                </h2>

                <p className="text-sm text-slate-400 line-clamp-2">
                  {opp.summary || opp.description || "No description provided."}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Deadline: {opp.deadline_at ? new Date(opp.deadline_at).toLocaleDateString() : "Rolling"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    {opp.view_count || 0} views
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                {opp.status === "published" && (
                  <Link
                    href={`/opportunities/${opp.slug}`}
                    target="_blank"
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="View Live Listing"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}

                {opp.status === "draft" && (
                  <button
                    onClick={() => handleSubmitForReview(opp)}
                    disabled={actionId === opp.id}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
                  >
                    {actionId === opp.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Submit for Review
                  </button>
                )}

                <button
                  onClick={() => handleDelete(opp)}
                  disabled={actionId === opp.id}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                  title="Delete Opportunity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Create New Opportunity</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Organization ID (UUID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 00000000-0000-0000-0000-000000000001"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HackQuantum 2026: Global AI Hackathon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Type
                  </label>
                  <select
                    value={oppType}
                    onChange={(e) => setOppType(e.target.value as OpportunityType)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="internship">Internship</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="workshop">Workshop / Event</option>
                    <option value="competition">Competition</option>
                    <option value="grant">Grant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Location Format
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as LocationType)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="remote">Remote / Online</option>
                    <option value="onsite">On-Site / In-Person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Location City/Venue
                  </label>
                  <input
                    type="text"
                    placeholder="San Francisco, CA or Worldwide"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Country Code (2 letters)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="US"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Application Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={deadlineAt}
                    onChange={(e) => setDeadlineAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Event Starts At
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Event Ends At
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Application Link (must start with https://)
                </label>
                <input
                  type="url"
                  placeholder="https://hackquantum2026.dev/apply"
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Short Summary (1-2 sentences)
                </label>
                <input
                  type="text"
                  placeholder="Build quantum-resistant AI agents with $50,000 in bounties."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Details & Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed schedule, tracks, rules, eligibility, prizes, and discord links..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Banner Image (Max 5MB • PNG, JPEG, WEBP)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                  {uploadingImage && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                </div>
                {uploadedImageUrl && (
                  <p className="text-xs text-emerald-400 mt-1">Image uploaded: {uploadedImageUrl}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Tags (comma-separated, max 10)
                </label>
                <input
                  type="text"
                  placeholder="ai, python, web3, beginners, students"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Saving Draft..." : "Save Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
