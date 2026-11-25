"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { OpportunityType, LocationType, CompensationType } from "@/lib/types";
import {
  Plus,
  Send,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  ArrowRight,
  ExternalLink,
  X,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ContributorOpportunitiesDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Complete Opportunity Listing Template Fields
  const [title, setTitle] = useState("");
  const [oppType, setOppType] = useState<OpportunityType>("hackathon");
  const [organizerName, setOrganizerName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [locationType, setLocationType] = useState<LocationType>("remote");
  const [locationText, setLocationText] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [registrationOpensAt, setRegistrationOpensAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [teamSize, setTeamSize] = useState("");
  const [compensationType, setCompensationType] = useState<CompensationType>("unpaid");
  const [compensationNote, setCompensationNote] = useState("");
  const [benefits, setBenefits] = useState("");
  const [tracks, setTracks] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  const [officialWebsite, setOfficialWebsite] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [organizerContactUrl, setOrganizerContactUrl] = useState("");

  const hasContributorAccess =
    user && ["contributor", "organizer", "moderator", "admin"].includes(user.role);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (hasContributorAccess) {
        fetchSubmissions();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const token = localStorage.getItem("lb_token");
      const res = await fetch(`${API_BASE}/contributor/opportunities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSubmissions(await res.json());
      }
    } catch {
      showToast("Failed to load your submissions.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      showToast("Only PNG, JPEG, or WebP images are allowed.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be 5 MB or less.", "error");
      return;
    }
    setUploadingImage(true);
    try {
      const token = localStorage.getItem("lb_token");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/uploads/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Upload failed");
      const origin = API_BASE.replace(/\/api\/v1\/?$/, "");
      setThumbnailUrl(data.url.startsWith("http") ? data.url : `${origin}${data.url}`);
      showToast("Thumbnail uploaded!", "success");
    } catch (err: any) {
      showToast(err?.message || "Image upload failed", "error");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveOrSubmit(submitForReview: boolean) {
    if (!title.trim() || !organizerName.trim() || !summary.trim() || !description.trim() || !applicationUrl.trim()) {
      showToast("Please fill all required fields (title, organizer, tagline, description, registration URL).", "error");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("lb_token");
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        type: oppType,
        organizer_name: organizerName.trim(),
        summary: summary.trim(),
        description: description.trim(),
        eligibility: eligibility.trim() || null,
        location_type: locationType,
        location_text: locationText.trim() || null,
        thumbnail_url: thumbnailUrl || null,
        registration_opens_at: registrationOpensAt ? new Date(registrationOpensAt).toISOString() : null,
        deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        team_size: teamSize.trim() || null,
        compensation_type: compensationType,
        compensation_note: compensationNote.trim() || null,
        benefits: benefits.trim() || null,
        tracks: tracks.trim() || null,
        requirements: skills.length > 0 ? skills : null,
        additional_instructions: additionalInstructions.trim() || null,
        official_website: officialWebsite.trim() || null,
        application_url: applicationUrl.trim(),
        source_url: sourceUrl.trim() || null,
        organizer_contact_url: organizerContactUrl.trim() || null,
        submit_for_review: submitForReview,
      };

      const res = await fetch(`${API_BASE}/contributor/opportunities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error?.message || "Failed to save opportunity.");

      showToast(
        submitForReview
          ? "Opportunity submitted for admin review!"
          : "Draft saved successfully.",
        "success"
      );
      setShowForm(false);
      setTitle("");
      setSummary("");
      setDescription("");
      setApplicationUrl("");
      fetchSubmissions();
    } catch (err: any) {
      showToast(err?.message || "Submission failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitDraft(id: string) {
    try {
      const token = localStorage.getItem("lb_token");
      const res = await fetch(`${API_BASE}/contributor/opportunities/${id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to submit draft");
      showToast("Submitted for admin review!", "success");
      fetchSubmissions();
    } catch (err: any) {
      showToast(err?.message || "Failed to submit", "error");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!hasContributorAccess) {
    return (
      <div className="min-h-screen bg-[#050510] text-slate-100 py-20 px-4">
        <div className="max-w-xl mx-auto p-8 rounded-3xl glass-card border border-violet-500/30 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Contributor Access Required</h1>
          <p className="text-sm text-slate-300">
            You need approved opportunity-contributor permissions to create and submit opportunities.
          </p>
          <Link
            href="/contributor/request-access"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white text-sm font-semibold"
          >
            <span>Request Listing Access</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] text-slate-100 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Contributor Opportunity Studio</h1>
            <p className="text-sm text-slate-400 mt-1">
              Draft, preview, and submit verified opportunities for admin review and publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white text-sm font-semibold shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? "Close Form" : "New Opportunity"}</span>
          </button>
        </div>

        {showForm && (
          <div className="p-6 sm:p-8 rounded-3xl glass-card border border-violet-500/30 space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-cyan-300 font-mono uppercase tracking-wider">
                1. Basic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Opportunity Title *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white sm:col-span-2"
                />
                <select
                  value={oppType}
                  onChange={(e) => setOppType(e.target.value as OpportunityType)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                >
                  <option value="hackathon">Hackathon</option>
                  <option value="internship">Internship</option>
                  <option value="fellowship">Fellowship</option>
                  <option value="scholarship">Scholarship</option>
                  <option value="grant">Grant</option>
                  <option value="competition">Competition</option>
                  <option value="program">Program</option>
                  <option value="event">Workshop / Event</option>
                </select>
                <input
                  type="text"
                  placeholder="Organizer / Company / Institution *"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Short Tagline * (max 500 chars)"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white sm:col-span-2"
                />
                <textarea
                  rows={4}
                  placeholder="Full Description *"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Eligibility (e.g. Undergraduate students)"
                  value={eligibility}
                  onChange={(e) => setEligibility(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as LocationType)}
                    className="px-3 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                  >
                    <option value="remote">Online</option>
                    <option value="onsite">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Location / Venue"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    className="px-3 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-cyan-300 font-mono uppercase tracking-wider">
                2. Media (Thumbnail / Cover Image)
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-950/60 border border-violet-500/30 text-xs font-semibold text-violet-200 cursor-pointer"
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Upload Cover Image (PNG/JPEG/WebP, max 5MB)</span>
                </button>
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-24 h-14 rounded-lg object-cover border border-violet-500/40"
                  />
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-cyan-300 font-mono uppercase tracking-wider">
                3. Dates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Registration Opens</label>
                  <input
                    type="datetime-local"
                    value={registrationOpensAt}
                    onChange={(e) => setRegistrationOpensAt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Application Deadline</label>
                  <input
                    type="datetime-local"
                    value={deadlineAt}
                    onChange={(e) => setDeadlineAt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Event Start Date</label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Event End Date</label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-cyan-300 font-mono uppercase tracking-wider">
                4. Details & Tracks
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Team Size (e.g. 2–4 members)"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Participation Fee / Prize Pool Note (e.g. Free Registration)"
                  value={compensationNote}
                  onChange={(e) => setCompensationNote(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Skills Required (comma separated, e.g. React, Python)"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white sm:col-span-2"
                />
                <textarea
                  rows={2}
                  placeholder="Tracks / Themes"
                  value={tracks}
                  onChange={(e) => setTracks(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
                <textarea
                  rows={2}
                  placeholder="Benefits / Perks"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
                <textarea
                  rows={2}
                  placeholder="Additional Instructions"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white sm:col-span-2"
                />
              </div>
            </div>

            {/* Links */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-cyan-300 font-mono uppercase tracking-wider">
                5. Verified Links
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="url"
                  placeholder="Registration URL *"
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
                <input
                  type="url"
                  placeholder="Official Website"
                  value={officialWebsite}
                  onChange={(e) => setOfficialWebsite(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
                <input
                  type="url"
                  placeholder="Source URL"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Organizer Contact URL or Email"
                  value={organizerContactUrl}
                  onChange={(e) => setOrganizerContactUrl(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSaveOrSubmit(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-950/80 border border-violet-500/40 text-xs font-semibold text-violet-200 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSaveOrSubmit(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-xs font-semibold text-white shadow-lg cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit for Review</span>
              </button>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-2xl w-full rounded-3xl glass-card border border-violet-500/40 p-6 sm:p-8 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-cyan-300">Opportunity Preview</span>
                <button type="button" onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {thumbnailUrl && (
                <img src={thumbnailUrl} alt="Preview" className="w-full h-44 object-cover rounded-2xl" />
              )}
              <h3 className="text-2xl font-bold text-white">{title || "Untitled Opportunity"}</h3>
              <p className="text-xs font-mono text-violet-300">
                {organizerName || "Organizer"} • {oppType.toUpperCase()} • {locationType.toUpperCase()}
              </p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{description || summary}</p>
            </div>
          </div>
        )}

        {/* My Submissions Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Your Submissions ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <div className="p-8 rounded-2xl glass-card border border-slate-800 text-center text-sm text-slate-400">
              You have not created any opportunity submissions yet.
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl glass-card border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white">{item.title}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-950/70 border border-violet-500/30 text-cyan-300">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {item.organizer_name_override || item.organization?.name} • {item.type}
                    </p>
                    {item.rejection_reason && (
                      <p className="text-xs text-red-400">Rejection reason: {item.rejection_reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {item.status === "draft" && (
                      <button
                        type="button"
                        onClick={() => handleSubmitDraft(item.id)}
                        className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-xs font-semibold text-violet-200 hover:bg-violet-600/40 transition cursor-pointer"
                      >
                        Submit for Review
                      </button>
                    )}
                    {item.application_url && (
                      <a
                        href={item.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-cyan-300 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Registration</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
