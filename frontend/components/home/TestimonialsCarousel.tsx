"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SITE_CONTENT, TestimonialSlot } from "@/lib/siteContent";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "./HomeMotion";

export default function TestimonialsCarousel() {
  // Configurable up to 5 slots; only slides with verified approved quotes are displayed
  const published: TestimonialSlot[] = SITE_CONTENT.testimonials
    .slice(0, 5)
    .filter((t) => t.isPublished && Boolean(t.quote?.trim()) && Boolean(t.name?.trim()));

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const total = published.length;

  const prev = useCallback(() => {
    if (total <= 1) return;
    setDirection(-1);
    setActiveIndex((curr) => (curr === 0 ? total - 1 : curr - 1));
  }, [total]);

  const next = useCallback(() => {
    if (total <= 1) return;
    setDirection(1);
    setActiveIndex((curr) => (curr === total - 1 ? 0 : curr + 1));
  }, [total]);

  // Do NOT display an empty carousel or fake placeholder quotes when no verified quotes exist
  if (total === 0) {
    return null;
  }

  const current = published[activeIndex];
  const initials = (current.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <section
      aria-label="Testimonials"
      className="relative py-20 sm:py-28 bg-transparent overflow-hidden"
    >
      {/* Subtle Purple Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[360px] bg-violet-600/12 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <Reveal>
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
              Loved by Hackathon Builders &amp; Fellows
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1] max-w-2xl mx-auto">
              Perspectives from builders, hackathon participants and fellows across the community.
            </p>
          </div>
        </Reveal>

        {/* ONE Large Interactive Editorial Carousel */}
        <div
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Builder testimonials"
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative rounded-3xl glass-card border border-violet-500/25 p-8 sm:p-12 lg:p-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <div className="flex flex-col justify-between min-h-[260px] sm:min-h-[300px] space-y-10">
            <div className="flex items-center justify-between">
              <Quote className="w-8 h-8 text-violet-400/70" aria-hidden="true" />
              {total > 1 && (
                <span className="text-xs font-mono text-slate-400 tracking-wider">
                  {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
              )}
            </div>

            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current.id}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * 24 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-8"
                >
                  <blockquote className="text-xl sm:text-2xl lg:text-3xl font-medium text-slate-100 leading-relaxed tracking-tight">
                    &ldquo;{current.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-4 pt-2">
                    {current.photo ? (
                      <img
                        src={current.photo}
                        alt={current.name || "Builder"}
                        className="w-12 h-12 rounded-2xl object-cover border border-violet-500/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4F46E5] to-[#8B5CF6] flex items-center justify-center text-white font-bold font-mono text-sm">
                        {initials}
                      </div>
                    )}
                    <div>
                      <div className="text-lg font-bold text-white">{current.name}</div>
                      {current.role && (
                        <div className="text-xs sm:text-sm text-slate-400">{current.role}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel Controls */}
            {total > 1 && (
              <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {published.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setDirection(idx > activeIndex ? 1 : -1);
                        setActiveIndex(idx);
                      }}
                      aria-label={`Show testimonial ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeIndex
                          ? "w-7 bg-gradient-to-r from-violet-400 to-cyan-400"
                          : "w-2 bg-slate-700 hover:bg-slate-500"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous testimonial"
                    className="p-3 rounded-xl bg-slate-900/90 border border-white/10 hover:border-violet-400/60 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next testimonial"
                    className="p-3 rounded-xl bg-slate-900/90 border border-white/10 hover:border-violet-400/60 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
