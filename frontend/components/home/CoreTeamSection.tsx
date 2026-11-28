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
import RevealHeading from "@/components/ui/RevealHeading";
import { Linkedin, Github, Twitter, Globe, Instagram } from "lucide-react";

interface TeamPortraitFrameProps {
  member: CoreTeamMember;
  index: number;
  total: number;
  isImageLeft: boolean;
  scrollYProgress: any;
  shouldReduceMotion: boolean | null;
}

function TeamPortraitFrame({
  member,
  index,
  total,
  isImageLeft,
  scrollYProgress,
  shouldReduceMotion,
}: TeamPortraitFrameProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Subtle image parallax across scroll viewport (kept minimal to avoid clipping)
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [-12, 12]
  );

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const memberTag = `MEMBER ${String(index + 1).padStart(2, "0")} / ${String(
    total
  ).padStart(2, "0")}`;

  // Resting 3D tilt perspective (subtly tilted towards center)
  const restingRotation = isImageLeft
    ? "perspective(1200px) rotateY(3.5deg) rotateX(1.5deg)"
    : "perspective(1200px) rotateY(-3.5deg) rotateX(1.5deg)";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Gentle ±6 degree tilt based on mouse position from center
    const rotX = -(y / (rect.height / 2)) * 6;
    const rotY = (x / (rect.width / 2)) * 6;
    setRotate({ x: rotX, y: rotY });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const currentTransform = shouldReduceMotion
    ? "none"
    : isHovered
    ? `perspective(1200px) rotateX(${rotate.x.toFixed(2)}deg) rotateY(${rotate.y.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    : restingRotation;

  return (
    <div
      className="group relative w-full max-w-[200px] sm:max-w-[260px] md:max-w-[300px] lg:max-w-[330px]"
      style={{ perspective: 1200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Soft Ambient Purple/Cyan Glow Backdrop */}
      <div className="absolute -inset-3 sm:-inset-6 rounded-3xl bg-gradient-to-tr from-violet-600/30 via-indigo-600/20 to-cyan-400/25 blur-xl sm:blur-2xl opacity-40 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none" />

      {/* Floating 3D Portrait Frame with hairline gradient edge (flat on mobile touch devices) */}
      <div
        className="relative aspect-[4/5] w-full rounded-2xl sm:rounded-3xl p-[1.5px] bg-gradient-to-tr from-cyan-400/50 via-violet-500/60 to-indigo-500/50 shadow-[0_25px_60px_-15px_rgba(139,92,246,0.35),0_0_40px_-10px_rgba(34,211,238,0.2)] transition-transform duration-300 ease-out will-change-transform max-md:!transform-none"
        style={{
          transform: currentTransform,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Inner Picture Shell */}
        <div className="relative w-full h-full rounded-[15px] sm:rounded-[23px] overflow-hidden bg-slate-950">
          {member.photo && !imgError ? (
            <motion.div
              style={{ y: imageY }}
              className="relative w-full h-[116%] -top-[8%] max-md:!transform-none"
            >
              <img
                loading="lazy"
                decoding="async"
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
              <div className="w-24 h-24 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center shadow-lg shadow-violet-900/50">
                <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-cyan-300">
                  {initials}
                </span>
              </div>
            </div>
          )}

          {/* Cinematic Vignette & Specular Edge Highlight */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510]/85 via-transparent to-white/[0.06]" />

          {/* Futuristic Minimal Identifier Strip at Bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] font-mono tracking-wider text-slate-300/85 backdrop-blur-md bg-black/50 px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
            <span className="text-cyan-300 font-semibold">{memberTag}</span>
            <span className="text-slate-400 font-medium">LAUNCHBYTE // CORE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TeamMemberBlockProps {
  member: CoreTeamMember;
  index: number;
  total: number;
  isImageLeft: boolean;
  onInView: (index: number) => void;
}

function TeamMemberBlock({
  member,
  index,
  total,
  isImageLeft,
  onInView,
}: TeamMemberBlockProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: blockRef,
    offset: ["start end", "end start"],
  });

  const memberTag = `MEMBER ${String(index + 1).padStart(2, "0")} / ${String(
    total
  ).padStart(2, "0")}`;

  return (
    <div
      ref={blockRef}
      id={`crew-member-${index + 1}`}
      className="flex items-center justify-center py-6 sm:py-8 lg:py-10 relative scroll-mt-20"
    >
      <div
        className={`w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col ${
          isImageLeft ? "lg:flex-row" : "lg:flex-row-reverse"
        } items-center justify-between gap-6 sm:gap-8 lg:gap-12 xl:gap-14`}
      >
        {/* ================= 1. Portrait Column (40%–48%) ================= */}
        <motion.div
          initial={{ opacity: 0, x: isImageLeft ? -36 : 36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          onViewportEnter={() => onInView(index)}
          className="w-full lg:w-[46%] flex justify-center"
        >
          <TeamPortraitFrame
            member={member}
            index={index}
            total={total}
            isImageLeft={isImageLeft}
            scrollYProgress={scrollYProgress}
            shouldReduceMotion={shouldReduceMotion}
          />
        </motion.div>

        {/* ================= 2. Open Editorial Typography Column (48%–52%) ================= */}
        {/* Completely open, unboxed layout — NO card, NO panel, NO border */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[50%] space-y-6 text-left"
        >
          {/* Subtle Numeric Index */}
          <div className="font-mono text-xs uppercase tracking-widest text-[#7552D9] dark:text-cyan-400/90 font-semibold">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>

          {/* Name & Role */}
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-[#17172B] dark:text-[#F8FAFC] tracking-tight leading-[1.12]">
              {member.name}
            </h3>
            <p className="font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#7552D9] via-indigo-600 to-cyan-600 dark:from-violet-400 dark:via-indigo-300 dark:to-cyan-300">
              {member.role}
            </p>
            {member.title && (
              <p className="font-mono text-xs sm:text-sm text-cyan-700 dark:text-cyan-300/90 font-medium tracking-wide">
                {member.title}
              </p>
            )}
          </div>

          {/* Tagline / Core Quote */}
          {member.tagline && (
            <blockquote className="border-l-2 border-[#7552D9] dark:border-violet-500/60 pl-4 py-1 text-base sm:text-lg text-[#252642] dark:text-slate-200/95 italic font-medium leading-relaxed">
              “{member.tagline}”
            </blockquote>
          )}

          {/* Professional Biography */}
          <p className="text-base sm:text-lg text-[#424C63] dark:text-slate-300/90 leading-relaxed font-normal max-w-xl">
            {member.bio}
          </p>

          {/* Key Achievements & Project Highlights (Typography List — NOT cards) */}
          {member.highlights && member.highlights.length > 0 && (
            <div className="pt-2 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#647084] dark:text-slate-400/90 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7552D9] dark:bg-cyan-400/70" />
                <span>PROJECTS &amp; PLATFORMS</span>
              </div>
              <div className="space-y-3 pt-1">
                {member.highlights.map((h) => (
                  <div
                    key={h.id}
                    className="group/item flex items-start gap-3 sm:gap-4 transition-colors"
                  >
                    <span className="font-mono text-xs text-[#7552D9] dark:text-cyan-400/90 font-bold pt-0.5 tracking-wider select-none">
                      {h.id} —
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold tracking-wide text-[#17172B] group-hover/item:text-[#7552D9] dark:text-white dark:group-hover/item:text-cyan-300 transition-colors">
                          {h.title}
                        </span>
                        {h.role && (
                          <span className="text-[10px] font-mono tracking-wider text-[#59647A] dark:text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                            {h.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#424C63] dark:text-slate-300/75 leading-relaxed">
                        {h.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relevant Focus Areas / Expertise Domains */}
          {((member.focus && member.focus.length > 0) || (member.skills && member.skills.length > 0)) && (
            <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono text-[#424C63] dark:text-slate-300/90">
              <span className="text-[11px] uppercase tracking-wider text-[#647084] dark:text-slate-400 mr-1 select-none">
                FOCUS AREAS:
              </span>
              {(member.focus || member.skills)!.map((s, idx) => (
                <span key={idx} className="inline-flex items-center gap-2">
                  {idx > 0 && (
                    <span className="text-[#7552D9]/60 dark:text-cyan-400/60 font-bold select-none">
                      /
                    </span>
                  )}
                  <span className="text-[#252642] hover:text-[#7552D9] dark:text-slate-300 dark:hover:text-white transition-colors">
                    {s}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Social Links (Rendered ONLY when valid URLs exist) */}
          {(member.linkedin || member.github || member.portfolio || member.instagram || member.twitter) && (
            <div className="pt-3 flex flex-wrap items-center gap-3">
              {member.linkedin && member.linkedin.startsWith("http") && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name}'s LinkedIn profile`}
                  title="LinkedIn"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/90 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/25 text-[#424C63] dark:text-slate-400 hover:text-[#7552D9] dark:hover:text-cyan-300 hover:border-violet-400 dark:hover:border-cyan-400/50 hover:bg-violet-50 dark:hover:bg-violet-900/40 shadow-sm dark:shadow-none transition-all duration-200"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {member.github && member.github.startsWith("http") && (
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name}'s GitHub profile`}
                  title="GitHub"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/90 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/25 text-[#424C63] dark:text-slate-400 hover:text-[#7552D9] dark:hover:text-cyan-300 hover:border-violet-400 dark:hover:border-cyan-400/50 hover:bg-violet-50 dark:hover:bg-violet-900/40 shadow-sm dark:shadow-none transition-all duration-200"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {member.portfolio && member.portfolio.startsWith("http") && (
                <a
                  href={member.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name}'s Portfolio website`}
                  title="Portfolio"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/90 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/25 text-[#424C63] dark:text-slate-400 hover:text-[#7552D9] dark:hover:text-cyan-300 hover:border-violet-400 dark:hover:border-cyan-400/50 hover:bg-violet-50 dark:hover:bg-violet-900/40 shadow-sm dark:shadow-none transition-all duration-200"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {member.instagram && member.instagram.startsWith("http") && (
                <a
                  href={member.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name}'s Instagram profile`}
                  title="Instagram"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/90 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/25 text-[#424C63] dark:text-slate-400 hover:text-[#7552D9] dark:hover:text-cyan-300 hover:border-violet-400 dark:hover:border-cyan-400/50 hover:bg-violet-50 dark:hover:bg-violet-900/40 shadow-sm dark:shadow-none transition-all duration-200"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {member.twitter && member.twitter.startsWith("http") && (
                <a
                  href={member.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name}'s X profile`}
                  title="X"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/90 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/25 text-[#424C63] dark:text-slate-400 hover:text-[#7552D9] dark:hover:text-cyan-300 hover:border-violet-400 dark:hover:border-cyan-400/50 hover:bg-violet-50 dark:hover:bg-violet-900/40 shadow-sm dark:shadow-none transition-all duration-200"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function CoreTeamSection({
  showEyebrow = true,
  title = "Meet the Core Team",
  subtitle = "The product architects, engineering leads, and community builders shaping LaunchByte.",
}: {
  showEyebrow?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const [members, setMembers] = useState<CoreTeamMember[]>(SITE_CONTENT.coreTeam);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function loadTeam() {
      try {
        const publicTeam: TeamMember[] = await api.getPublicTeam();
        const BANNED_DEMO_NAMES = [
          "sarah chen",
          "david kalu",
          "maya patel",
          "alex rivera",
          "alex vance",
          "sophia zhang",
          "devon reed",
        ];
        const validPublicTeam = (publicTeam || []).filter(
          (m) => !BANNED_DEMO_NAMES.includes(m.name.toLowerCase().trim())
        );

        if (validPublicTeam.length > 0) {
          // Keep canonical core team order (01 to 04) and enrich with any verified database links
          const enriched = SITE_CONTENT.coreTeam.map((official) => {
            const match = validPublicTeam.find(
              (p) => p.name.toLowerCase().trim() === official.name.toLowerCase().trim()
            );
            if (!match) return official;
            return {
              ...official,
              linkedin: match.linkedin_url || official.linkedin,
              github: match.github_url || official.github,
            };
          });
          setMembers(enriched);
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
      className="relative py-12 sm:py-16 bg-transparent overflow-hidden"
    >
      {/* Background Cosmic Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-r from-violet-900/15 via-indigo-900/10 to-cyan-900/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-cyan-900/10 via-violet-900/10 to-indigo-900/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Section Top Header */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-14 text-center space-y-4">
        <RevealHeading
          text={title}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17172B] dark:text-[#F8FAFC] tracking-tight"
        />
        <p className="text-sm sm:text-base text-[#424C63] dark:text-[#CBD5E1] leading-relaxed max-w-2xl mx-auto">
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
            onInView={(newIdx) => setActiveIndex(newIdx)}
          />
        ))}
      </div>
    </section>
  );
}
