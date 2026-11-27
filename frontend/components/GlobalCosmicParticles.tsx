"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme-context";

interface StarSpec {
  x: number;
  y: number;
  r: number;
  layer: 1 | 2 | 3;
  baseAlpha: number;
  phase: number;
  speed: number;
  driftY: number;
  color: string;
}

/**
 * Single reusable global animated galaxy & star atmosphere.
 * Renders 3 subtle depth layers (Distant Stars, Mid-Depth Stars, Near Particles)
 * on one lightweight canvas with pointer-events: none behind page content.
 * Automatically pauses when tab is hidden and renders statically under prefers-reduced-motion.
 */
export default function GlobalCosmicParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isLight, mounted } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = motionQuery.matches;
    let isMobile = window.innerWidth < 768;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let scrollY = window.scrollY;
    let rafId = 0;
    let stars: StarSpec[] = [];

    const buildStars = () => {
      stars = [];
      const lowHardware = typeof navigator !== "undefined" && (navigator.hardwareConcurrency || 4) <= 4;
      const layer1Count = lowHardware ? 24 : (isMobile ? 28 : 60); // Distant stars
      const layer2Count = lowHardware ? 6 : (isMobile ? 8 : 22);  // Mid-depth stars
      const layer3Count = lowHardware ? 2 : (isMobile ? 3 : 8);   // Near subtle light points

      // In light mode, subtle cosmic glints (violet, cyan, lilac)
      // In dark mode, preserve exact existing star colors
      const distantColors = isLight
        ? ["#8B5CF6", "#A78BFA", "#6366F1"]
        : ["#FFFFFF", "#E2E8F0", "#DDD6FE"];
      const midColors = isLight
        ? ["#7C3AED", "#38BDF8", "#818CF8", "#A855F7"]
        : ["#DDD6FE", "#BAE6FD", "#A78BFA", "#FFFFFF"];
      const nearColors = isLight
        ? ["#7552D9", "#0284C7", "#9333EA"]
        : ["#8B5CF6", "#6366F1", "#22D3EE"];

      const addLayer = (
        count: number,
        layer: 1 | 2 | 3,
        rMin: number,
        rMax: number,
        aMin: number,
        aMax: number,
        palette: string[],
        drift: number
      ) => {
        for (let i = 0; i < count; i++) {
          const s1 = ((i * 9301 + 49297 + layer * 7919) % 233280) / 233280;
          const s2 = ((i * 49297 + 9301 + layer * 3571) % 233280) / 233280;
          const s3 = ((i * 12345 + 67891 + layer * 1049) % 233280) / 233280;
          stars.push({
            x: s1,
            y: s2,
            r: rMin + s3 * (rMax - rMin),
            layer,
            baseAlpha: (aMin + s3 * (aMax - aMin)) * (isLight ? 0.75 : 1),
            phase: s1 * Math.PI * 2,
            speed: 0.35 + s2 * 0.65,
            driftY: drift * (0.6 + s3 * 0.8),
            color: palette[i % palette.length],
          });
        }
      };

      addLayer(layer1Count, 1, 0.55, 1.05, 0.16, 0.42, distantColors, 0);
      addLayer(layer2Count, 2, 1.05, 1.65, 0.25, 0.55, midColors, 0.002);
      addLayer(layer3Count, 3, 1.6, 2.3, 0.18, 0.38, nearColors, 0.005);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = width < 768;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      if (reduceMotion) drawFrame(0);
    };

    const drawFrame = (timeSec: number) => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const px = s.x * width;
        const parallax = !reduceMotion && !isMobile ? (s.layer === 2 ? 0.035 : s.layer === 3 ? 0.065 : 0) : 0;
        const driftOffset = !reduceMotion ? timeSec * s.driftY * height : 0;
        const rawY = s.y * height - scrollY * parallax - driftOffset;
        const py = ((rawY % height) + height) % height;

        const twinkle = reduceMotion
          ? 1
          : 0.65 + 0.35 * Math.sin(timeSec * s.speed + s.phase);
        const alpha = s.baseAlpha * twinkle;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;

        if (s.layer === 3) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = s.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    let startMs = performance.now();
    const tick = (now: number) => {
      if (document.hidden || reduceMotion) return;
      const elapsedSec = (now - startMs) / 1000;
      drawFrame(elapsedSec);
      rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      scrollY = window.scrollY;
      if (reduceMotion) drawFrame(0);
    };

    const onVisibility = () => {
      cancelAnimationFrame(rafId);
      if (!document.hidden && !reduceMotion) {
        startMs = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    const onMotionChange = (e: MediaQueryListEvent) => {
      reduceMotion = e.matches;
      cancelAnimationFrame(rafId);
      drawFrame(0);
      if (!reduceMotion && !document.hidden) {
        startMs = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    resize();
    if (reduceMotion) {
      drawFrame(0);
    } else if (!document.hidden) {
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [isLight]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-[1] overflow-hidden"
    >
      {/* Subtle Static Violet/Indigo Nebula Ambient Wash - theme aware */}
      <div
        className={`absolute -top-40 -left-40 w-[680px] h-[680px] rounded-full blur-[160px] transition-colors duration-500 ${
          mounted && isLight ? "bg-violet-400/15" : "bg-violet-950/20"
        }`}
      />
      <div
        className={`absolute top-1/3 -right-40 w-[620px] h-[620px] rounded-full blur-[160px] transition-colors duration-500 ${
          mounted && isLight ? "bg-indigo-300/15" : "bg-indigo-950/20"
        }`}
      />
      <div
        className={`absolute -bottom-40 left-1/4 w-[650px] h-[500px] rounded-full blur-[170px] transition-colors duration-500 ${
          mounted && isLight ? "bg-cyan-300/12" : "bg-cyan-950/12"
        }`}
      />

      {/* 3-Layer Starfield Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
