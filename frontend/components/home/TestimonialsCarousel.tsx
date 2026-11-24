"use client";

import React, { useState } from "react";
import { SITE_CONTENT, TestimonialItem } from "@/lib/siteContent";
import { Quote, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";
import { Reveal } from "./HomeMotion";

export default function TestimonialsCarousel() {
  const testimonials: TestimonialItem[] = SITE_CONTENT.testimonials;
  const [activeIndex, setActiveIndex] = useState(0);

  if (!testimonials || testimonials.length === 0) {
    return (
      <section className="relative py-16 bg-[#050510] text-center border-t border-slate-800/40">
        <p className="text-xs font-mono text-slate-500">No builder testimonials available.</p>
      </section>
    );
  }

  const prev = () => {
    setActiveIndex((curr) => (curr === 0 ? testimonials.length - 1 : curr - 1));
  };

  const next = () => {
    setActiveIndex((curr) => (curr === testimonials.length - 1 ? 0 : curr + 1));
  };

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
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
              Loved by Hackathon Winners & Fellows
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1]">
              Hear from student engineers and campus organizers who scaled their technical trajectory on LaunchByte.
            </p>
          </div>
        </Reveal>

        {/* Carousel Card Container */}
        <Reveal delay={0.1}>
          <div className="relative p-8 sm:p-12 rounded-3xl glass-card glow-hover border border-violet-500/30 space-y-8">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-cyan-400 shadow-md">
                <Quote className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono tracking-widest uppercase text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                {testimonials[activeIndex].verifiedBadge || "Verified Builder"}
              </span>
            </div>

            <p className="text-lg sm:text-2xl font-medium text-slate-100 leading-relaxed italic">
              "{testimonials[activeIndex].quote}"
            </p>

            <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4F46E5] to-[#8B5CF6] flex items-center justify-center text-white font-bold font-mono text-sm shadow-md">
                  {testimonials[activeIndex].avatarText}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {testimonials[activeIndex].name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {testimonials[activeIndex].role} •{" "}
                    <span className="text-violet-300">
                      {testimonials[activeIndex].organization}
                    </span>
                  </p>
                </div>
              </div>

              {/* Navigation Controls */}
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
                  {activeIndex + 1} / {testimonials.length}
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
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
