"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "@/lib/api";
import { TeamMember } from "@/lib/types";
import { SITE_CONTENT, CoreTeamMember } from "@/lib/siteContent";
import RevealHeading from "@/components/ui/RevealHeading";
import { Linkedin, Github, Twitter, Globe, Instagram, ChevronDown } from "lucide-react";

const SOCIALS = [
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "github", label: "GitHub", Icon: Github },
  { key: "portfolio", label: "Portfolio website", Icon: Globe },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "twitter", label: "X", Icon: Twitter },
] as const;

function MemberCard({ member, index }: { member: CoreTeamMember; index: number }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const focus = member.focus || member.skills || [];
  const hasMore = Boolean(member.bio) || (member.highlights?.length ?? 0) > 0 || focus.length > 0;
  const links = SOCIALS.filter((s) => {
    const url = member[s.key as keyof CoreTeamMember];
    return typeof url === "string" && url.startsWith("http");
  });

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay: Math.min(index, 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      id={`crew-member-${index + 1}`}
      className="flex flex-col rounded-3xl p-3 sm:p-4 border bg-white/85 border-slate-200 shadow-sm
        dark:bg-white/[0.03] dark:border-white/10 dark:shadow-none
        hover:border-violet-300 dark:hover:border-violet-400/40 transition-colors"
    >
      {/* Portrait */}
      <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-slate-950">
        {member.photo && !imgError ? (
          <img
            loading="lazy"
            decoding="async"
            src={member.photo}
            alt={member.name}
            onError={() => setImgError(true)}
            style={{ objectPosition: "center 20%" }}
            className="w-full h-full object-cover select-none"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-950 via-[#0B0B20] to-[#050510] flex items-center justify-center">
            <span className="font-mono text-4xl font-bold text-cyan-300">{initials}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="absolute bottom-2.5 left-3 font-mono text-[10px] tracking-widest text-white/85">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Identity */}
      <div className="mt-4 px-1 space-y-1">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#17172B] dark:text-[#F8FAFC] leading-tight">
          {member.name}
        </h3>
        <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-[#7552D9] dark:text-violet-300">
          {member.role}
        </p>
        {member.title && (
          <p className="font-mono text-[11px] text-cyan-700 dark:text-cyan-300/90">{member.title}</p>
        )}
        {member.tagline && (
          <p
            className={`pt-1 text-sm italic text-[#424C63] dark:text-slate-300/90 leading-relaxed ${
              open ? "" : "line-clamp-2"
            }`}
          >
            “{member.tagline}”
          </p>
        )}
      </div>

      {/* Expandable details */}
      {hasMore && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-2 mx-1 self-start inline-flex items-center gap-1 text-xs font-semibold text-[#7552D9] dark:text-cyan-300 hover:underline min-h-[32px]"
          >
            {open ? "Show less" : "Read more"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="mt-2 px-1 space-y-4 text-sm">
              {member.bio && (
                <p className="text-[#424C63] dark:text-slate-300/90 leading-relaxed">{member.bio}</p>
              )}

              {member.highlights && member.highlights.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#647084] dark:text-slate-400">
                    Projects &amp; platforms
                  </div>
                  {member.highlights.map((h) => (
                    <div key={h.id} className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#17172B] dark:text-white">{h.title}</span>
                        {h.role && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-[#59647A] dark:text-slate-400">
                            {h.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#424C63] dark:text-slate-300/80 leading-relaxed">
                        {h.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {focus.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {focus.map((s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-violet-50 text-[#5B39B8] border border-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Socials (only real links) */}
      {links.length > 0 && (
        <div className="mt-auto pt-4 px-1 flex flex-wrap items-center gap-2">
          {links.map(({ key, label, Icon }) => (
            <a
              key={key}
              href={member[key as keyof CoreTeamMember] as string}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name}'s ${label}`}
              title={label}
              className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors
                bg-white border-violet-200 text-[#424C63] hover:text-[#7552D9] hover:border-violet-400 hover:bg-violet-50
                dark:bg-violet-950/40 dark:border-violet-500/25 dark:text-slate-400 dark:hover:text-cyan-300 dark:hover:border-cyan-400/50"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      )}
    </motion.article>
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
          // Keep the canonical core team order and enrich with any verified database links
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
      }
    }
    loadTeam();
  }, []);

  const list = members.length > 0 ? members : SITE_CONTENT.coreTeam;
  const cols =
    list.length <= 2
      ? "sm:grid-cols-2 max-w-3xl"
      : list.length === 3
      ? "sm:grid-cols-2 lg:grid-cols-3 max-w-5xl"
      : "sm:grid-cols-2 xl:grid-cols-4 max-w-7xl";

  return (
    <section data-hide-journey="true" className="relative py-12 sm:py-16 bg-transparent">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 text-center space-y-3">
        <RevealHeading
          text={title}
          className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17172B] dark:text-[#F8FAFC] tracking-tight"
        />
        <p className="text-sm sm:text-base text-[#424C63] dark:text-[#CBD5E1] leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      <div className={`relative mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 gap-5 items-start ${cols}`}>
        {list.map((m, idx) => (
          <MemberCard key={`${m.name}-${idx}`} member={m} index={idx} />
        ))}
      </div>
    </section>
  );
}
