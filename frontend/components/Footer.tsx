import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Linkedin, Instagram, MessageCircle, Mail } from "lucide-react";
import { LAUNCHBYTE_SOCIALS } from "@/lib/siteContent";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-violet-900/30 bg-[#050510]/85 backdrop-blur-md text-slate-400 text-sm py-14 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-violet-900/20">
          {/* Official Logo & Short Description */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg py-1"
              aria-label="LaunchByte Home"
            >
              <div className="relative h-10 w-auto aspect-[1024/939] flex items-center justify-center">
                <Image
                  src="/brand/launchbyte-navbar-logo.png"
                  alt="LaunchByte Logo"
                  width={1024}
                  height={939}
                  className="h-full w-auto object-contain select-none filter drop-shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                />
              </div>
            </Link>
            <p className="text-slate-400 max-w-sm text-xs sm:text-sm leading-relaxed">
              A student-driven technology platform for discovering verified hackathons,
              fellowships, internships, and building alongside real developers.
            </p>
          </div>

          {/* Important Navigation Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm tracking-wide">Explore</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/opportunities" className="text-slate-400 hover:text-white transition">
                  All Opportunities
                </Link>
              </li>
              <li>
                <Link href="/hackathons" className="text-slate-400 hover:text-white transition">
                  Hackathons
                </Link>
              </li>
              <li>
                <Link href="/host" className="text-slate-400 hover:text-white transition">
                  Host an Event
                </Link>
              </li>
              <li>
                <Link href="/teams" className="text-slate-400 hover:text-white transition">
                  Squad Finder
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition">
                  About &amp; Core Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Compact Social Media & Contact Group */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm tracking-wide">Connect</h4>
            <div className="flex items-center gap-2.5 text-slate-400">
              <a
                href={LAUNCHBYTE_SOCIALS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LaunchByte on LinkedIn"
                title="LinkedIn"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center hover:text-white hover:border-violet-400/50 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={LAUNCHBYTE_SOCIALS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LaunchByte on Instagram"
                title="Instagram"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center hover:text-white hover:border-violet-400/50 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={LAUNCHBYTE_SOCIALS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LaunchByte WhatsApp Community"
                title="WhatsApp Community"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center hover:text-emerald-300 hover:border-emerald-400/50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${LAUNCHBYTE_SOCIALS.email}`}
                aria-label="Email LaunchByte"
                title={LAUNCHBYTE_SOCIALS.email}
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center hover:text-cyan-300 hover:border-cyan-400/50 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              <a href={`mailto:${LAUNCHBYTE_SOCIALS.email}`} className="hover:text-cyan-300 transition">
                {LAUNCHBYTE_SOCIALS.email}
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} LaunchByte. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-slate-300 transition">
              About
            </Link>
            <Link href="/host" className="hover:text-slate-300 transition">
              Host an Event
            </Link>
            <Link href="/contributor/request-access" className="hover:text-slate-300 transition">
              Contributor Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
