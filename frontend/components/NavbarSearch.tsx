"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Loader2,
  Briefcase,
  Calendar,
  UsersRound,
  UserSearch,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";
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

export function NavbarSearch() {
  const router = useRouter();
  const { isLight, mounted } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shortcutLabel, setShortcutLabel] = useState("⌘K");

  const { groups, flatItems, loading, hasQuery } = useGlobalSearch(query, isOpen);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
      setShortcutLabel(isMac ? "⌘K" : "Ctrl K");
    }
  }, []);

  // Handle Cmd+K / Ctrl+K on desktop (>= 1024px) to focus inline search
  useEffect(() => {
    function onGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (typeof window !== "undefined" && window.innerWidth >= 1024) {
          e.preventDefault();
          setIsOpen(true);
          inputRef.current?.focus();
        }
      }
    }
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, flatItems.length]);

  function navigateTo(href: string) {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const selected = flatItems[selectedIndex];
      if (selected && (hasQuery || isOpen)) {
        navigateTo(selected.href);
      } else if (query.trim()) {
        navigateTo(`/opportunities?q=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  let runningIndex = -1;

  return (
    <div ref={containerRef} className="relative hidden lg:flex items-center">
      {/* Expanding Input Shell */}
      <div
        className={`relative flex items-center h-9 rounded-xl border transition-all duration-300 ease-out ${
          isOpen
            ? mounted && isLight
              ? "w-64 xl:w-80 bg-white border-violet-500 shadow-[0_0_24px_rgba(117,82,217,0.2)] ring-2 ring-violet-500/20"
              : "w-64 xl:w-80 bg-[#0B0B1E] border-violet-500/70 shadow-[0_0_24px_rgba(124,58,237,0.28)] ring-2 ring-violet-500/20"
            : mounted && isLight
              ? "w-44 xl:w-56 bg-slate-100/90 border-slate-300 hover:border-violet-400 hover:bg-slate-50 shadow-sm"
              : "w-44 xl:w-56 bg-[#09091B]/85 border-slate-800/90 hover:border-violet-500/40 hover:bg-[#0D0D22] shadow-sm"
        }`}
      >
        <div className="pl-3 pr-2 flex items-center pointer-events-none shrink-0">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
          ) : (
            <Search
              className={`w-3.5 h-3.5 transition-colors duration-200 ${
                isOpen
                  ? "text-violet-500"
                  : mounted && isLight
                    ? "text-slate-500"
                    : "text-slate-400"
              }`}
            />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="navbar-search-results"
          aria-label="Search LaunchByte"
          placeholder={isOpen ? "Search hackathons, teams, people..." : "Search..."}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full h-full bg-transparent text-xs sm:text-[13px] focus:outline-none pr-2 ${
            mounted && isLight
              ? "text-slate-900 placeholder:text-slate-400"
              : "text-slate-100 placeholder:text-slate-500"
          }`}
        />

        {hasQuery ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className={`mr-2 p-1 rounded-md transition shrink-0 ${
              mounted && isLight
                ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd
            className={`mr-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono border shrink-0 transition-opacity duration-200 select-none ${
              isOpen
                ? mounted && isLight
                  ? "bg-violet-50 text-violet-700 border-violet-200"
                  : "bg-violet-950/60 text-violet-300 border-violet-500/30"
                : mounted && isLight
                  ? "bg-slate-200/80 text-slate-600 border-slate-300"
                  : "bg-slate-900/90 text-slate-400 border-slate-700/80"
            }`}
          >
            {shortcutLabel}
          </kbd>
        )}
      </div>

      {/* Categorized Search Dropdown */}
      {isOpen && (
        <div
          id="navbar-search-results"
          role="listbox"
          className={`absolute right-0 top-[calc(100%+0.625rem)] w-[400px] xl:w-[440px] max-w-[calc(100vw-2rem)] rounded-2xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 ${
            mounted && isLight
              ? "border-slate-200 bg-white/95 backdrop-blur-2xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.15),0_0_32px_rgba(117,82,217,0.08)]"
              : "border-violet-500/30 bg-[#08081A]/95 backdrop-blur-2xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85),0_0_32px_rgba(124,58,237,0.18)]"
          }`}
        >
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-2">
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
              <div className="py-8 px-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-500/20 flex items-center justify-center mx-auto">
                  <Search className="w-4 h-4 text-violet-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-200">
                    No matching results for &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="text-xs text-slate-500">
                    Try another keyword or search the full opportunities catalog.
                  </p>
                </div>
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo(`/opportunities?q=${encodeURIComponent(query.trim())}`)
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
                  <div className="px-2.5 pt-1.5 pb-1 flex items-center justify-between">
                    <span className={`text-[10px] font-semibold tracking-wider uppercase ${mounted && isLight ? "text-violet-700" : "text-slate-400"}`}>
                      {group.category}
                    </span>
                    {!hasQuery && (
                      <span className="text-[10px] text-slate-500">
                        Type 2+ chars for live results
                      </span>
                    )}
                  </div>

                  {group.items.map((item: SearchResultItem) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const isSelected = idx === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => navigateTo(item.href)}
                        className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? mounted && isLight
                              ? "bg-violet-100 border border-violet-200 text-violet-900 shadow-sm"
                              : "bg-violet-600/20 border border-violet-500/40 text-white shadow-sm"
                            : mounted && isLight
                              ? "text-slate-700 hover:bg-slate-100/80 border border-transparent"
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
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                isSelected
                                  ? mounted && isLight
                                    ? "bg-violet-200 border-violet-300"
                                    : "bg-violet-950/80 border-violet-500/40"
                                  : mounted && isLight
                                    ? "bg-slate-100 border-slate-200"
                                    : "bg-slate-900/90 border-white/[0.06]"
                              }`}
                            >
                              {getCategoryIcon(item.category)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${mounted && isLight ? "text-slate-900" : "text-slate-100"}`}>
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p className={`text-xs truncate ${mounted && isLight ? "text-slate-500" : "text-slate-400"}`}>
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wide border ${
                              mounted && isLight
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-slate-900/90 text-slate-400 border-slate-800"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          <ArrowRight
                            className={`w-3.5 h-3.5 transition-all ${
                              isSelected
                                ? "opacity-100 translate-x-0 text-violet-500"
                                : "opacity-0 -translate-x-1"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer Hints + Full Search Action */}
          <div className={`px-3.5 py-2 border-t flex items-center justify-between text-[11px] ${
            mounted && isLight
              ? "bg-slate-50 border-slate-200 text-slate-500"
              : "bg-[#050512]/90 border-white/[0.06] text-slate-500"
          }`}>
            <div className="flex items-center gap-3 font-mono">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
            {query.trim() ? (
              <button
                type="button"
                onClick={() =>
                  navigateTo(`/opportunities?q=${encodeURIComponent(query.trim())}`)
                }
                className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 font-medium transition"
              >
                <span>All results</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-violet-600 font-medium">LaunchByte Search</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
