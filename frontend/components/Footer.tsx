import React from "react";
import Link from "next/link";
import { Sparkles, Github, Twitter, Linkedin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-violet-900/30 bg-[#050510] text-slate-400 text-sm py-14 overflow-hidden">
      {/* Top Hairline Glowing Gradient Accent */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-violet-900/20">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-violet-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-cyan-200" />
              </div>
              <span className="font-bold text-lg text-white">
                Launch<span className="text-[#A78BFA]">Byte</span>
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm text-xs sm:text-sm leading-relaxed">
              The high-trust discovery and hosting platform for hackathons, fellowships,
              internships, and workshops. Built to beat traditional platforms on speed,
              authenticity, and transparency.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
              <span>All Systems Operational // Sector 01.LB</span>
            </div>
          </div>

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
                  Hackathons & Sprints
                </Link>
              </li>
              <li>
                <Link href="/teams" className="text-slate-400 hover:text-white transition">
                  Squad Finder
                </Link>
              </li>
              <li>
                <Link href="/network" className="text-slate-400 hover:text-white transition">
                  Builder Network
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition">
                  About & Team
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm tracking-wide">Community & Socials</h4>
            <div className="flex gap-3 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-xl bg-[#09091B] border border-slate-800 flex items-center justify-center hover:text-white hover:border-violet-500/40 hover:bg-violet-950/40 transition glow-hover"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="w-9 h-9 rounded-xl bg-[#09091B] border border-slate-800 flex items-center justify-center hover:text-white hover:border-violet-500/40 hover:bg-violet-950/40 transition glow-hover"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-xl bg-[#09091B] border border-slate-800 flex items-center justify-center hover:text-white hover:border-violet-500/40 hover:bg-violet-950/40 transition glow-hover"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
              Open source & community-driven. Built with passion for campus builders globally.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LaunchByte Technologies Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-slate-400 transition">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-slate-400 transition">
              Terms of Service
            </Link>
            <Link href="/about" className="hover:text-slate-400 transition">
              Trust & Safety
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
