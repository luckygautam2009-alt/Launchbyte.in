"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  Briefcase,
  UsersRound,
  UserSearch,
  Sparkles,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { scaleIn, fadeIn } from "@/lib/motion";
import { Avatar } from "@/components/ui/Avatar";
import {
  SearchCategory,
  SearchResultItem,
  useGlobalSearch,
} from "@/lib/useGlobalSearch";
import { useTheme } from "@/lib/theme-context";

function getCategoryIcon(category: SearchCategory) {
  switch (category) {
    case "Opportunities":
      return <Briefcase className="w-4 h-4 text-emerald-400" />;
    case "Events":
      return <Calendar className="w-4 h-4 text-indigo-400" />;
    case "Teams":
      return <UsersRound className="w-4 h-4 text-cyan-400" />;
    case "People":
      return <UserSearch className="w-4 h-4 text-violet-400" />;
    case "Quick Actions":
    default:
      return <Sparkles className="w-4 h-4 text-violet-400" />;
  }
}

export function CommandPalette() {
  const router = useRouter();
  const { isLight, mounted } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { groups, flatItems, loading, hasQuery } = useGlobalSearch(query, isOpen);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        // Desktop >= 1024px uses inline NavbarSearch; smaller screens use CommandPalette
        if (typeof window !== "undefined" && window.innerWidth >= 1024) {
          return;
        }
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    function handleCustomOpen() {
      setIsOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("launchbyte:open-search", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("launchbyte:open-search", handleCustomOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, flatItems.length]);

  function handleSelect(href: string) {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = flatItems[selectedIndex];
      if (selected) {
        handleSelect(selected.href);
      } else if (query.trim()) {
        handleSelect(`/opportunities?q=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => setIsOpen(false)}
            className={`fixed inset-0 backdrop-blur-md ${
              mounted && isLight ? "bg-slate-900/40" : "bg-[#04040C]/80"
            }`}
          />

          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative w-full max-w-xl rounded-2xl border overflow-hidden z-10 ${
              mounted && isLight
                ? "bg-white/95 border-slate-200 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.18),0_0_32px_rgba(117,82,217,0.1)]"
                : "bg-[#09091B]/95 border-violet-500/35 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9),0_0_40px_rgba(124,58,237,0.2)]"
            }`}
          >
            {/* Search Input Bar */}
            <div className={`flex items-center px-4 border-b ${
              mounted && isLight ? "border-slate-100" : "border-white/[0.08]"
            }`}>
              {loading ? (
                <Loader2 className="w-5 h-5 text-violet-500 shrink-0 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-violet-500 shrink-0" />
              )}
              <input
                autoFocus
                type="text"
                placeholder="Search hackathons, teams, people..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full h-14 bg-transparent px-3 text-sm focus:outline-none ${
                  mounted && isLight ? "text-slate-900 placeholder-slate-400" : "text-slate-100 placeholder-slate-500"
                }`}
              />
              {hasQuery && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className={`p-1.5 mr-1 rounded-lg transition ${
                    mounted && isLight ? "text-slate-400 hover:text-slate-700" : "text-slate-400 hover:text-white"
                  }`}
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`px-2 py-1 rounded-lg text-xs font-mono border ${
                  mounted && isLight
                    ? "text-slate-600 bg-slate-100 border-slate-200 hover:bg-slate-200"
                    : "text-slate-400 hover:text-white bg-white/[0.04] border-white/[0.06]"
                }`}
                aria-label="Close search"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-2">
              {loading && flatItems.length === 0 ? (
                <div className="p-2 space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] animate-pulse"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-2/3 bg-white/[0.08] rounded" />
                        <div className="h-2.5 w-1/2 bg-white/[0.04] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : flatItems.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm text-slate-300">
                    No matching results found for &ldquo;{query.trim()}&rdquo;.
                  </p>
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSelect(`/opportunities?q=${encodeURIComponent(query.trim())}`)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-xs font-medium text-violet-200 transition"
                    >
                      <span>Search all opportunities</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.category} className="space-y-1">
                    <div className="px-2.5 pt-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                      {group.category}
                    </div>
                    {group.items.map((item: SearchResultItem) => {
                      runningIndex += 1;
                      const idx = runningIndex;
                      const isSelected = idx === selectedIndex;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item.href)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl cursor-pointer transition text-left select-none ${
                            isSelected
                              ? mounted && isLight
                                ? "bg-violet-100 border border-violet-200 text-violet-900"
                                : "bg-violet-600/20 border border-violet-500/40 text-white"
                              : mounted && isLight
                                ? "text-slate-700 hover:bg-slate-100 border border-transparent"
                                : "text-slate-300 hover:bg-white/[0.04] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.category === "People" ? (
                              <Avatar
                                src={item.avatarUrl}
                                name={item.title}
                                size="sm"
                                className="shrink-0 border border-violet-500/30"
                              />
                            ) : (
                              <div className={`p-2 rounded-lg shrink-0 border ${
                                mounted && isLight
                                  ? "bg-slate-100 border-slate-200"
                                  : "bg-slate-900/90 border-white/[0.06]"
                              }`}>
                                {getCategoryIcon(item.category)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className={`text-sm font-semibold truncate ${mounted && isLight ? "text-slate-900" : "text-slate-100"}`}>
                                {item.title}
                              </div>
                              {item.subtitle && (
                                <p className={`text-xs truncate ${mounted && isLight ? "text-slate-500" : "text-slate-400"}`}>
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <ArrowRight
                            className={`w-4 h-4 shrink-0 transition ${
                              isSelected
                                ? "opacity-100 translate-x-0 text-violet-500"
                                : "opacity-0 -translate-x-1"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer shortcut hints */}
            <div className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
              mounted && isLight
                ? "bg-slate-50 border-slate-200 text-slate-500"
                : "bg-[#050512]/90 border-white/[0.06] text-slate-500"
            }`}>
              <div className="flex items-center gap-3">
                <span>[↑↓] Navigate</span>
                <span>[↵] Select</span>
                <span>[ESC] Close</span>
              </div>
              <span className="text-violet-600">LaunchByte Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
