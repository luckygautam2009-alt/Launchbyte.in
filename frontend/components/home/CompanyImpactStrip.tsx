"use client";

import React, { useEffect, useState, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { SITE_CONTENT, ImpactMetric } from "@/lib/siteContent";
import { api } from "@/lib/api";
import { Sparkles, TrendingUp, Users, Calendar, Award } from "lucide-react";
import { Reveal } from "./HomeMotion";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCurrent(target);
      return;
    }
    if (!isInView) return;

    let start = 0;
    const duration = 1600; // ms
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.floor(eased * target);
      setCurrent(val);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setCurrent(target);
      }
    };

    requestAnimationFrame(update);
  }, [isInView, target, shouldReduceMotion]);

  return (
    <span ref={ref} className="font-mono">
      {current.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function CompanyImpactStrip() {
  const [metrics, setMetrics] = useState<ImpactMetric[]>(SITE_CONTENT.impactMetrics);

  useEffect(() => {
    // Attempt to load live count when possible, fallback gracefully to siteContent
    async function fetchCounts() {
      try {
        const opps = await api.listOpportunities({ limit: 1 });
        if (opps && typeof opps.total === "number" && opps.total > 0) {
          setMetrics((prev) =>
            prev.map((m) =>
              m.id === "opportunities"
                ? { ...m, count: opps.total, isPlaceholder: false }
                : m
            )
          );
        }
      } catch {
        // Keep placeholder defaults from lib/siteContent.ts
      }
    }
    fetchCounts();
  }, []);

  const icons = [Award, Users, Calendar, Sparkles];

  return (
    <section className="relative py-16 sm:py-24 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[300px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verified Ecosystem Scale</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              Impact by the Numbers
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1]">
              Real-time platform metrics representing builders, verified sponsors, and hackathon sprints.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <Reveal key={m.id} delay={0.08 * idx} className="flex">
                <div className="group relative w-full p-6 sm:p-7 rounded-3xl glass-card glow-hover flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-violet-950/70 border border-violet-500/30 flex items-center justify-center text-cyan-400 shadow-md">
                        <Icon className="w-5 h-5" />
                      </div>
                      {m.isPlaceholder && (
                        <span
                          title="Configurable in lib/siteContent.ts"
                          className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500"
                        >
                          TODO: Live API
                        </span>
                      )}
                    </div>

                    <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#F8FAFC] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent">
                      <CountUp target={m.count} suffix={m.suffix} />
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-violet-200 transition-colors">
                      {m.label}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 pt-2 border-t border-slate-800/80 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
