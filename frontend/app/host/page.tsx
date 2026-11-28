"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Globe,
  Upload,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Mail,
  Send,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import { LAUNCHBYTE_SOCIALS } from "@/lib/siteContent";
import { resolveMediaUrl } from "@/lib/media";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function PublicHostEventPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [eventName, setEventName] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [organizerOrg, setOrganizerOrg] = useState("");
  const [category, setCategory] = useState("Hackathon");
  const [eventFormat, setEventFormat] = useState<"online" | "offline" | "hybrid">("online");
  const [venueLocation, setVenueLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [officialWebsite, setOfficialWebsite] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [expectedAudience, setExpectedAudience] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionAck, setSubmissionAck] = useState<{
    id: string;
    status: string;
    email_sent: boolean;
    admin_email_sent?: boolean;
    organizer_email_sent?: boolean;
    email_error?: string | null;
    message: string;
  } | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setUploadError("Only PNG, JPEG, or WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be 5 MB or less.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/public/uploads/event-banner`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error?.message || "Image upload failed.");
      }
      const backendOrigin = API_BASE.replace(/\/api\/v1\/?$/, "");
      const fullUrl = data.url.startsWith("http") ? data.url : `${backendOrigin}${data.url}`;
      setThumbnailUrl(fullUrl);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload event thumbnail.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (endDate && new Date(endDate) < new Date(eventDate)) {
      setSubmitError("End date cannot be earlier than event start date.");
      return;
    }
    if (registrationDeadline && new Date(registrationDeadline) > new Date(eventDate)) {
      setSubmitError("Registration deadline cannot be after the event start date.");
      return;
    }
    if ((eventFormat === "offline" || eventFormat === "hybrid") && !venueLocation.trim()) {
      setSubmitError("Venue / location is required for offline or hybrid events.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        event_name: eventName.trim(),
        organizer_name: organizerName.trim(),
        organizer_email: organizerEmail.trim(),
        organizer_organization: organizerOrg.trim(),
        description: description.trim(),
        category: category.trim(),
        event_format: eventFormat,
        venue_location: venueLocation.trim() || null,
        event_date: new Date(eventDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
        registration_url: registrationUrl.trim(),
        official_website: officialWebsite.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        expected_audience: expectedAudience.trim() || null,
        contact_info: contactInfo.trim(),
        additional_details: additionalDetails.trim() || null,
        website_honeypot: honeypot,
      };

      const res = await fetch(`${API_BASE}/public/host-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.detail || "Submission failed. Please check all fields.");
      }
      setSubmissionAck(data);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit event. Please verify your inputs and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-[#050510] text-[#17172B] dark:text-slate-100 py-14 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#7552D9] dark:text-[#A78BFA]">
            <Sparkles className="w-3.5 h-3.5 text-[#7552D9] dark:text-cyan-400" />
            <span>Public Event Submission</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#17172B] dark:text-white tracking-tight">
            Host an Event on LaunchByte
          </h1>
          <p className="text-sm sm:text-base text-[#424C63] dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Submit your hackathon, workshop, or developer meetup for consideration. Every public submission is reviewed by the LaunchByte team before publishing.
          </p>
        </div>

        {submissionAck ? (
          <div className="p-8 sm:p-12 rounded-3xl glass-card border border-emerald-500/30 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#17172B] dark:text-white">Event Submission Received</h2>
            <p className="text-sm text-[#2F3A52] dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              {submissionAck.message}
            </p>
            <div className="inline-block px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-cyan-700 dark:text-cyan-300">
              Submission ID: {submissionAck.id} • Status: {submissionAck.status.toUpperCase()}
            </div>
            {submissionAck.email_sent ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Notification delivered to <span className="text-cyan-700 dark:text-cyan-300 font-mono">{LAUNCHBYTE_SOCIALS.email}</span>
                {organizerEmail ? (
                  <>
                    {" "}and confirmation sent to <span className="text-cyan-700 dark:text-cyan-300 font-mono">{organizerEmail}</span>
                  </>
                ) : null}
                .
              </p>
            ) : (
              <div className="max-w-lg mx-auto p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-amber-700 dark:text-amber-200 text-xs space-y-1">
                <p className="font-semibold">
                  Submission saved, but email notification could not be fully delivered.
                </p>
                <p className="text-amber-300/90">
                  {submissionAck.admin_email_sent
                    ? `Admin alert was sent to ${LAUNCHBYTE_SOCIALS.email}, but the organizer confirmation email failed.`
                    : submissionAck.organizer_email_sent
                    ? `Organizer confirmation was sent, but the admin alert to ${LAUNCHBYTE_SOCIALS.email} failed.`
                    : `Email delivery is currently unavailable. You can also reach us directly at ${LAUNCHBYTE_SOCIALS.email}.`}
                </p>
              </div>
            )}
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setSubmissionAck(null);
                  setEventName("");
                  setDescription("");
                }}
                className="px-6 py-3 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-700 dark:text-violet-200 text-xs font-semibold hover:bg-violet-600/30 transition cursor-pointer"
              >
                Submit Another Event
              </button>
              <Link
                href="/opportunities"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] text-white text-xs font-semibold"
              >
                Explore Live Opportunities
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 rounded-3xl glass-card border border-violet-500/25 space-y-8">
            {submitError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-500/40 text-red-600 dark:text-red-200 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Honeypot anti-spam */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />

            {/* 1. Event Basics */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[#17172B] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                1. Event Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. National AI & Systems Hackathon 2027"
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Event Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none cursor-pointer"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Conference">Conference / Summit</option>
                    <option value="Meetup">Developer Meetup</option>
                    <option value="Competition">Coding Competition</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Event Format *
                  </label>
                  <select
                    value={eventFormat}
                    onChange={(e) => setEventFormat(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none cursor-pointer"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline (In-Person)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Venue / Location {eventFormat !== "online" && "*"}
                  </label>
                  <input
                    type="text"
                    required={eventFormat !== "online"}
                    value={venueLocation}
                    onChange={(e) => setVenueLocation(e.target.value)}
                    placeholder={
                      eventFormat === "online"
                        ? "Online (optional platform note)"
                        : "Campus / City / Venue address"
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Event Description * (min 20 chars)
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={20}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe themes, tracks, eligibility, format, and what attendees will build or learn..."
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none resize-y"
                  />
                </div>
              </div>
            </div>

            {/* 2. Dates & Links */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[#17172B] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                2. Schedule & Registration Links
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Event Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-xs outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Event End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-xs outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Registration Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Registration URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={registrationUrl}
                    onChange={(e) => setRegistrationUrl(e.target.value)}
                    placeholder="https://unstop.com/..."
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Official Event Website
                  </label>
                  <input
                    type="url"
                    value={officialWebsite}
                    onChange={(e) => setOfficialWebsite(e.target.value)}
                    placeholder="https://yourevent.org"
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Thumbnail / Banner Upload */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#17172B] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                3. Event Thumbnail / Banner (Optional)
              </h2>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-500/30 text-xs font-semibold text-violet-700 dark:text-violet-200 transition cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{uploading ? "Uploading..." : "Upload Banner (PNG/JPEG/WebP, max 5MB)"}</span>
                </button>

                {thumbnailUrl && (
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveMediaUrl(thumbnailUrl)}
                      alt="Event banner preview"
                      className="w-20 h-12 rounded-lg object-cover border border-violet-500/40"
                    />
                    <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">Uploaded</span>
                  </div>
                )}
              </div>
              {uploadError && <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
            </div>

            {/* 4. Organizer Details */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[#17172B] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                4. Organizer Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Organizer Name *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Organizer Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={organizerEmail}
                    onChange={(e) => setOrganizerEmail(e.target.value)}
                    placeholder="organizer@institution.edu"
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Organization / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={organizerOrg}
                    onChange={(e) => setOrganizerOrg(e.target.value)}
                    placeholder="University club, company, or community"
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Contact Information *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Email, phone, or official Discord/Telegram"
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Expected Audience (Optional)
                  </label>
                  <input
                    type="text"
                    value={expectedAudience}
                    onChange={(e) => setExpectedAudience(e.target.value)}
                    placeholder="e.g. College developers & AI builders"
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#2F3A52] dark:text-slate-300">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Any notes for the LaunchByte review team..."
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-[#17172B] dark:text-white text-sm outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#424C63] dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
                <span>Submissions are reviewed by LaunchByte moderators before going live.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{submitting ? "Submitting..." : "Submit Event for Review"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
