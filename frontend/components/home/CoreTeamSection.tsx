"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { api } from "@/lib/api";
import { TeamMember } from "@/lib/types";
import { SITE_CONTENT, CoreTeamMember } from "@/lib/siteContent";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import RevealHeading from "@/components/ui/RevealHeading";
import { Linkedin, Github, Twitter } from "lucide-react";

interface TeamMemberBlockProps {
  member: CoreTeamMember;
  index: number;
  total: number;
  isImageLeft: boolean;
}

function TeamMemberBlock({
  member,
  index,
  total,
  isImageLeft,
}: TeamMemberBlockProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: blockRef,
    offset: ["start end", "end start"],
  });

  // Smooth subtle image parallax (approx ±20px across the viewport transit)
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [-24, 24]
  );

  const [imgError, setImgError] = useState(false);

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const memberTag = `CORE CREW / ${String(index + 1).padStart(2, "0")}`;

  // Resting 3D tilt perspective (subtly tilted towards center, straightens on hover)
  const restingRotation = isImageLeft ? "rotateY(4deg) rotateX(2deg)" : "rotateY(-4deg) rotateX(2deg)";

  return (
    <div
      ref={blockRef}
      className="min-h-[80vh] lg:min-h-[85vh] flex items-center justify-center py-16 lg:py-24 relative"
    >
      <div
        className={`w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col ${
          isImageLeft ? "lg:flex-row" : "lg:flex-row-reverse"
        } items-center justify-between gap-12 lg:gap-16 xl:gap-20`}
      >
        {/* ================= Portrait Column (42%–48%) ================= */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[46%] flex justify-center"
        >
          {/* 3D Perspective Container */}
          <div
            className="group relative w-full max-w-[340px] sm:max-w-[390px] lg:max-w-[430px]"
            style={{ perspective: 1200 }}
          >
            {/* Soft Ambient Purple/Cyan Glow Backdrop */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-violet-600/25 via-indigo-600/20 to-cyan-400/20 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* 3D Floating Portrait Display Frame */}
            <div
              className="relative aspect-[4/5] w-full rounded-2xl sm:rounded-3xl p-[1.5px] bg-gradient-to-tr from-cyan-400/40 via-violet-500/50 to-indigo-500/40 shadow-[0_25px_60px_-15px_rgba(139,92,246,0.3),0_0_35px_-5px_rgba(34,211,238,0.15)] transition-all duration-700 ease-out"
              style={{
                transform: shouldReduceMotion ? "none" : restingRotation,
                transformStyle: "preserve-3d",
              }}
              onMouseEnter={(e) => {
                if (!shouldReduceMotion) {
                  e.currentTarget.style.transform = "rotateY(0deg) rotateX(0deg) scale(1.02)";
                }
              }}
              onMouseLeave={(e) => {
                if (!shouldReduceMotion) {
                  e.currentTarget.style.transform = restingRotation;
                }
              }}
            >
              {/* Inner Picture Shell */}
              <div className="relative w-full h-full rounded-[15px] sm:rounded-[23px] overflow-hidden bg-slate-950">
                {member.photo && !imgError ? (
                  <motion.div style={{ y: imageY }} className="relative w-full h-[115%] -top-[7%]">
                    <img
                      src={member.photo}
                      alt={member.name}
                      onError={() => setImgError(true)}
                      style={{ objectPosition: "center 20%" }}
                      className="w-full h-full object-cover select-none filter contrast-[1.03] brightness-[0.98]"
                    />
                  </motion.div>
                ) : (
                  /* Fallback Cosmic Gradient with Initials */
                  <div className="w-full h-full bg-gradient-to-br from-violet-950 via-[#0B0B20] to-[#050510] flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-space-grid opacity-25 pointer-events-none" />
                    <div className="w-24 h-24 rounded-full bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-900/40">
                      <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-cyan-300">
                        {initials}
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtle Cinematic Vignette & Specular Edge Highlight */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510]/70 via-transparent to-white/[0.07]" />

                {/* Bottom Identifier Strip (Minimal & Futuristic) */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] font-mono tracking-wider text-slate-300/80 backdrop-blur-md bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
                  <span className="text-cyan-300 font-semibold">{memberTag}</span>
                  <span className="text-slate-400">LAUNCHBYTE / CORE</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= Text Content Column (45%–50%) ================= */}
        {/* Directly on dark background — NO card, NO box, NO divider border */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[48%] space-y-6 text-left"
        >
          {/* 1. Small Eyebrow Label */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-400/90 font-semibold">
              {memberTag}
            </span>
          </div>

          {/* 2. Member's Full Name & 3. Role */}
          <div className="space-y-2">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.15]">
              {member.name}
            </h3>
            <p className="font-mono text-xs sm:text-sm uppercase tracking-widest text-[#A78BFA] font-semibold">
              {member.role}
            </p>
          </div>

          {/* 4. Biography (Plain text, comfortable line height, max width) */}
          <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed font-normal max-w-xl">
            {member.bio}
          </p>

          {/* 5. Optional Focus Areas / Expertise */}
          {member.focus && member.focus.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                Primary Focus Areas
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-mono text-slate-300">
                {member.focus.map((item, fIdx) => (
                  <span key={fIdx} className="inline-flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">/</span>
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 6. Social Links (Only rendered when actual URLs exist) */}
          <div className="pt-4 flex items-center gap-4">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name}'s LinkedIn profile`}
                className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/20 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/50 hover:bg-violet-900/40 transition-all duration-200"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name}'s GitHub profile`}
                className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/20 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/50 hover:bg-violet-900/40 transition-all duration-200"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {member.twitter && (
              <a
                href={member.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name}'s X profile`}
                className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/20 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/50 hover:bg-violet-900/40 transition-all duration-200"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function CoreTeamSection({
  showEyebrow = true,
  title = "Meet the Core Team",
  subtitle = "The systems engineers, product designers, and community leads building LaunchByte.",
}: {
  showEyebrow?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const [members, setMembers] = useState<CoreTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        const publicTeam: TeamMember[] = await api.getPublicTeam();
        if (publicTeam && publicTeam.length > 0) {
          const mapped: CoreTeamMember[] = publicTeam.map((m) => ({
            name: m.name,
            role: m.designation,
            bio: m.bio || "",
            photo: m.photo_url || undefined,
            linkedin: m.linkedin_url || undefined,
            github: m.github_url || undefined,
            // Fallback focus from SITE_CONTENT if name matches
            focus: SITE_CONTENT.coreTeam.find((c) => c.name.toLowerCase() === m.name.toLowerCase())?.focus,
          }));
          setMembers(mapped);
        } else {
          setMembers(SITE_CONTENT.coreTeam);
        }
      } catch {
        setMembers(SITE_CONTENT.coreTeam);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  const displayList = members.length > 0 ? members : SITE_CONTENT.coreTeam;

  return (
    <section
      data-hide-journey="true"
      className="relative py-24 sm:py-32 bg-[#050510] overflow-hidden"
    >
      {/* Background Cosmic Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-r from-violet-900/10 via-indigo-900/10 to-cyan-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Section Top Header */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20 text-center space-y-4">
        {showEyebrow && (
          <div className="flex justify-center">
            <SectionEyebrow stage="LEADERSHIP // CORE CREW" accentColor="cyan" />
          </div>
        )}
        <RevealHeading
          text={title}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight"
        />
        <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Alternating Scroll-Driven Showcase (One Member Per Segment) */}
      <div className="relative">
        {displayList.map((m, idx) => (
          <TeamMemberBlock
            key={`${m.name}-${idx}`}
            member={m}
            index={idx}
            total={displayList.length}
            isImageLeft={idx % 2 === 0}
          />
        ))}
      </div>
    </section>
  );
}
