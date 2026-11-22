import React from "react";
import Link from "next/link";
import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 text-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-900">
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-white">
                Launch<span className="text-brand-400">Byte</span>
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
              The high-trust discovery and hosting platform for hackathons, fellowships,
              internships, and workshops. Built to beat traditional platforms on speed,
              authenticity, and transparency.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/opportunities" className="hover:text-white transition">
                  All Opportunities
                </Link>
              </li>
              <li>
                <Link href="/hackathons" className="hover:text-white transition">
                  Hackathons
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About & Team
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Community</h4>
            <div className="flex gap-3 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center hover:text-white hover:bg-slate-800 transition"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center hover:text-white hover:bg-slate-800 transition"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center hover:text-white hover:bg-slate-800 transition"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LaunchByte Technologies Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-slate-400">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-slate-400">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
