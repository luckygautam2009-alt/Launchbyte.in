"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { TeamMember } from "@/lib/types";
import { SITE_CONTENT, CoreTeamMember } from "@/lib/siteContent";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import RevealHeading from "@/components/ui/RevealHeading";
import TiltCard from "@/components/ui/TiltCard";
import { Linkedin, Github, Twitter, Users2, Sparkles } from "lucide-react";
import { Reveal } from "./HomeMotion";

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
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden border-t border-violet-950/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          {showEyebrow && (
            <div className="flex justify-center">
              <SectionEyebrow stage="LEADERSHIP // CORE CREW" />
            </div>
          )}
          <RevealHeading
            text={title}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight"
          />
          <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* 2-column grid desktop, 1-column mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {displayList.map((m, idx) => {
            const initials = m.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Reveal key={m.name} delay={0.08 * idx}>
                <TiltCard className="p-6 sm:p-7 border border-violet-500/25 h-full">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 h-full">
                    {/* Left: Square Photo with Gradient Border */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl p-[2px] bg-gradient-to-tr from-violet-600 via-cyan-400 to-indigo-600 shrink-0 shadow-lg shadow-violet-950/50">
                      <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 relative flex items-center justify-center">
                        {m.photo ? (
                          <img
                            src={m.photo}
                            alt={m.name}
                            onError={(e) => {
                              // Fallback on image load error to initials avatar
                              (e.target as HTMLElement).style.display = "none";
                            }}
                            className="w-full h-full object-cover select-none"
                          />
                        ) : null}
                        {/* Fallback gradient with initials */}
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-indigo-900 to-[#09091b] flex items-center justify-center -z-10">
                          <span className="font-mono font-bold text-2xl text-cyan-300">
                            {initials}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 flex flex-col justify-between text-center sm:text-left min-w-0">
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          {m.name}
                        </h3>
                        <p className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mt-0.5 mb-2">
                          {m.role}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                          {m.bio}
                        </p>
                      </div>

                      {/* Social Links */}
                      <div className="flex items-center justify-center sm:justify-start gap-3 mt-4 pt-3 border-t border-slate-800/70">
                        {m.linkedin && (
                          <a
                            href={m.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${m.name}'s LinkedIn profile`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-violet-950/60 transition-colors"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {m.github && (
                          <a
                            href={m.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${m.name}'s GitHub profile`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-violet-950/60 transition-colors"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {m.twitter && (
                          <a
                            href={m.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${m.name}'s X (Twitter) profile`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-violet-950/60 transition-colors"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
