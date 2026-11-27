"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";

// Subtle 4-point cross star for atmospheric depth
function CrossStar({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
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

export default function OrbitalBrandSection() {
  const { isLight, mounted } = useTheme();

  return (
    <section
      className={`relative w-full py-20 sm:py-28 lg:py-36 scroll-mt-20 overflow-hidden select-none transition-colors duration-300 ${
        mounted && isLight ? "bg-transparent" : "bg-[#050510]"
      }`}
    >
      {/* Background Ambience & Soft Space Environment (Dark Mode only so Light Mode stays seamless) */}
      {(!mounted || !isLight) && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#09091B]/90 to-[#050510] pointer-events-none" />
      )}

      {/* Subtle Central Violet Nebula Glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[800px] h-[320px] sm:h-[800px] rounded-full pointer-events-none transition-colors duration-300 ${
          mounted && isLight
            ? "bg-violet-400/[0.12] blur-[80px] sm:blur-[150px]"
            : "bg-violet-600/[0.07] blur-[80px] sm:blur-[150px]"
        }`}
      />
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] sm:w-[450px] h-[200px] sm:h-[450px] rounded-full pointer-events-none transition-colors duration-300 ${
          mounted && isLight
            ? "bg-cyan-400/[0.1] blur-[60px] sm:blur-[100px]"
            : "bg-cyan-500/[0.04] blur-[60px] sm:blur-[100px]"
        }`}
      />

      {/* Sparse Subtle Twinkling Stars */}
      <div className="absolute top-[16%] left-[12%] animate-star-twinkle">
        <CrossStar
          size={16}
          className={
            mounted && isLight
              ? "text-violet-600 drop-shadow-[0_0_6px_rgba(124,58,237,0.4)]"
              : "text-violet-300 drop-shadow-[0_0_6px_rgba(167,139,250,0.7)]"
          }
        />
      </div>
      <div className="absolute top-[28%] right-[14%] animate-star-twinkle-delayed">
        <CrossStar
          size={12}
          className={
            mounted && isLight
              ? "text-indigo-600 drop-shadow-[0_0_5px_rgba(99,102,241,0.35)]"
              : "text-violet-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]"
          }
        />
      </div>
      <div className="absolute bottom-[20%] left-[18%] animate-star-twinkle-slow">
        <CrossStar
          size={14}
          className={
            mounted && isLight
              ? "text-cyan-600 drop-shadow-[0_0_6px_rgba(8,145,178,0.4)]"
              : "text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
          }
        />
      </div>
      <div className="absolute bottom-[24%] right-[10%] animate-star-twinkle">
        <CrossStar
          size={18}
          className={
            mounted && isLight
              ? "text-violet-700 drop-shadow-[0_0_7px_rgba(109,40,217,0.4)]"
              : "text-violet-200 drop-shadow-[0_0_7px_rgba(167,139,250,0.8)]"
          }
        />
      </div>
      <div className="absolute top-[68%] left-[8%] animate-star-twinkle-delayed">
        <CrossStar
          size={10}
          className={mounted && isLight ? "text-slate-400 opacity-60" : "text-slate-400 opacity-60"}
        />
      </div>

      {/* Tiny pinpoint stars */}
      <div
        className={`absolute top-[12%] right-[32%] w-1 h-1 rounded-full pointer-events-none ${
          mounted && isLight ? "bg-violet-600 opacity-50" : "bg-white opacity-50"
        }`}
      />
      <div
        className={`absolute bottom-[14%] left-[40%] w-1.5 h-1.5 rounded-full pointer-events-none ${
          mounted && isLight ? "bg-violet-500 opacity-60" : "bg-violet-300 opacity-60"
        }`}
      />
      <div
        className={`absolute top-[80%] right-[38%] w-1 h-1 rounded-full pointer-events-none ${
          mounted && isLight ? "bg-cyan-600 opacity-50" : "bg-cyan-200 opacity-50"
        }`}
      />

      {/* Top & Bottom subtle dividers (Dark Mode only so Light Mode has zero horizontal seams) */}
      {(!mounted || !isLight) && (
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />
      )}

      {/* Main Content Container: Balanced 3-Part Cinematic Composition */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 sm:gap-16 lg:gap-8">
          {/* ========================================================= */}
          {/* LEFT SIDE CONTENT                                         */}
          {/* ========================================================= */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-[32%] xl:w-[30%] text-left space-y-4 sm:space-y-5 order-1"
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5">
              <span className={`w-5 h-px ${mounted && isLight ? "bg-violet-600" : "bg-violet-400/60"}`} />
              <span
                className={`text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase ${
                  mounted && isLight ? "text-violet-700 font-bold" : "text-[#A78BFA]"
                }`}
              >
                MORE THAN JUST EVENTS
              </span>
            </div>

            {/* Heading */}
            <h3
              className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.18] transition-colors duration-300 ${
                mounted && isLight ? "text-[#17172B]" : "text-white"
              }`}
            >
              A Space for Builders,{" "}
              <span
                className={
                  mounted && isLight
                    ? "text-[#7552D9]"
                    : "bg-gradient-to-r from-white via-[#F8FAFC] to-[#A78BFA] bg-clip-text text-transparent"
                }
              >
                Dreamers &amp; Innovators.
              </span>
            </h3>

            {/* Description */}
            <p
              className={`text-sm sm:text-base leading-relaxed font-normal transition-colors duration-300 ${
                mounted && isLight ? "text-[#4B5565]" : "text-[#B8BAD0]"
              }`}
            >
              LaunchByte is a student-driven community where ambitious builders
              discover opportunities, participate in hackathons, collaborate
              with others and turn their ideas into reality.
            </p>
          </motion.div>

          {/* ========================================================= */}
          {/* CENTRAL FLOATING LOGO                                     */}
          {/* ========================================================= */}
          <div className="relative w-full lg:w-[36%] xl:w-[40%] flex justify-center items-center order-2 py-4 sm:py-6 lg:py-0">
            {/* Concentric faint orbital lines */}
            <div
              className={`absolute w-[240px] h-[240px] sm:w-[420px] sm:h-[420px] lg:w-[460px] lg:h-[460px] rounded-full border pointer-events-none animate-slow-orbit ${
                mounted && isLight ? "border-violet-400/[0.2]" : "border-violet-500/[0.09]"
              }`}
            />
            <div
              className={`hidden sm:block absolute w-[500px] h-[500px] lg:w-[540px] lg:h-[540px] rounded-full border pointer-events-none rotate-45 ${
                mounted && isLight ? "border-violet-400/[0.12]" : "border-violet-400/[0.04]"
              }`}
            />

            {/* Ambient violet + subtle cyan radial glow behind logo */}
            <div
              className={`absolute w-44 h-44 sm:w-72 sm:h-72 rounded-full pointer-events-none ${
                mounted && isLight ? "bg-violet-400/25 blur-[60px]" : "bg-violet-500/20 blur-[55px] sm:blur-[70px]"
              }`}
            />
            <div
              className={`absolute w-32 h-32 sm:w-52 sm:h-52 rounded-full pointer-events-none ${
                mounted && isLight ? "bg-cyan-400/20 blur-[45px]" : "bg-cyan-400/10 blur-[40px] sm:blur-[50px]"
              }`}
            />

            {/* Continuous Gentle Floating Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="relative z-10 w-full flex justify-center"
            >
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{
                  duration: 6.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative w-[220px] sm:w-[340px] md:w-[390px] lg:w-[420px] xl:w-[460px] max-w-[75vw]"
              >
                <Image
                  src="/brand/launchbyte-orbital-neon-emblem.webp"
                  alt="LaunchByte 3D Orbital Emblem"
                  width={1024}
                  height={939}
                  className="w-full h-auto object-contain drop-shadow-[0_12px_45px_rgba(139,92,246,0.32)] filter"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE CONTENT                                        */}
          {/* ========================================================= */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.12 }}
            className="w-full lg:w-[32%] xl:w-[30%] text-left space-y-4 sm:space-y-5 order-3"
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5">
              <span className={`w-5 h-px ${mounted && isLight ? "bg-violet-600" : "bg-violet-400/60"}`} />
              <span
                className={`text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase ${
                  mounted && isLight ? "text-violet-700 font-bold" : "text-[#A78BFA]"
                }`}
              >
                TOGETHER, WE BUILD BETTER
              </span>
            </div>

            {/* Heading */}
            <h3
              className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.18] transition-colors duration-300 ${
                mounted && isLight ? "text-[#17172B]" : "text-white"
              }`}
            >
              Learn. Build.{" "}
              <span
                className={
                  mounted && isLight
                    ? "text-[#7552D9]"
                    : "bg-gradient-to-r from-white via-[#F8FAFC] to-[#A78BFA] bg-clip-text text-transparent"
                }
              >
                Grow Together.
              </span>
            </h3>

            {/* Description */}
            <p
              className={`text-sm sm:text-base leading-relaxed font-normal transition-colors duration-300 ${
                mounted && isLight ? "text-[#4B5565]" : "text-[#B8BAD0]"
              }`}
            >
              From discovering hackathons and opportunities to collaborating on
              projects and building new skills, LaunchByte helps students take
              the next step in their tech journey.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom subtle divider blending into following section */}
      {(!mounted || !isLight) && (
        <div className="absolute bottom-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />
      )}
    </section>
  );
}
