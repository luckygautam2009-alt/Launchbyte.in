"use client";

import React, { useEffect, useState } from "react";
import { X, Play, ShieldCheck, Users, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const [activeTab, setActiveTab] = useState<"tour" | "trust" | "teams">("tour");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-3xl border border-purple-500/30 bg-[#0B0B1D] shadow-[0_0_60px_rgba(101,31,255,0.3)] overflow-hidden text-left"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 bg-purple-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Play className="w-4 h-4 fill-purple-400" />
            </div>
            <div>
              <h2 id="video-modal-title" className="text-base font-bold text-white">
                LaunchByte Platform Walkthrough
              </h2>
              <p className="text-xs text-slate-400">Experience the future of hackathons</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Tabs */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("tour")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "tour"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Cosmic Platform Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trust")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "trust"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Verified Trust Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "teams"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Instant Teammate Match
          </button>
        </div>

        {/* Dynamic Interactive Preview Canvas */}
        <div className="p-6 space-y-6">
          {activeTab === "tour" && (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-purple-950/60 via-[#0E0E28] to-slate-950 border border-purple-800/30 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-200 mb-3 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                  <Zap className="w-8 h-8 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-white">2-Minute Host & Discover Experience</h3>
                <p className="text-sm text-slate-300 max-w-md mt-2">
                  LaunchByte eliminates the friction of discovering competitions, managing team rosters, and verifying prize pools with automated blockchain-grade escrow.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-slate-300">Fast 2-Min Event Publishing</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-slate-300">Offline-Ready QR Scanning</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-slate-300">Real-Time Team Formation</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "trust" && (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-indigo-950/60 via-[#0B0B24] to-slate-950 border border-indigo-800/30 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200 mb-3 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                  <ShieldCheck className="w-8 h-8 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold text-white">Trust Scores & Organizer Checks</h3>
                <p className="text-sm text-slate-300 max-w-md mt-2">
                  Never get ghosted again. Organizers verify identity, company registration, and prize backing before listings receive the verified badge.
                </p>
              </div>
            </div>
          )}

          {activeTab === "teams" && (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-cyan-950/60 via-[#0A1628] to-slate-950 border border-cyan-800/30 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-200 mb-3 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                  <Users className="w-8 h-8 text-cyan-300" />
                </div>
                <h3 className="text-xl font-bold text-white">Role-Based Teammate Matching</h3>
                <p className="text-sm text-slate-300 max-w-md mt-2">
                  Filter by complementary skills, frontend/backend/design specializations, and availability to assemble winning squads in seconds.
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
            >
              Close
            </button>
            <Link
              href="/opportunities"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30"
            >
              Explore Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
