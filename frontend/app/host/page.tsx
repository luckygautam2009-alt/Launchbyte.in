"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { triggerConfetti } from "@/components/ui/Confetti";
import TiltCard from "@/components/ui/TiltCard";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Upload,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Users,
  Eye,
  PenTool,
  Lock,
} from "lucide-react";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

const PRESET_BANNERS = [
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=400&fit=crop",
];

export default function HostEventPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Form State
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0]);
  const [description, setDescription] = useState(
    "### About the Event\nJoin developers and engineers for an intensive building sprint.\n\n### Tracks\n- Artificial Intelligence & Agents\n- Web3 & Distributed Systems\n- Open Innovation"
  );
  const [descTab, setDescTab] = useState<"write" | "preview">("write");

  // Dates
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  // Mode & Venues
  const [mode, setMode] = useState<"online" | "onsite" | "hybrid">("online");
  const [venueText, setVenueText] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");

  // Details
  const [capacity, setCapacity] = useState<number | "">("");
  const [tagsInput, setTagsInput] = useState("AI, Web, Hackathon");
  const [themeAccent, setThemeAccent] = useState("#8B5CF6");

  // Upload & Submit States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Modal
  const [createdEvent, setCreatedEvent] = useState<{
    id: string;
    slug: string;
    title: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop / File Upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid PNG, JPG, or WebP image.");
      return;
    }
    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        setBannerUrl(res.url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload image. Using fallback preset.");
    } finally {
      setUploadingImage(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Submit Handler
  const handleSubmit = async (publishNow: boolean) => {
    setErrorMsg(null);
    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg("Title must be at least 3 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg("Description must be at least 10 characters.");
      return;
    }
    if (!startsAt || !endsAt) {
      setErrorMsg("Please specify event start and end dates.");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setErrorMsg("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        tagline: tagline.trim() || undefined,
        banner_url: bannerUrl,
        thumbnail_url: bannerUrl,
        description: description.trim(),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        timezone: timezone || "UTC",
        mode: mode,
        venue_text: mode !== "online" ? venueText.trim() || undefined : undefined,
        online_url: mode !== "onsite" ? onlineUrl.trim() || undefined : undefined,
        capacity: capacity ? Number(capacity) : undefined,
        registration_closes_at: deadlineAt ? new Date(deadlineAt).toISOString() : undefined,
        theme_accent: themeAccent,
        sections: {
          tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        },
      };

      const created = await api.createAdminEvent(payload);

      if (publishNow && created.id) {
        try {
          await api.publishEvent(created.id);
        } catch {
          // Already published or organizer auto-published
        }
      }

      triggerConfetti();
      setCreatedEvent({
        id: created.id,
        slug: created.slug,
        title: created.title,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create event. Please verify all fields.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyShareLink = () => {
    if (!createdEvent) return;
    const url = `${window.location.origin}/events/${createdEvent.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Auth / Role Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400 mr-2" />
        <span>Loading host authorization...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl glass-card glow-hover border border-violet-500/30 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center mx-auto text-violet-300">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In to Host</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You must be logged in with an organizer or administrative account to create and publish events.
          </p>
          <div className="pt-2">
            <Link
              href="/login?redirect=/host"
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 hover:opacity-95 transition block"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "organizer") {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl glass-card glow-hover border border-amber-500/30 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Organizer Access Required</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your account ({user.email}) currently has student role permissions. Event hosting requires an approved organizer profile.
            </p>
          </div>
          <div className="pt-2 space-y-3">
            <Link
              href="/network"
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 hover:opacity-95 transition block"
            >
              Request Organizer Access
            </Link>
            <Link
              href="/events"
              className="text-xs text-slate-400 hover:text-white transition block"
            >
              Back to Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] text-[#CBD5E1] py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-space-grid opacity-15 pointer-events-none" />
      <div className="fixed top-1/4 right-1/4 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <SectionEyebrow stage="EVENT STUDIO" badge="ONE-CLICK CREATION TEMPLATE" accentColor="violet" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
            Host an Event on LaunchByte
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Configure your hackathon, sprint, or workshop in minutes. Your listing is broadcast to thousands of student builders with instant registration and live QR passes.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Split Layout: Form on Left, Sticky Live Preview on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 space-y-8 glass-card p-6 sm:p-8 rounded-3xl border border-violet-500/20">
            {/* Banner Cover Drag & Drop */}
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                Cover Banner Photo
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-slate-700 hover:border-violet-500/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-900/50 overflow-hidden group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                {uploadingImage ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2 text-violet-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-mono">Uploading banner...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-950/70 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-300 group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-200">
                        Drag & drop cover banner, or click to browse
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        1200x400 recommended • PNG, JPG, or WebP
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preset selector */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-mono text-slate-400">Presets:</span>
                {PRESET_BANNERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBannerUrl(preset)}
                    className={`h-7 w-14 rounded-lg overflow-hidden border transition ${
                      bannerUrl === preset ? "border-violet-400 ring-2 ring-violet-500/40" : "border-slate-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={preset} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  Event Title *
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {title.length}/200
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HackQuantum 2026: Global AI Sprint"
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm transition"
              />
            </div>

            {/* Short Tagline / 160 char counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  Short Tagline *
                </label>
                <span className={`text-[10px] font-mono ${tagline.length > 150 ? "text-amber-400" : "text-slate-500"}`}>
                  {tagline.length}/160
                </span>
              </div>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A high-intensity 48-hour build sprint for autonomous AI agents and quantum algorithms."
                maxLength={160}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm transition"
              />
            </div>

            {/* Description with Markdown / Preview Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  Full Description (Markdown) *
                </label>
                <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setDescTab("write")}
                    className={`px-2.5 py-1 rounded font-mono ${
                      descTab === "write" ? "bg-violet-600/30 text-violet-300 border border-violet-500/40" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescTab("preview")}
                    className={`px-2.5 py-1 rounded font-mono ${
                      descTab === "preview" ? "bg-violet-600/30 text-violet-300 border border-violet-500/40" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {descTab === "write" ? (
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide complete event schedule, prize tracks, eligibility requirements, and discord links..."
                  className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm font-mono transition leading-relaxed"
                />
              ) : (
                <div className="w-full p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 text-sm min-h-[160px] whitespace-pre-wrap leading-relaxed font-sans">
                  {description}
                </div>
              )}
            </div>

            {/* Dates & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Starts At *
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Ends At *
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Timezone *
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode & Venue */}
            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  Event Format / Mode *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "online", label: "Virtual / Online" },
                    { id: "onsite", label: "In-Person Venue" },
                    { id: "hybrid", label: "Hybrid" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id as any)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition border ${
                        mode === m.id
                          ? "bg-violet-600/30 border-violet-500 text-white shadow-md shadow-violet-500/20"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {mode !== "online" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Venue Address / Location *
                  </label>
                  <input
                    type="text"
                    value={venueText}
                    onChange={(e) => setVenueText(e.target.value)}
                    placeholder="e.g. Moscone Convention Center, San Francisco, CA"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              {mode !== "onsite" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Online Link / Stream URL
                  </label>
                  <input
                    type="url"
                    value={onlineUrl}
                    onChange={(e) => setOnlineUrl(e.target.value)}
                    placeholder="e.g. https://discord.gg/your-hackathon"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}
            </div>

            {/* Capacity, Registration Deadline & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Capacity (Max Attendees)
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Unlimited"
                  min={1}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Registration Closes
                </label>
                <input
                  type="datetime-local"
                  value={deadlineAt}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="AI, Web, Systems"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-violet-400 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold shadow-xl shadow-violet-600/30 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Event...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Publish in One Click</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Live Preview: 5 cols (Sticky) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Event Card Preview</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Updates in real-time</span>
            </div>

            <TiltCard maxTilt={4} className="w-full">
              <div className="rounded-3xl glass-card border border-violet-500/30 overflow-hidden shadow-2xl space-y-5">
                {/* Banner Preview */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={bannerUrl}
                    alt="Event banner"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09091B] via-transparent to-transparent" />

                  {/* Mode Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-violet-950/80 border border-violet-500/40 text-cyan-300 backdrop-blur-md">
                      {mode}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="px-6 pb-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white line-clamp-2">
                      {title.trim() || "Your Hackathon or Workshop Title"}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                      {tagline.trim() || "A high-intensity sprint assembling teams, building cutting-edge software, and claiming verified rewards."}
                    </p>
                  </div>

                  {/* Host Info */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800/80">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold font-mono">
                      {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 text-[10px] block">Hosted by</span>
                      <span className="text-slate-200 font-semibold">{user.full_name || user.email}</span>
                    </div>
                  </div>

                  {/* Meta Strip */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span className="truncate">
                        {startsAt ? new Date(startsAt).toLocaleDateString() : "Date TBA"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      {mode === "online" ? (
                        <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate">
                        {mode === "online" ? "Virtual" : venueText || "Venue TBA"}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {tagsInput
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    {capacity ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-950/60 border border-violet-500/30 text-violet-300 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{capacity} spots</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Dummy CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                    >
                      <span>Register for Event</span>
                      <span className="text-[10px] text-slate-400 font-mono">(Preview)</span>
                    </button>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {createdEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-lg w-full p-8 rounded-3xl glass-card glow-hover border border-emerald-500/40 space-y-6 text-center shadow-2xl shadow-emerald-950/50">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Event Published Successfully
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                {createdEvent.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Your event is live on the LaunchByte directory. Share the link with your community or open the event landing page.
              </p>
            </div>

            {/* Share Link Box */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="truncate pr-2">
                {typeof window !== "undefined" ? `${window.location.origin}/events/${createdEvent.slug}` : ""}
              </span>
              <button
                type="button"
                onClick={copyShareLink}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={`/events/${createdEvent.slug}`}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
              >
                <span>View Public Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setCreatedEvent(null)}
                className="w-full py-3 px-5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition"
              >
                Create Another Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
