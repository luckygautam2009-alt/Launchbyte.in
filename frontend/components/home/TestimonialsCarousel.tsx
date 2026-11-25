"use client";

import React, { useState } from "react";
import { SITE_CONTENT, TestimonialSlot } from "@/lib/siteContent";
import { Quote, ChevronLeft, ChevronRight, Sparkles, UserCheck } from "lucide-react";
import { Reveal } from "./HomeMotion";

export default function TestimonialsCarousel() {
  const allSlots: TestimonialSlot[] = SITE_CONTENT.testimonials.slice(0, 5);
  const published = allSlots.filter((t) => t.isPublished && t.quote && t.name);
  const namedPending = allSlots.filter((t) => !t.isPublished && t.name);
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () => {
    setActiveIndex((curr) => (curr === 0 ? published.length - 1 : curr - 1));
  };

  const next = () => {
    setActiveIndex((curr) => (curr === published.length - 1 ? 0 : curr + 1));
  };

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      <div className="absolute inset-0 bg-space-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <Reveal>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Builder Voices</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
              Loved by Hackathon Builders & Fellows
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1] max-w-2xl mx-auto">
              Verified perspectives from builders, hackathon participants, and fellows across the community.
            </p>
          </div>
        </Reveal>

        {published.length > 0 ? (
          <Reveal delay={0.1}>
            <div className="relative p-8 sm:p-12 rounded-3xl glass-card glow-hover border border-violet-500/30 space-y-8">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-cyan-400 shadow-md">
                  <Quote className="w-6 h-6" />
                </div>
                {published[activeIndex].source && (
                  <span className="text-xs font-mono tracking-widest uppercase text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                    {published[activeIndex].source}
                  </span>
                )}
              </div>

              <p className="text-lg sm:text-2xl font-medium text-slate-100 leading-relaxed italic">
                &ldquo;{published[activeIndex].quote}&rdquo;
              </p>

              <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4F46E5] to-[#8B5CF6] flex items-center justify-center text-white font-bold font-mono text-sm shadow-md">
                    {published[activeIndex].name!
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {published[activeIndex].name}
                    </h4>
                    {published[activeIndex].role && (
                      <p className="text-xs text-slate-400">{published[activeIndex].role}</p>
                    )}
                  </div>
                </div>

                {published.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={prev}
                      aria-label="Previous testimonial"
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-violet-400 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-slate-400 px-2">
                      {activeIndex + 1} / {published.length}
                    </span>
                    <button
                      type="button"
                      onClick={next}
                      aria-label="Next testimonial"
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-violet-400 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        ) : (
          /* Clean editorial list of verified builder slots awaiting approved quotes — zero fabricated text */
          <Reveal delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {namedPending.map((slot) => (
                <div
                  key={slot.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs shrink-0">
                      {slot.name!
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{slot.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-cyan-400" />
                        <span>Verified Builder</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-slate-500 italic">
                    Testimonial quote pending verification.
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
