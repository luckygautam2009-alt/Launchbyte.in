"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Loader2, ArrowLeft, ArrowRight, Upload, Check } from "lucide-react";

type Step = 1 | 2;

const TIMEZONES = [
  "Asia/Kolkata", "UTC", "America/New_York", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Asia/Singapore", "Asia/Tokyo",
  "Australia/Sydney", "America/Chicago",
];

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors";
const textareaCls = `${inputCls} resize-none`;

export default function NewEventPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Step 1 fields
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [mode, setMode] = useState<"online" | "onsite" | "hybrid">("online");
  const [venueText, setVenueText] = useState("");
  const [venueMapUrl, setVenueMapUrl] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [regOpensAt, setRegOpensAt] = useState("");
  const [regClosesAt, setRegClosesAt] = useState("");

  // Step 2 fields
  const [capacity, setCapacity] = useState("");
  const [waitlistEnabled, setWaitlistEnabled] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [description, setDescription] = useState("");
  const [themeAccent, setThemeAccent] = useState("#6366f1");
  const [publishNow, setPublishNow] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !["admin", "organizer"].includes(user.role))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleImageUpload = async (file: File, type: "banner" | "thumbnail") => {
    if (type === "banner") setUploadingBanner(true);
    else setUploadingThumb(true);
    try {
      const res = await api.uploadImage(file);
      if (type === "banner") setBannerUrl(res.url);
      else setThumbnailUrl(res.url);
    } catch (e: any) {
      showToast(e.message || "Upload failed", "error");
    } finally {
      if (type === "banner") setUploadingBanner(false);
      else setUploadingThumb(false);
    }
  };

  const validateStep1 = () => {
    if (!title.trim()) { showToast("Title is required", "error"); return false; }
    if (!startsAt) { showToast("Start date is required", "error"); return false; }
    if (!endsAt) { showToast("End date is required", "error"); return false; }
    if (new Date(endsAt) <= new Date(startsAt)) { showToast("End must be after start", "error"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep1()) { setStep(1); return; }
    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        tagline: tagline.trim() || undefined,
        banner_url: bannerUrl || undefined,
        thumbnail_url: thumbnailUrl || undefined,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        timezone,
        mode,
        venue_text: venueText.trim() || undefined,
        venue_map_url: venueMapUrl.trim() || undefined,
        online_url: onlineUrl.trim() || undefined,
        registration_opens_at: regOpensAt ? new Date(regOpensAt).toISOString() : undefined,
        registration_closes_at: regClosesAt ? new Date(regClosesAt).toISOString() : undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        waitlist_enabled: waitlistEnabled,
        requires_approval: requiresApproval,
        description: description.trim() || undefined,
        theme_accent: themeAccent,
      };

      const ev = await api.createAdminEvent(payload);

      if (publishNow) {
        try {
          await api.publishEvent(ev.id);
          showToast("Event created and published!", "success");
        } catch {
          showToast("Event created but publish failed — publish from the event page", "error");
        }
      } else {
        showToast("Event created as draft", "success");
      }

      router.push(`/admin/events/${ev.id}`);
    } catch (e: any) {
      showToast(e.message || "Failed to create event", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <button onClick={() => router.push("/admin/events")} className="text-xs text-slate-500 hover:text-slate-300 mb-2 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Admin Events
          </button>
          <h1 className="text-3xl font-bold text-white">New Event</h1>
          <p className="text-slate-400 mt-1 text-sm">Host an event in under 3 minutes.</p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <button
                onClick={() => s === 1 || validateStep1() ? setStep(s as Step) : null}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${step === s ? "bg-indigo-600 text-white" : step > s ? "bg-indigo-900 text-indigo-400" : "bg-slate-800 text-slate-500"}`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </button>
              {s < 2 && <div className={`flex-1 h-px transition-colors ${step > s ? "bg-indigo-600" : "bg-slate-800"}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 -mt-6 mb-8">
          <span>Basics</span>
          <span>Details & Publish</span>
        </div>

        {step === 1 && (
          <div className="space-y-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <InputField label="Event Title" required>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                placeholder="HackQuantum 2026" className={inputCls} />
            </InputField>

            <InputField label="Tagline">
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={160}
                placeholder="Build the future, one hack at a time." className={inputCls} />
            </InputField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Banner Image">
                <div className="relative">
                  <input
                    type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "banner")}
                    className="hidden" id="banner-upload"
                  />
                  <label htmlFor="banner-upload"
                    className="flex items-center gap-2 cursor-pointer w-full bg-slate-800 border border-slate-700 border-dashed rounded-xl px-3 py-6 justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors text-sm">
                    {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {bannerUrl ? "Replace" : "Upload Banner"}
                  </label>
                  {bannerUrl && <img src={bannerUrl} alt="Banner" className="mt-2 h-16 w-full object-cover rounded-lg" />}
                </div>
              </InputField>
              <InputField label="Thumbnail Image">
                <div className="relative">
                  <input
                    type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "thumbnail")}
                    className="hidden" id="thumb-upload"
                  />
                  <label htmlFor="thumb-upload"
                    className="flex items-center gap-2 cursor-pointer w-full bg-slate-800 border border-slate-700 border-dashed rounded-xl px-3 py-6 justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors text-sm">
                    {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {thumbnailUrl ? "Replace" : "Upload Thumbnail"}
                  </label>
                  {thumbnailUrl && <img src={thumbnailUrl} alt="Thumb" className="mt-2 h-16 w-full object-cover rounded-lg" />}
                </div>
              </InputField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Starts At" required>
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
              </InputField>
              <InputField label="Ends At" required>
                <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
              </InputField>
            </div>

            <InputField label="Timezone" required>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </InputField>

            <InputField label="Mode" required>
              <div className="flex gap-2">
                {(["online", "onsite", "hybrid"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${mode === m ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"}`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </InputField>

            {(mode === "onsite" || mode === "hybrid") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="Venue Text">
                  <input type="text" value={venueText} onChange={(e) => setVenueText(e.target.value)}
                    placeholder="BITS Pilani, Rajasthan" className={inputCls} />
                </InputField>
                <InputField label="Venue Map URL">
                  <input type="url" value={venueMapUrl} onChange={(e) => setVenueMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/..." className={inputCls} />
                </InputField>
              </div>
            )}

            {(mode === "online" || mode === "hybrid") && (
              <InputField label="Online Join URL">
                <input type="url" value={onlineUrl} onChange={(e) => setOnlineUrl(e.target.value)}
                  placeholder="https://meet.google.com/..." className={inputCls} />
              </InputField>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Registration Opens At">
                <input type="datetime-local" value={regOpensAt} onChange={(e) => setRegOpensAt(e.target.value)} className={inputCls} />
              </InputField>
              <InputField label="Registration Closes At">
                <input type="datetime-local" value={regClosesAt} onChange={(e) => setRegClosesAt(e.target.value)} className={inputCls} />
              </InputField>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => { if (validateStep1()) setStep(2); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Next: Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <InputField label="Description (HTML/Markdown supported)">
              <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell participants about your event..." className={textareaCls} />
            </InputField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Capacity (blank = unlimited)">
                <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)}
                  placeholder="500" className={inputCls} />
              </InputField>
              <InputField label="Theme Accent Color">
                <div className="flex gap-2">
                  <input type="color" value={themeAccent} onChange={(e) => setThemeAccent(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer" />
                  <input type="text" value={themeAccent} onChange={(e) => setThemeAccent(e.target.value)}
                    maxLength={7} className={`${inputCls} flex-1`} />
                </div>
              </InputField>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waitlistEnabled}
                  onChange={(e) => setWaitlistEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                />
                <span className="text-sm text-slate-300">Enable waitlist when full</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                />
                <span className="text-sm text-slate-300">Requires organizer approval</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                />
                <span className="text-sm text-slate-300">Publish immediately</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : publishNow ? <>Publish Event</> : <>Save as Draft</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
