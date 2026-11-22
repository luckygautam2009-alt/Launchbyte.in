import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Linkedin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-purple-900/20 bg-[#070716] text-slate-400 text-sm py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-purple-950/40">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <Image
                  src="/brand/launchbyte-icon.png"
                  alt="LaunchByte Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(101,31,255,0.6)]"
                />
              </div>
              <span className="font-bold text-xl text-white font-display">
                Launch<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Byte</span>
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
              The high-trust discovery and hosting platform for hackathons, fellowships,
              internships, and workshops. Built to beat traditional platforms on speed,
              authenticity, and transparency.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider text-purple-400">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/hackathons" className="hover:text-purple-300 transition">
                  Hackathons
                </Link>
              </li>
              <li>
                <Link href="/opportunities" className="hover:text-purple-300 transition">
                  All Opportunities
                </Link>
              </li>
              <li>
                <Link href="/teams" className="hover:text-purple-300 transition">
                  Teammate Match
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-purple-300 transition">
                  Project Showcase
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-purple-300 transition">
                  About LaunchByte
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider text-purple-400">
              Community & Social
            </h4>
            <div className="flex gap-3 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-center hover:text-white hover:border-purple-500/50 hover:bg-slate-800 transition shadow-sm"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-center hover:text-white hover:border-purple-500/50 hover:bg-slate-800 transition shadow-sm"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-center hover:text-white hover:border-purple-500/50 hover:bg-slate-800 transition shadow-sm"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LaunchByte Technologies Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-slate-300 transition">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-slate-300 transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
