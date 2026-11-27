"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";

interface OrbitCategory {
  id: string;
  label: string;
  href: string;
  color: string;
  glowColor: string;
  sublabel: string;
}

const CATEGORIES: OrbitCategory[] = [
  {
    id: "hackathons",
    label: "HACKATHONS",
    href: "/events",
    color: "#22D3EE",
    glowColor: "rgba(34, 211, 238, 0.7)",
    sublabel: "24–48h builder sprints",
  },
  {
    id: "internships",
    label: "INTERNSHIPS",
    href: "/opportunities",
    color: "#818CF8",
    glowColor: "rgba(129, 140, 248, 0.7)",
    sublabel: "Industry engineering roles",
  },
  {
    id: "opportunities",
    label: "OPPORTUNITIES",
    href: "/opportunities",
    color: "#C084FC",
    glowColor: "rgba(192, 132, 252, 0.7)",
    sublabel: "Verified grants & programs",
  },
  {
    id: "fellowships",
    label: "FELLOWSHIPS",
    href: "/opportunities",
    color: "#A78BFA",
    glowColor: "rgba(167, 139, 250, 0.7)",
    sublabel: "Funded research cohorts",
  },
  {
    id: "workshops",
    label: "WORKSHOPS",
    href: "/events",
    color: "#60A5FA",
    glowColor: "rgba(96, 165, 250, 0.7)",
    sublabel: "Deep-dive technical sessions",
  },
  {
    id: "community",
    label: "COMMUNITY",
    href: "/network",
    color: "#34D399",
    glowColor: "rgba(52, 211, 153, 0.7)",
    sublabel: "Collegiate squads & networks",
  },
  {
    id: "events",
    label: "EVENTS",
    href: "/events",
    color: "#F472B6",
    glowColor: "rgba(244, 114, 182, 0.7)",
    sublabel: "Summits, meetups & demos",
  },
  {
    id: "projects",
    label: "PROJECTS",
    href: "/projects",
    color: "#38BDF8",
    glowColor: "rgba(56, 189, 248, 0.7)",
    sublabel: "Showcases & student launches",
  },
];

export default function CosmicExplorerSection() {
  const shouldReduceMotion = useReducedMotion();
  const { isLight, mounted } = useTheme();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [orbitalAngle, setOrbitalAngle] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Smooth orbital motion along the ring
  useEffect(() => {
    if (shouldReduceMotion) return;

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (time - lastTimeRef.current) / 1000;
        // Slow continuous orbital rotation (~75s full orbit, slows to ~300s when hovered)
        const speed = hoveredCategory ? 0.022 : 0.085;
        setOrbitalAngle((prev) => (prev + speed * delta) % (Math.PI * 2));
      }
      lastTimeRef.current = time;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [hoveredCategory, shouldReduceMotion]);

  // Subtle cursor parallax
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1
      setMouseOffset({ x: nx, y: ny });
    },
    [shouldReduceMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  // Ellipse parameters corresponding to the clean ringed planet artwork (1024x576 aspect)
  const cx = 49.3; // Center X %
  const cy = 56.4; // Center Y %
  const a = 43.5; // Semi-major axis (radius X %)
  const b = 14.8; // Semi-minor axis (radius Y %)
  const tilt = -10.2 * (Math.PI / 180); // -10.2 degrees tilt in radians

  // Planet occlusion sphere parameters
  const planetRx = 16.2;
  const planetRy = 28.5;

  return (
    <section
      id="explore"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full flex flex-col items-center justify-center overflow-hidden select-none transition-colors duration-300 ${
        mounted && isLight
          ? "explore scroll-mt-24 pt-24 pb-12 sm:pb-16 lg:pb-20 bg-transparent"
          : "py-12 sm:py-16 lg:py-20 bg-[#050510]"
      }`}
    >
      {/* Top Transition Blend with Preceding Section (Dark Mode only) */}
      {(!mounted || !isLight) && (
        <div className="absolute top-0 inset-x-0 h-24 sm:h-32 z-20 pointer-events-none bg-gradient-to-b from-[#050510] via-[#050510]/70 to-transparent" />
      )}

      {/* Atmospheric Nebula & Glow Ambient Layer (Dark Mode only; Light Mode uses unified background) */}
      {(!mounted || !isLight) && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-transform duration-700 ease-out"
          style={{
            transform: shouldReduceMotion
              ? "none"
              : `translate3d(${-mouseOffset.x * 8}px, ${-mouseOffset.y * 6}px, 0)`,
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[520px] rounded-full blur-[160px] opacity-75 bg-gradient-to-tr from-violet-900/20 via-indigo-900/20 to-cyan-900/15" />
        </div>
      )}

      {/* ================= SECTION TOP HEADING ================= */}
      <div className="relative z-30 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 mb-2 sm:-mb-4 lg:-mb-8">
        {/* Section Heading with Gradient Accent */}
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.16] transition-colors duration-300 ${mounted && isLight ? "text-[#17172B]" : "text-[#F8FAFC]"
            }`}
        >
          What Will You{" "}
          <span
            className={`text-transparent bg-clip-text ${mounted && isLight
              ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600"
              : "bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300"
              }`}
          >
            Discover
          </span>{" "}
          on LaunchByte?
        </h2>

        {/* Subtitle Description */}
        <p
          className={`text-sm sm:text-base leading-relaxed font-normal max-w-xl mx-auto transition-colors duration-300 ${mounted && isLight ? "text-[#4B5565]" : "text-[#B8BAD0]"
            }`}
        >
          A universe of opportunities waiting to be explored.
        </p>
      </div>

      {/* ================= FULL-BLEED CINEMATIC PLANETARY ORBIT SYSTEM ================= */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {/* 16:9 Seamless Full-Width Space Stage (No card, no border, no rounded box) */}
        <div
          className="relative w-full max-w-[1440px] aspect-[16/9] transition-transform duration-500 ease-out"
          style={{
            transform: shouldReduceMotion
              ? "none"
              : `translate3d(${mouseOffset.x * 10}px, ${mouseOffset.y * 6}px, 0)`,
          }}
        >
          {/* 1. Base Realistic Ringed Planet Artwork */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
            style={
              mounted && isLight
                ? {
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
                }
                : {
                  maskImage:
                    "radial-gradient(ellipse 78% 76% at 50% 54%, black 42%, rgba(0,0,0,0.7) 68%, transparent 95%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 78% 76% at 50% 54%, black 42%, rgba(0,0,0,0.7) 68%, transparent 95%)",
                }
            }
          >
            {mounted && isLight ? (
              <img
                src="/explore-bg.webp"
                alt="LaunchByte Interactive Ringed Planet"
                className="explore-bg w-full h-full object-cover select-none"
              />
            ) : (
              <>
                <picture>
                  <source
                    srcSet="/brand/ringed-planet-clean.webp"
                    type="image/webp"
                  />
                  <img
                    src="/brand/ringed-planet-clean.jpg"
                    alt="LaunchByte Cinematic Ringed Planet"
                    className="w-full h-full object-cover select-none filter contrast-[1.04] brightness-[0.98]"
                  />
                </picture>

                {/* 4-Sided Edge Gradient Masks for Seamless Blending (Dark Mode preserved) */}
                <div className="absolute inset-x-0 top-0 h-[24%] bg-gradient-to-b from-[#050510] via-[#050510]/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-[#050510] via-[#050510]/60 to-transparent" />
                <div className="absolute inset-y-0 left-0 w-[18%] bg-gradient-to-r from-[#050510] via-[#050510]/60 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-[18%] bg-gradient-to-l from-[#050510] via-[#050510]/60 to-transparent" />

                {/* Subtle Atmospheric Light Sheen Layer */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-violet-600/12 via-transparent to-cyan-400/10 pointer-events-none transition-opacity duration-500"
                  style={{
                    opacity: hoveredCategory ? 0.85 : 0.55,
                  }}
                />
              </>
            )}
          </div>

          {/* 2. Dynamic Interactive Category Labels Traveling along the Orbital Ring (Tablet/Desktop md+) */}
          <div className="hidden md:block absolute inset-0 w-full h-full pointer-events-none">
            {CATEGORIES.map((cat, index) => {
              // Calculate parametric orbital angle evenly distributed along 360°
              const baseAngle = (index / CATEGORIES.length) * Math.PI * 2;
              const t = (baseAngle + orbitalAngle) % (Math.PI * 2);

              const cosT = Math.cos(t);
              const sinT = Math.sin(t);

              const xPrime = a * cosT;
              const yPrime = b * sinT;

              // Apply -10.2° tilt rotation matrix
              const px =
                cx + (xPrime * Math.cos(tilt) - yPrime * Math.sin(tilt));
              const py =
                cy + (xPrime * Math.sin(tilt) + yPrime * Math.cos(tilt));

              // Determine 3D Depth & Occlusion
              const isBehind = sinT < -0.05;

              // Distance from planet center normalized to planet ellipsoid radii
              const dxNorm = (px - cx) / planetRx;
              const dyNorm = (py - cy) / planetRy;
              const distFromPlanetCenter = Math.sqrt(
                dxNorm * dxNorm + dyNorm * dyNorm
              );

              // Occlusion behind planet sphere body (exact same 3D orbital behavior in Light & Dark Mode)
              const isOccludedByPlanet =
                isBehind && distFromPlanetCenter < 0.98;

              // Opacity, Scale & Z-Index based on orbital depth
              let opacity = 1;
              let scale = 1;
              let zIndex = 30;

              if (isOccludedByPlanet) {
                opacity = 0;
                scale = 0.75;
                zIndex = 5;
              } else if (isBehind) {
                opacity = 0.65;
                scale = 0.88;
                zIndex = 10;
              } else {
                opacity = 1;
                scale = 1.0;
                zIndex = 35;
              }

              const isHovered = hoveredCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  style={{
                    left: `${px}%`,
                    top: `${py}%`,
                    opacity,
                    transform: `translate(-50%, -50%) scale(${isHovered ? scale * 1.15 : scale
                      })`,
                    zIndex: isHovered ? 50 : zIndex,
                    transition:
                      "opacity 0.4s ease, transform 0.25s ease-out, filter 0.3s ease",
                  }}
                  className={`absolute pointer-events-auto transition-all ${isOccludedByPlanet ? "pointer-events-none" : ""
                    }`}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    href={cat.href}
                    className="group flex flex-col items-center justify-center p-1.5 focus:outline-none"
                    aria-label={`Explore ${cat.label} on LaunchByte`}
                  >
                    {/* Satellite Orbital Beacon + Label Row (White glass pill with dark navy text in light mode) */}
                    <div
                      className={`flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full backdrop-blur-md transition-all duration-300 ${mounted && isLight
                        ? "bg-white/90 border border-violet-300/80 group-hover:scale-105 group-hover:border-violet-500 group-hover:bg-white shadow-md shadow-violet-500/10 group-hover:shadow-[0_0_20px_rgba(117,82,217,0.32)]"
                        : "bg-black/50 border border-white/10 group-hover:border-cyan-400/60 group-hover:bg-violet-950/70 shadow-lg shadow-black/40"
                        }`}
                    >
                      {/* Pulsing Satellite Beacon Dot */}
                      <span
                        className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 items-center justify-center"
                        style={{ color: cat.color }}
                      >
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span
                          className="relative inline-flex rounded-full h-1 w-1 sm:h-1.5 sm:w-1.5"
                          style={{
                            backgroundColor: cat.color,
                            boxShadow: `0 0 8px ${cat.color}`,
                          }}
                        />
                      </span>

                      {/* Upright Letter-Spaced Category Typography */}
                      <span
                        className={`font-mono text-[9px] sm:text-xs lg:text-[13px] font-bold tracking-widest transition-colors duration-200 select-none whitespace-nowrap ${mounted && isLight
                          ? "text-[#17172B] group-hover:text-violet-700"
                          : "text-slate-100 group-hover:text-white"
                          }`}
                        style={{
                          textShadow:
                            mounted && isLight
                              ? isHovered
                                ? "0 0 10px rgba(117, 82, 217, 0.4)"
                                : "none"
                              : isHovered
                                ? `0 0 14px ${cat.color}, 0 0 24px rgba(139, 92, 246, 0.8)`
                                : "0 0 8px rgba(139, 92, 246, 0.5)",
                        }}
                      >
                        {cat.label}
                      </span>
                    </div>

                    {/* Interactive Hover Tooltip Subtitle */}
                    {isHovered && (
                      <span
                        className={`mt-1 text-[10px] font-mono tracking-wider whitespace-nowrap backdrop-blur-md px-2 py-0.5 rounded border shadow-md animate-in fade-in zoom-in-95 duration-200 ${mounted && isLight
                          ? "bg-white/95 text-slate-800 border-violet-300/80 shadow-violet-500/10"
                          : "bg-black/80 text-cyan-300/90 border-cyan-500/30"
                          }`}
                      >
                        {cat.sublabel} →
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Mobile Tap-Friendly Orbital Category Pills (< 768px) */}
      <div className="md:hidden relative z-30 w-full max-w-lg mx-auto px-4 mt-4 grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            aria-label={`Explore ${cat.label} on LaunchByte`}
            className={`min-h-[44px] flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${mounted && isLight
              ? "bg-white/90 border-violet-200 text-slate-800 shadow-sm"
              : "bg-[#09091B]/80 border-white/10 active:border-cyan-400/60 hover:border-cyan-400/50"
              }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}` }}
            />
            <span
              className={`font-mono text-[11px] font-semibold tracking-wider truncate ${mounted && isLight ? "text-slate-800" : "text-slate-100"
                }`}
            >
              {cat.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Bottom Gradient Blend into Next Section */}
      {(!mounted || !isLight) && (
        <div className="absolute bottom-0 inset-x-0 h-20 sm:h-28 z-20 pointer-events-none bg-gradient-to-t from-[#050510] via-[#050510]/70 to-transparent" />
      )}
    </section>
  );
}
