"use client";

import React, { useState } from "react";
import { SITE_CONTENT, FaqItem } from "@/lib/siteContent";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import { Reveal } from "./HomeMotion";

export default function FaqAccordionSection() {
  const faqs: FaqItem[] = SITE_CONTENT.faqs;
  const [openId, setOpenId] = useState<string | null>("faq-1");

  if (!faqs || faqs.length === 0) {
    return (
      <section className="relative py-16 bg-[#050510] text-center border-t border-slate-800/40">
        <p className="text-xs font-mono text-slate-500">No FAQs available.</p>
      </section>
    );
  }

  const toggle = (id: string) => {
    setOpenId((curr) => (curr === id ? null : id));
  };

  return (
    <section className="relative py-20 sm:py-28 bg-[#050510] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-space-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <Reveal>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono uppercase tracking-widest text-[#A78BFA] backdrop-blur-md">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Common Questions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1]">
              Everything you need to know about participating, matching with squads, and hosting events.
            </p>
          </div>
        </Reveal>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openId === faq.id;
            return (
              <Reveal key={faq.id} delay={0.06 * idx}>
                <div
                  className={`rounded-2xl glass-card transition-all duration-200 overflow-hidden ${
                    isOpen ? "border-violet-500/50 bg-[#09091B]/95 shadow-lg shadow-violet-950/20" : "hover:border-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    <span className="text-base sm:text-lg font-bold text-white pr-2">
                      {faq.question}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-xl bg-violet-950/70 border border-violet-500/30 flex items-center justify-center text-cyan-300 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 bg-violet-900/80" : ""
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-xs sm:text-sm text-[#CBD5E1] leading-relaxed border-t border-slate-800/60 pt-4 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
