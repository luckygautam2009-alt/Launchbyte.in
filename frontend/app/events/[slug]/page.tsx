"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media";
import { EventDetail, CustomQuestion } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Countdown } from "@/components/ui/Countdown";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { triggerConfetti } from "@/components/ui/Confetti";
import {
  Calendar, MapPin, Users, Wifi, Clock, ChevronDown, ChevronUp,
  ExternalLink, Share2, Check, Trophy, Tag, HelpCircle, Star,
  CheckCircle2, AlertCircle, Loader2, ArrowLeft, QrCode
} from "lucide-react";

function sanitizeEventHtml(raw: string): string {
  if (!raw) return "";
  // Defense-in-depth client sanitization before rendering sanitized event HTML
  let clean = raw
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|form|meta|link|base)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|form|meta|link|base)\b[^>]*\/?\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*(?:javascript|vbscript|data):[^"']*\2/gi, '$1="#"');
  return clean;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left text-white hover:bg-slate-800/50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

function RegistrationModal({
  event, onClose, onSuccess
}: {
  event: EventDetail;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = (event.custom_questions || [])
      .filter((q) => q.required && !answers[q.key]?.trim())
      .map((q) => q.label);
    if (missing.length) {
      showToast(`Please answer: ${missing.join(", ")}`, "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.registerForEvent(event.id, answers);
      triggerConfetti();
      showToast("Successfully registered!", "success");
      onSuccess();
    } catch (err: any) {
      showToast(err.message || "Registration failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">Register for {event.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(event.custom_questions || []).map((q: CustomQuestion) => (
            <div key={q.key}>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {q.label} {q.required && <span className="text-red-400">*</span>}
              </label>
              {q.type === "select" ? (
                <select
                  value={answers[q.key] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  required={q.required}
                >
                  <option value="">Select...</option>
                  {q.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : q.type === "textarea" ? (
                <textarea
                  value={answers[q.key] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                  maxLength={q.max_length || 1000}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  required={q.required}
                />
              ) : (
                <input
                  type="text"
                  value={answers[q.key] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                  maxLength={q.max_length || 500}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  required={q.required}
                />
              )}
            </div>
          ))}
          {(!event.custom_questions || event.custom_questions.length === 0) && (
            <p className="text-slate-400 text-sm">No additional information required.</p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> : "Confirm Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const ev = await api.getEvent(slug);
      setEvent(ev);
    } catch (e: any) {
      setError(e.message || "Event not found");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCancel = async () => {
    if (!event?.user_registration) return;
    if (!confirm("Cancel your registration?")) return;
    setCancelling(true);
    try {
      await api.cancelEventRegistration(event.id);
      showToast("Registration cancelled", "success");
      fetchEvent();
    } catch (e: any) {
      showToast(e.message || "Failed to cancel", "error");
    } finally {
      setCancelling(false);
    }
  };

  const handleICS = () => {
    if (!event) return;
    const start = new Date(event.starts_at).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end = new Date(event.ends_at).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
      `DTSTART:${start}`, `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.tagline || ""}`,
      `LOCATION:${event.venue_text || (event.mode === "online" ? "Online" : "")}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.ics`;
    a.click();
  };

  const renderCTA = () => {
    if (!event) return null;
    const state = event.registration_state;
    const reg = event.user_registration;

    if (state === "ended" || (state === "event_full" && !event.waitlist_enabled))
      return <div className="text-center py-3 text-slate-500 text-sm">This event has ended or registration is closed.</div>;

    if (!user)
      return (
        <Link href="/login" className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors">
          Sign in to Register
        </Link>
      );

    if (!user.is_email_verified)
      return (
        <Link href="/verify-email" className="block w-full text-center py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold transition-colors">
          Verify Email to Register
        </Link>
      );

    if (reg?.status === "checked_in")
      return (
        <div className="text-center py-3">
          <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-green-400 font-semibold text-sm">You've been checked in!</p>
          <Link href={`/passes/${reg.id}`} className="text-indigo-400 hover:text-indigo-300 text-xs underline mt-1 block">View Pass</Link>
        </div>
      );

    if (reg?.status === "registered")
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium"><CheckCircle2 className="w-4 h-4" /> Registered!</div>
          <div className="flex gap-2">
            <Link href={`/passes/${reg.id}`} className="flex-1 text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4" /> My Pass
            </Link>
            <button onClick={handleCancel} disabled={cancelling} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel"}
            </button>
          </div>
        </div>
      );

    if (reg?.status === "waitlisted")
      return (
        <div className="space-y-2">
          <div className="text-amber-400 text-sm font-medium">Waitlisted — Position #{reg.waitlist_position}</div>
          <button onClick={handleCancel} disabled={cancelling} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors">
            Leave Waitlist
          </button>
        </div>
      );

    if (reg?.status === "pending_approval")
      return <div className="text-amber-400 text-sm font-medium text-center py-2">Pending organizer approval</div>;

    if (state === "open" || (state === "event_full" && event.waitlist_enabled))
      return (
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
        >
          {event.is_full ? "Join Waitlist" : event.requires_approval ? "Apply to Register" : "Register Now"}
        </button>
      );

    if (state === "closed")
      return <div className="text-center py-3 text-slate-500 text-sm">Registration is closed.</div>;

    return null;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-slate-400">{error || "Event not found"}</p>
      <Link href="/events" className="text-indigo-400 hover:text-indigo-300 underline text-sm">Browse events</Link>
    </div>
  );

  const sections = event.sections || {};
  const starts = new Date(event.starts_at);
  const ends = new Date(event.ends_at);
  const now = new Date();
  const isUpcoming = starts > now;
  const pct = event.capacity && event.capacity_remaining != null
    ? Math.round(((event.capacity - event.capacity_remaining) / event.capacity) * 100)
    : null;

  return (
    <main className="min-h-screen bg-slate-950">
      {showModal && (
        <RegistrationModal
          event={event}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchEvent(); }}
        />
      )}

      {/* Banner */}
      <div className="relative h-72 md:h-96 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {event.banner_url && (
          <Avatar
            src={event.banner_url}
            name={event.title}
            size="fill"
            shape="square"
            className="bg-transparent"
            fallback={<div />}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <Link href="/events" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Events
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${event.mode === "online" ? "text-blue-400 border-blue-400/30 bg-blue-400/10" : event.mode === "hybrid" ? "text-purple-400 border-purple-400/30 bg-purple-400/10" : "text-green-400 border-green-400/30 bg-green-400/10"}`}>
                {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}
              </span>
              {event.organization?.logo_url && (
                <Avatar src={event.organization.logo_url} name={event.organization.name} size="xs" shape="rounded" className="rounded" />
              )}
              <span className="text-slate-400 text-xs">{event.organization?.name}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{event.title}</h1>
            {event.tagline && <p className="text-slate-300 text-lg">{event.tagline}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Countdown */}
          {isUpcoming && (
            <div className="bg-gradient-to-r from-indigo-900/30 via-slate-900/50 to-purple-900/30 border border-indigo-500/20 rounded-2xl p-5 shadow-lg shadow-indigo-500/5">
              <Countdown targetDate={event.starts_at} label="EVENT STARTS IN" />
            </div>
          )}

          {/* About */}
          {event.description && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              <div
                className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeEventHtml(event.description) }}
              />
            </section>
          )}

          {/* Schedule */}
          {sections.schedule && sections.schedule.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-400" /> Schedule</h2>
              <div className="space-y-3">
                {sections.schedule.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <div className="text-indigo-400 text-sm font-mono font-medium w-20 flex-shrink-0">{item.time}</div>
                    <div>
                      <p className="font-medium text-white text-sm">{item.title}</p>
                      {item.description && <p className="text-slate-400 text-xs mt-0.5">{item.description}</p>}
                      {item.location && <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Prizes */}
          {sections.prizes && sections.prizes.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" /> Prizes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sections.prizes.map((prize: any, i: number) => (
                  <div key={i} className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className={`w-4 h-4 ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-400" : "text-amber-700"}`} />
                      <span className="font-semibold text-white text-sm">{prize.rank}</span>
                    </div>
                    <p className="text-indigo-400 font-bold text-lg">{prize.amount}</p>
                    {prize.description && <p className="text-slate-400 text-xs mt-1">{prize.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tracks */}
          {sections.tracks && sections.tracks.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-purple-400" /> Tracks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sections.tracks.map((track: any, i: number) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                    <p className="font-medium text-white text-sm">{track.name}</p>
                    {track.description && <p className="text-slate-400 text-xs mt-1">{track.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          {sections.faqs && sections.faqs.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-slate-400" /> FAQ</h2>
              <div className="space-y-2">
                {sections.faqs.map((faq: any, i: number) => (
                  <FaqItem key={i} q={faq.question} a={faq.answer} />
                ))}
              </div>
            </section>
          )}

          {/* Sponsors */}
          {sections.sponsors && sections.sponsors.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Sponsors</h2>
              <div className="flex flex-wrap gap-4">
                {sections.sponsors.map((sponsor: any, i: number) => (
                  <a key={i} href={sponsor.link || "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-600 transition-colors">
                    {sponsor.logo_url && (
                      <Avatar
                        src={resolveMediaUrl(sponsor.logo_url)}
                        name={sponsor.name}
                        size="sm"
                        shape="rounded"
                        className="h-6 w-6 bg-transparent"
                        imgClassName="object-contain"
                      />
                    )}
                    <span className="text-slate-300 text-sm font-medium">{sponsor.name}</span>
                    {sponsor.tier && <span className="text-xs text-slate-500">· {sponsor.tier}</span>}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar - sticky */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="space-y-3 mb-5 text-sm text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{starts.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                    <p className="text-slate-500">to {ends.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                  </div>
                </div>
                {event.mode !== "online" && event.venue_text && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{event.venue_text}</p>
                      {event.venue_map_url && (
                        <a href={event.venue_map_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 mt-0.5">
                          <ExternalLink className="w-3 h-3" /> View on Map
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {event.mode !== "onsite" && (
                  <div className="flex items-center gap-2.5">
                    <Wifi className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>{event.online_url ? <a href={event.online_url} className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">Join Link</a> : "Online event"}</span>
                  </div>
                )}
                {event.capacity != null && (
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>{event.capacity_remaining ?? "?"} / {event.capacity} spots</span>
                  </div>
                )}
              </div>

              {event.capacity != null && (
                <div className="mb-4">
                  <ProgressBar
                    value={event.capacity - (event.capacity_remaining ?? 0)}
                    max={event.capacity}
                    variant={pct !== null && pct > 85 ? "rose" : "brand"}
                    label="Registration Capacity"
                  />
                </div>
              )}

              {renderCTA()}
            </div>

            <div className="flex gap-2">
              <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 hover:border-slate-600 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
              <button onClick={handleICS} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 hover:border-slate-600 transition-colors">
                <Calendar className="w-4 h-4" /> Add to Cal
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
