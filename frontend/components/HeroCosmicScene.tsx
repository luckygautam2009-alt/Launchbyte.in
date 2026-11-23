"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Star {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  color: string;
}

interface DustParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export default function HeroCosmicScene() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Parallax state
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    const handleMouseMove = (e: MouseEvent) => {
      if (isTouchDevice || shouldReduceMotion) return;
      const { innerWidth, innerHeight } = window;
      mouseRef.current = {
        x: (e.clientX / innerWidth - 0.5) * 2,
        y: (e.clientY / innerHeight - 0.5) * 2,
      };
    };

    if (!isTouchDevice && !shouldReduceMotion) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });

      const animate = () => {
        // Smooth lerp: current + (target - current) * factor
        currentPosRef.current.x += (mouseRef.current.x - currentPosRef.current.x) * 0.04;
        currentPosRef.current.y += (mouseRef.current.y - currentPosRef.current.y) * 0.04;

        setParallaxOffset({
          x: currentPosRef.current.x,
          y: currentPosRef.current.y,
        });

        animFrameRef.current = requestAnimationFrame(animate);
      };
      animFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("resize", checkMobile);
      if (!isTouchDevice && !shouldReduceMotion) {
        window.removeEventListener("mousemove", handleMouseMove);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [shouldReduceMotion]);

  // Generate stars client-side only (avoid hydration mismatch)
  const stars: Star[] = useMemo(() => {
    if (!mounted) return [];
    const count = isMobile ? 32 : 72;
    const colors = ["#FFFFFF", "#DDD6FE", "#BAE6FD", "#C084FC", "#A78BFA"];
    const generated: Star[] = [];

    // Deterministic pseudo-random seed pattern
    for (let i = 0; i < count; i++) {
      const seed1 = ((i * 9301 + 49297) % 233280) / 233280;
      const seed2 = ((i * 49297 + 9301) % 233280) / 233280;
      const seed3 = ((i * 12345 + 67891) % 233280) / 233280;
      const seed4 = ((i * 54321 + 19876) % 233280) / 233280;

      generated.push({
        id: i,
        x: Math.round(seed1 * 96 + 2),
        y: Math.round(seed2 * 88 + 4),
        size: seed3 > 0.85 ? 2.8 : seed3 > 0.5 ? 2 : 1.2,
        duration: 2.2 + seed4 * 2.8,
        delay: seed1 * 3,
        color: colors[Math.floor(seed4 * colors.length)],
      });
    }
    return generated;
  }, [mounted, isMobile]);

  // Floating dust particles (Desktop only)
  const dustParticles: DustParticle[] = useMemo(() => {
    if (!mounted || isMobile) return [];
    return [
      { id: 1, x: 22, y: 78, size: 4, duration: 9, delay: 0, color: "#A855F7" },
      { id: 2, x: 45, y: 84, size: 3, duration: 11, delay: 2, color: "#22D3EE" },
      { id: 3, x: 68, y: 72, size: 4, duration: 10, delay: 1, color: "#8B5CF6" },
      { id: 4, x: 82, y: 86, size: 3, duration: 12, delay: 3, color: "#38BDF8" },
      { id: 5, x: 34, y: 88, size: 3.5, duration: 8.5, delay: 4, color: "#C084FC" },
    ];
  }, [mounted, isMobile]);

  if (!mounted) {
    return null;
  }

  // Parallax offsets
  const planetOffset = {
    x: parallaxOffset.x * 18,
    y: parallaxOffset.y * 18,
  };
  const starOffset = {
    x: parallaxOffset.x * 6,
    y: parallaxOffset.y * 6,
  };

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10"
      style={{
        maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
      }}
    >
      {/* 1. STAR PARTICLES LAYER */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(${starOffset.x}px, ${starOffset.y}px, 0)`,
        }}
      >
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
              animation: shouldReduceMotion
                ? "none"
                : `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              opacity: 0.65,
            }}
          />
        ))}

        {/* Floating dust motes (Desktop) */}
        {!isMobile &&
          dustParticles.map((dust) => (
            <motion.div
              key={dust.id}
              className="absolute rounded-full blur-[0.5px]"
              style={{
                left: `${dust.x}%`,
                top: `${dust.y}%`,
                width: `${dust.size}px`,
                height: `${dust.size}px`,
                backgroundColor: dust.color,
                boxShadow: `0 0 10px ${dust.color}`,
              }}
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      y: [0, -45, -90],
                      opacity: [0, 0.7, 0],
                      scale: [0.8, 1.2, 0.8],
                    }
              }
              transition={{
                duration: dust.duration,
                repeat: Infinity,
                delay: dust.delay,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Occasional Shooting Star (Desktop only) */}
        {!isMobile && !shouldReduceMotion && (
          <motion.div
            className="absolute w-36 h-[1.5px] bg-gradient-to-r from-transparent via-[#22D3EE] to-white rounded-full opacity-0"
            style={{
              top: "22%",
              left: "38%",
              transform: "rotate(-32deg)",
            }}
            animate={{
              x: [-120, 320],
              y: [-60, 200],
              opacity: [0, 0.9, 0],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              repeatDelay: 9,
              ease: "easeOut",
            }}
          />
        )}
      </motion.div>

      {/* 2. PLANETS LAYER (Positioned in the empty space below the CTA buttons) */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(${planetOffset.x}px, ${planetOffset.y}px, 0)`,
        }}
      >
        {/* Planet 1: Large Ringed Saturn-Style Planet (Right Side, below CTAs) */}
        <motion.div
          className="absolute right-[5%] sm:right-[9%] lg:right-[12%] top-[66%] sm:top-[62%] lg:top-[60%] w-[72px] sm:w-[105px] lg:w-[125px] h-[72px] sm:h-[105px] lg:h-[125px]"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  y: [-14, 14, -14],
                  rotate: [0, 3, 0],
                }
          }
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Planet Spherical Body */}
          <div
            className="relative w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 32%, #C084FC 0%, #8B5CF6 32%, #4F46E5 68%, #1E1B4B 100%)",
              boxShadow:
                "inset -14px -14px 28px rgba(15, 10, 35, 0.85), 0 0 45px rgba(139, 92, 246, 0.45)",
            }}
          >
            {/* Subtle atmospheric bands */}
            <div
              className="absolute inset-0 rounded-full opacity-40 mix-blend-overlay"
              style={{
                background:
                  "repeating-linear-gradient(175deg, transparent, transparent 7px, rgba(255,255,255,0.15) 7px, rgba(255,255,255,0.15) 12px)",
              }}
            />
          </div>

          {/* Saturn Ring System */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: "215%",
              height: "56%",
              transform: "translate(-50%, -50%) rotate(-26deg)",
            }}
          >
            <svg
              viewBox="0 0 240 70"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity="0" />
                  <stop offset="15%" stopColor="#C084FC" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#818CF8" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#22D3EE" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Rings */}
              <ellipse
                cx="120"
                cy="35"
                rx="110"
                ry="26"
                stroke="url(#ringGrad)"
                strokeWidth="7"
                strokeOpacity="0.8"
              />
              <ellipse
                cx="120"
                cy="35"
                rx="96"
                ry="21"
                stroke="url(#ringGrad)"
                strokeWidth="3"
                strokeOpacity="0.6"
              />
            </svg>
          </div>
        </motion.div>

        {/* Planet 2: Medium Cyan-Blue Planet (Left Side, below CTAs - Desktop only) */}
        {!isMobile && (
          <motion.div
            className="absolute left-[7%] lg:left-[11%] top-[62%] lg:top-[64%] w-[70px] lg:w-[82px] h-[70px] lg:h-[82px]"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [12, -12, 12],
                    rotate: [0, -4, 0],
                  }
            }
            transition={{
              duration: 9.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2,
            }}
          >
            <div
              className="relative w-full h-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 32% 28%, #67E8F9 0%, #22D3EE 30%, #3B82F6 65%, #0F172A 100%)",
                boxShadow:
                  "inset -10px -10px 20px rgba(10, 20, 45, 0.85), 0 0 35px rgba(34, 211, 238, 0.35)",
              }}
            >
              {/* Subtle surface crater / texture shadows */}
              <div
                className="absolute inset-0 rounded-full opacity-35"
                style={{
                  background:
                    "radial-gradient(circle at 62% 45%, rgba(15, 23, 42, 0.7) 0%, transparent 22%), radial-gradient(circle at 35% 72%, rgba(15, 23, 42, 0.6) 0%, transparent 20%)",
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Planet 3: Small Distant Pink/Violet Planet (Center-Bottom - Desktop only) */}
        {!isMobile && (
          <motion.div
            className="absolute left-[47%] lg:left-[49%] top-[78%] lg:top-[76%] w-[32px] h-[32px]"
            style={{
              filter: "blur(1.2px)",
            }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [-7, 7, -7],
                    scale: [0.98, 1.02, 0.98],
                  }
            }
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2.8,
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, #F472B6 0%, #EC4899 40%, #8B5CF6 75%, #311042 100%)",
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.45)",
              }}
            />
          </motion.div>
        )}

        {/* 3. ASTRONAUT (1 only, small - occupying empty space below CTAs - Desktop only) */}
        {!isMobile && (
          <motion.div
            className="absolute left-[26%] lg:left-[28%] top-[65%] lg:top-[66%] w-[72px] h-[72px] pointer-events-none"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, 50, 100, 50, 0],
                    y: [0, -22, -8, 18, 0],
                    rotate: [-6, 8, 14, 2, -6],
                  }
            }
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Minimal Modern Vector Flat Astronaut SVG */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[0_8px_16px_rgba(139,92,246,0.35)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Life Support Backpack */}
              <rect
                x="22"
                y="34"
                width="16"
                height="32"
                rx="6"
                fill="#334155"
                stroke="#64748B"
                strokeWidth="1.5"
              />

              {/* Legs */}
              <rect
                x="37"
                y="64"
                width="9"
                height="22"
                rx="4"
                fill="#E2E8F0"
                stroke="#94A3B8"
                strokeWidth="1.2"
                transform="rotate(6 37 64)"
              />
              <rect
                x="52"
                y="63"
                width="9"
                height="23"
                rx="4"
                fill="#F1F5F9"
                stroke="#94A3B8"
                strokeWidth="1.2"
                transform="rotate(-12 52 63)"
              />
              {/* Boots */}
              <rect x="36" y="82" width="12" height="7" rx="3" fill="#64748B" />
              <rect
                x="54"
                y="81"
                width="12"
                height="7"
                rx="3"
                fill="#64748B"
                transform="rotate(-10 54 81)"
              />

              {/* Torso Suit */}
              <rect
                x="34"
                y="36"
                width="30"
                height="32"
                rx="8"
                fill="#F8FAFC"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              {/* Chest control console */}
              <rect x="42" y="44" width="14" height="11" rx="2.5" fill="#1E293B" />
              <circle cx="46" cy="49" r="1.5" fill="#22D3EE" />
              <circle cx="51" cy="49" r="1.5" fill="#A855F7" />

              {/* Left Arm floating forward */}
              <path
                d="M34 42L25 50L22 47"
                stroke="#E2E8F0"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Right Arm raised in zero-g */}
              <path
                d="M64 42L76 34L79 38"
                stroke="#F1F5F9"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Helmet */}
              <circle
                cx="49"
                cy="25"
                r="16"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              {/* Visor with vibrant Cyan / Violet Reflection */}
              <ellipse
                cx="51"
                cy="25"
                rx="11"
                ry="9"
                fill="url(#visorGradient)"
                stroke="#0EA5E9"
                strokeWidth="0.8"
              />
              {/* Visor Glint Reflection */}
              <ellipse
                cx="48"
                cy="21"
                rx="4"
                ry="2.2"
                fill="#FFFFFF"
                fillOpacity="0.85"
                transform="rotate(-18 48 21)"
              />

              <defs>
                <linearGradient
                  id="visorGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="60%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Soft Bottom Transition Fade into "What is LaunchByte?" Section */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#050510] via-[#050510]/70 to-transparent pointer-events-none" />
    </div>
  );
}
