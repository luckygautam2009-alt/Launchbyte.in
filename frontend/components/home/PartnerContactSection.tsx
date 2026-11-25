"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle2, Building, AlertCircle, Loader2 } from "lucide-react";
import { Reveal, MagneticButton } from "./HomeMotion";
import { LAUNCHBYTE_SOCIALS } from "@/lib/siteContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function PartnerContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    inquiry_type: "sponsor",
    message: "",
    website_honeypot: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.detail || "Failed to send inquiry.");
      }
      setServerMessage(data.message);
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        organization: "",
        inquiry_type: "sponsor",
        message: "",
        website_honeypot: "",
      });
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          `Unable to reach server. You can email us directly at ${LAUNCHBYTE_SOCIALS.email}.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-violet-600/10 via-cyan-500/10 to-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <Reveal>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Partner & Contact</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
              Partner with LaunchByte
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1] max-w-2xl mx-auto">
              Collaborate on student hackathons, developer workshops, or community initiatives. Inquiries are delivered directly to{" "}
              <a
                href={`mailto:${LAUNCHBYTE_SOCIALS.email}`}
                className="text-cyan-300 hover:underline font-mono text-xs sm:text-sm"
              >
                {LAUNCHBYTE_SOCIALS.email}
              </a>
              .
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="p-8 sm:p-12 rounded-3xl glass-card glow-hover border border-violet-500/30">
            {submitted ? (
              <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Inquiry Received</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {serverMessage ||
                    `Thank you for reaching out. Our team will review your message at ${LAUNCHBYTE_SOCIALS.email}.`}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900 border border-violet-500/30 text-xs font-mono text-violet-300 transition cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>{errorMsg}</p>
                      <a
                        href={`mailto:${LAUNCHBYTE_SOCIALS.email}`}
                        className="inline-flex items-center gap-1 text-cyan-300 hover:underline font-mono text-xs"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Email {LAUNCHBYTE_SOCIALS.email} directly</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Honeypot anti-spam */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.website_honeypot}
                  onChange={(e) => setFormData({ ...formData, website_honeypot: e.target.value })}
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@organization.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                      Organization / Community
                    </label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="University club or company"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                      Inquiry Type
                    </label>
                    <select
                      value={formData.inquiry_type}
                      onChange={(e) => setFormData({ ...formData, inquiry_type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition cursor-pointer"
                    >
                      <option value="sponsor">Sponsor / Prize Track</option>
                      <option value="community">Community Collaboration</option>
                      <option value="workshop">Technical Workshop / Talk</option>
                      <option value="general">General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Share details about your event, community collaboration, or inquiry..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sent to {LAUNCHBYTE_SOCIALS.email}</span>
                  </span>

                  <MagneticButton>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all cursor-pointer"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>{submitting ? "Sending..." : "Submit Inquiry"}</span>
                    </button>
                  </MagneticButton>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
