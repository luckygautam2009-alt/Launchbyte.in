"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

// Four-point cross star SVG matching the primary reference
function CrossStar({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M12 0L13.8 8.8L22 10.2L14.8 13.8L16.2 22L12 15.6L7.8 22L9.2 13.8L2 10.2L10.2 8.8L12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function HeroSection() {
  const { user, loading } = useAuth();
  const { isLight, mounted } = useTheme();

  return (
    <section
      className={`relative w-full min-h-[calc(100vh-4rem)] min-h-[640px] lg:min-h-[90vh] overflow-hidden flex flex-col justify-between select-none transition-colors duration-300 ${mounted && isLight
        ? "hero bg-transparent"
        : "bg-[#050510] bg-space-grid"
        }`}
    >
      {/* Ambient background glows (Dark Mode only; Light Mode stays clean for full-bleed hero-bg) */}
      {(!mounted || !isLight) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#09091B]/80 to-[#050510] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none bg-violet-900/10 blur-[140px]" />

          {/* Subtle architectural grid lines passing through the scene (Dark Mode only) */}
          <div className="absolute top-[28%] inset-x-0 h-px pointer-events-none bg-violet-500/[0.07]" />
          <div className="absolute top-[72%] inset-x-0 h-px pointer-events-none bg-violet-500/[0.07]" />
          <div className="absolute inset-y-0 left-[22%] w-px pointer-events-none hidden sm:block bg-violet-500/[0.05]" />
          <div className="absolute inset-y-0 right-[22%] w-px pointer-events-none hidden sm:block bg-violet-500/[0.05]" />
        </>
      )}

      {/* Twinkling 4-point cross stars positioned in negative space */}
      <div className="absolute top-[14%] right-[10%] animate-star-twinkle">
        <CrossStar
          size={24}
          className={
            mounted && isLight
              ? "text-violet-600 drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]"
              : "text-violet-200 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]"
          }
        />
      </div>
      <div className="absolute top-[32%] right-[22%] animate-star-twinkle-delayed">
        <CrossStar
          size={14}
          className={
            mounted && isLight
              ? "text-indigo-500 drop-shadow-[0_0_6px_rgba(99,102,241,0.35)]"
              : "text-violet-300 drop-shadow-[0_0_6px_rgba(139,92,246,0.6)]"
          }
        />
      </div>
      <div className="absolute top-[58%] right-[14%] animate-star-twinkle-slow">
        <CrossStar
          size={20}
          className={
            mounted && isLight
              ? "text-violet-700 drop-shadow-[0_0_8px_rgba(109,40,217,0.4)]"
              : "text-violet-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          }
        />
      </div>
      <div className="absolute top-[78%] right-[26%] animate-star-twinkle">
        <CrossStar
          size={12}
          className={
            mounted && isLight
              ? "text-cyan-600 drop-shadow-[0_0_5px_rgba(8,145,178,0.4)]"
              : "text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.7)]"
          }
        />
      </div>
      <div className="absolute top-[22%] left-[14%] animate-star-twinkle-delayed">
        <CrossStar
          size={16}
          className={
            mounted && isLight
              ? "text-violet-600 drop-shadow-[0_0_6px_rgba(124,58,237,0.4)]"
              : "text-violet-200 drop-shadow-[0_0_6px_rgba(167,139,250,0.7)]"
          }
        />
      </div>
      <div className="absolute top-[48%] left-[28%] animate-star-twinkle-slow">
        <CrossStar
          size={12}
          className={
            mounted && isLight
              ? "text-indigo-600 drop-shadow-[0_0_5px_rgba(79,70,229,0.35)]"
              : "text-violet-400 drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]"
          }
        />
      </div>
      <div className="absolute bottom-[22%] left-[10%] animate-star-twinkle">
        <CrossStar
          size={18}
          className={
            mounted && isLight
              ? "text-violet-700 drop-shadow-[0_0_7px_rgba(109,40,217,0.4)]"
              : "text-white drop-shadow-[0_0_7px_rgba(255,255,255,0.7)]"
          }
        />
      </div>
      <div className="absolute top-[38%] left-[4%] animate-star-twinkle-delayed">
        <CrossStar
          size={10}
          className={mounted && isLight ? "text-slate-400 opacity-60" : "text-slate-300 opacity-60"}
        />
      </div>

      {/* Tiny pinpoint stars */}
      <div
        className={`absolute top-[20%] right-[38%] w-1 h-1 rounded-full animate-pulse pointer-events-none ${mounted && isLight ? "bg-violet-600 opacity-60" : "bg-white opacity-70"
          }`}
      />
      <div
        className={`absolute top-[65%] left-[18%] w-1.5 h-1.5 rounded-full pointer-events-none ${mounted && isLight ? "bg-violet-500 opacity-70" : "bg-violet-300 opacity-80"
          }`}
      />
      <div
        className={`absolute top-[82%] right-[18%] w-1 h-1 rounded-full pointer-events-none ${mounted && isLight ? "bg-cyan-600 opacity-60" : "bg-cyan-200 opacity-60"
          }`}
      />
      <div
        className={`absolute top-[12%] left-[45%] w-1 h-1 rounded-full pointer-events-none ${mounted && isLight ? "bg-violet-500 opacity-50" : "bg-white opacity-50"
          }`}
      />

      {/* ========================================================= */}
      {/* GIANT BACKGROUND TYPOGRAPHY: LAUNCHBYTE                   */}
      {/* ========================================================= */}
      <div className="absolute top-[10%] sm:top-[12%] lg:top-[11%] inset-x-0 w-full flex justify-center items-center pointer-events-none select-none z-10 overflow-hidden px-2">
        <h1
          className={`font-black uppercase tracking-[0.14em] sm:tracking-[0.18em] lg:tracking-[0.22em] text-center w-full leading-none whitespace-nowrap transition-colors duration-300 ${mounted && isLight
            ? "hero-watermark text-[#0F172A]/[0.24]"
            : "text-white/[0.08]"
            }`}
          style={{
            fontSize: "clamp(2.8rem, 11.2vw, 12rem)",
            fontFamily: "inherit",
          }}
        >
          LAUNCHBYTE
        </h1>
      </div>

      {/* ========================================================= */}
      {/* EDITORIAL CONTENT: LEFT SIDE ALIGNED (Stacked on mobile)  */}
      {/* ========================================================= */}
      <div className={`relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-12 sm:pt-16 lg:pt-28 pb-4 sm:pb-8 lg:pb-24 flex-1 flex flex-col justify-center ${mounted && isLight ? "hero-content" : ""}`}>
        <div className="max-w-xl text-left space-y-5 sm:space-y-6">
          {/* Small category / label */}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase ${mounted && isLight ? "text-violet-700 font-bold" : "text-[#A78BFA]"
                }`}
            >
              LEARN • BUILD • GROW
            </span>
          </div>

          {/* Main headline: Explore Beyond Limits. */}
          <h2
            className={`font-extrabold leading-[1.08] transition-colors duration-300 ${mounted && isLight
              ? "text-4xl sm:text-5xl lg:text-[64px] xl:text-[72px] tracking-[-0.03em] text-[#17172B]"
              : "text-3xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.12]"
              }`}
          >
            Explore{" "}
            {mounted && isLight ? (
              <>
                <span className="text-[#17172B]">Beyond</span>
                <br />
                <span className="bg-gradient-to-r from-[#5B3DF5] via-[#7552D9] to-[#8B5CF6] bg-clip-text text-transparent">
                  Limits.
                </span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-white via-[#E2E8F0] to-[#A78BFA] bg-clip-text text-transparent">
                Beyond Limits.
              </span>
            )}
          </h2>

          {/* Supporting description */}
          <p
            className={`text-sm sm:text-lg leading-relaxed max-w-lg font-normal transition-colors duration-300 ${mounted && isLight ? "text-[#4B5565]" : "text-[#B8BAD0]"
              }`}
          >
            A community for students, developers and innovators to discover hackathons,
            opportunities and build something extraordinary.
          </p>

          {/* Actions / CTA Buttons */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/opportunities"
              className="w-full sm:w-auto min-h-[46px] justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] text-white font-semibold text-sm sm:text-base shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 group"
            >
              <span>Explore Opportunities</span>
              <ArrowRight className="w-4 h-4 text-violet-200 group-hover:translate-x-1 transition-transform" />
            </Link>

            {loading ? (
              <div
                aria-hidden="true"
                className={`w-full sm:w-[172px] min-h-[46px] rounded-xl border animate-pulse ${mounted && isLight
                  ? "border-slate-200 bg-slate-100"
                  : "border-violet-500/15 bg-violet-950/10"
                  }`}
              />
            ) : user ? (
              <Link
                href="/dashboard"
                className={`w-full sm:w-auto min-h-[46px] justify-center px-6 py-3.5 rounded-xl border font-semibold text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 ${mounted && isLight
                  ? "border-slate-300 bg-white/80 hover:bg-white text-slate-800 shadow-sm"
                  : "border-violet-500/30 hover:border-violet-400/60 bg-violet-950/20 hover:bg-violet-900/30 text-[#F8FAFC]"
                  }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${mounted && isLight ? "text-violet-600" : "text-violet-300"}`} />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/register"
                className={`w-full sm:w-auto min-h-[46px] justify-center px-6 py-3.5 rounded-xl border font-semibold text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 ${mounted && isLight
                  ? "border-slate-300 bg-white/80 hover:bg-white text-slate-800 shadow-sm"
                  : "border-violet-500/30 hover:border-violet-400/60 bg-violet-950/20 hover:bg-violet-900/30 text-[#F8FAFC]"
                  }`}
              >
                <span>Join LaunchByte</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT VISUAL: ASTRONAUT HOLDING GLOWING PLANET            */}
      {/* Same height/size as Dark Mode, positioned beside text     */}
      {/* ========================================================= */}
      <div className="relative mx-auto -mt-2 lg:mt-0 lg:absolute lg:bottom-0 max-w-[90vw] pointer-events-none select-none z-20 flex flex-col items-center lg:left-auto lg:right-[-2%] xl:right-[1%] lg:translate-x-0 w-[270px] sm:w-[400px] md:w-[480px] lg:w-[680px] xl:w-[740px]">
        {/* Glow halo behind the glowing planet (Dark Mode only) */}
        {(!mounted || !isLight) && (
          <>
            <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-64 sm:h-64 rounded-full pointer-events-none bg-violet-500/25 blur-[50px] sm:blur-[60px]" />
            <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full pointer-events-none bg-cyan-400/15 blur-[32px] sm:blur-[40px]" />
          </>
        )}

        {/* Astronaut image with gentle floating animation */}
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-full aspect-square flex items-end justify-center"
        >
          <Image
            src={
              mounted && isLight
                ? "/brand/hero-astronaut-light-tone.webp"
                : "/brand/hero-astronaut-holding-planet.webp"
            }
            alt="Astronaut holding a glowing planet representing boundless opportunity"
            width={1024}
            height={1024}
            priority
            className={`w-full h-auto object-contain object-bottom ${
              mounted && isLight
                ? "drop-shadow-[0_0_28px_rgba(125,211,252,0.55)]"
                : "drop-shadow-[0_10px_35px_rgba(139,92,246,0.25)]"
            }`}
          />
        </motion.div>

        {/* Seamless bottom fade mask (Dark Mode only) */}
        {(!mounted || !isLight) && (
          <div className="absolute bottom-0 inset-x-0 h-20 sm:h-32 pointer-events-none z-30 bg-gradient-to-t from-[#050510] via-[#050510]/80 to-transparent" />
        )}
      </div>

      {/* Bottom subtle border (Dark Mode only; Light Mode has zero horizontal seams) */}
      {(!mounted || !isLight) && (
        <div className="w-full h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent pointer-events-none relative z-30" />
      )}
    </section>
  );
}
