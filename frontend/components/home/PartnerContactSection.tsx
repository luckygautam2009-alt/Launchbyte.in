"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle2, Building, Sparkles } from "lucide-react";
import { Reveal, MagneticButton } from "./HomeMotion";

export default function PartnerContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    partnershipType: "sponsor",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side simulation (no backend wiring required)
    setSubmitted(true);
  };

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-violet-600/10 via-cyan-500/10 to-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <Reveal>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Partner Ecosystem</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
              Partner with LaunchByte
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1] max-w-2xl mx-auto">
              Sponsor hackathon prize tracks, distribute developer grants, or integrate your devtools with over 10,000 top student builders.
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
                <h3 className="text-2xl font-bold text-white">
                  Partnership Inquiry Received
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. Our partnerships team will review your details and connect within 1–2 business days.
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Vance"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@organization.org"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                      Organization / University
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="e.g. Solstice Labs or MIT Chapter"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                      Partnership Category
                    </label>
                    <select
                      value={formData.partnershipType}
                      onChange={(e) => setFormData({ ...formData, partnershipType: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition cursor-pointer"
                    >
                      <option value="sponsor">Sponsor a Hackathon Track</option>
                      <option value="fellowship">Fund a Fellowship / Grant</option>
                      <option value="campus">Campus Club Partnership</option>
                      <option value="devtool">Devtool / API Integration</option>
                      <option value="other">General Partnership Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                    Collaboration Vision / Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what you'd like to achieve together..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:border-violet-500 outline-none transition"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    Direct organizer response within 48h
                  </span>
                  <MagneticButton strength={0.25}>
                    <button
                      type="submit"
                      className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] text-white text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                    >
                      <span>Submit Partnership Inquiry</span>
                      <Send className="w-4 h-4" />
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
