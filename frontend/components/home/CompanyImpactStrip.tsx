"use client";

import React, { useEffect, useState, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Award, Users, Calendar, Code2, TrendingUp } from "lucide-react";
import { Reveal } from "./HomeMotion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function CountUp({ target }: { target: number }) {
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

    const duration = 1200;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(update);
      else setCurrent(target);
    };

    requestAnimationFrame(update);
  }, [isInView, target, shouldReduceMotion]);

  return (
    <span ref={ref} className="font-mono">
      {current.toLocaleString()}
    </span>
  );
}

interface RealMetric {
  id: string;
  label: string;
  count: number;
  description: string;
  icon: typeof Award;
}

export default function CompanyImpactStrip() {
  const [metrics, setMetrics] = useState<RealMetric[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchRealMetrics() {
      try {
        const res = await fetch(`${API_BASE}/metrics/public`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const list: RealMetric[] = [];
        if (typeof data.featured_hackathons === "number") {
          list.push({
            id: "featured_hackathons",
            label: "Featured Hackathons",
            count: data.featured_hackathons,
            description: "Verified upcoming hackathons currently live",
            icon: Calendar,
          });
        }
        if (typeof data.active_opportunities === "number") {
          list.push({
            id: "active_opportunities",
            label: "Active Opportunities",
            count: data.active_opportunities,
            description: "Published, non-expired listings",
            icon: Award,
          });
        }
        if (typeof data.core_team_members === "number") {
          list.push({
            id: "core_team_members",
            label: "Core Team Members",
            count: data.core_team_members,
            description: "Founding builders & community leads",
            icon: Users,
          });
        }
        if (typeof data.approved_projects === "number" && data.approved_projects > 0) {
          list.push({
            id: "approved_projects",
            label: "Approved Projects",
            count: data.approved_projects,
            description: "Student projects published on LaunchByte",
            icon: Code2,
          });
        }
        if (list.length > 0) setMetrics(list);
      } catch {
        // If backend unreachable, omit unverified numbers rather than showing fake stats
      }
    }
    fetchRealMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 sm:py-24 bg-[#050510] overflow-hidden">
      <div className="absolute inset-0 bg-space-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[300px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Platform Snapshot</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              Verified Platform Metrics
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1]">
              Real-time counts calculated directly from published LaunchByte records.
            </p>
          </div>
        </Reveal>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            metrics.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          } gap-6`}
        >
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <Reveal key={m.id} delay={0.08 * idx} className="flex">
                <div className="group relative w-full p-6 sm:p-7 rounded-3xl glass-card glow-hover flex flex-col justify-between space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-violet-950/70 border border-violet-500/30 flex items-center justify-center text-cyan-400 shadow-md">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      <CountUp target={m.count} />
                    </div>
                    <h3 className="text-sm font-bold text-[#A78BFA]">{m.label}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
