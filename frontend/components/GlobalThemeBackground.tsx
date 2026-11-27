"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme-context";

/**
 * Global Theme Background Layer.
 * - In Dark Mode: Returns null (preserves existing deep-space baseline 100% untouched).
 * - In Light Mode: ONE continuous fixed full-viewport cosmic sky background
 *   with subtle Ken Burns motion, light scroll parallax, and soft readability wash
 *   so there are zero horizontal seams or patches between sections.
 */
export default function GlobalThemeBackground() {
  const { isLight, mounted } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted || !isLight) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(motionQuery.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [mounted, isLight]);

  useEffect(() => {
    if (!mounted || !isLight || reduceMotion) return;

    let rafId = 0;
    const updateParallax = () => {
      if (parallaxRef.current) {
        const offset = Math.min(window.scrollY * 0.04, 64);
        parallaxRef.current.style.transform = `translate3d(0, ${-offset}px, 0)`;
      }
      rafId = 0;
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateParallax);
      }
    };

    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [mounted, isLight, reduceMotion]);

  if (!mounted || !isLight) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden bg-[#EBF1FF]"
    >
      <div
        ref={parallaxRef}
        className="absolute -inset-x-0 -top-6 -bottom-20 will-change-transform"
      >
        <img
          src="/brand/bg-light-1.webp"
          alt=""
          loading="eager"
          decoding="async"
          className={`w-full h-full object-cover object-center ${
            !reduceMotion ? "lb-ken-burns-active" : ""
          }`}
        />
      </div>

      {/* Continuous sky-blue to soft-lavender atmospheric wash (no per-section seams) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(235, 243, 255, 0.20) 0%, rgba(242, 238, 255, 0.14) 50%, rgba(246, 245, 255, 0.28) 100%)",
        }}
      />
    </div>
  );
}
