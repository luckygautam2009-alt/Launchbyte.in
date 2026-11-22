"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  Briefcase,
  UsersRound,
  UserSearch,
  FolderGit2,
  Bookmark,
  Plus,
  ArrowRight,
  X,
} from "lucide-react";
import { scaleIn, fadeIn } from "@/lib/motion";

interface CommandItem {
  id: string;
  title: string;
  category: "Opportunities" | "Events" | "Teams" | "People" | "Actions";
  href: string;
  icon: React.ReactNode;
  subtitle?: string;
}

const STATIC_COMMANDS: CommandItem[] = [
  {
    id: "action-new-team",
    title: "Create a New Team",
    category: "Actions",
    href: "/teams/new",
    icon: <Plus className="w-4 h-4 text-brand-400" />,
    subtitle: "Form a team for an upcoming hackathon",
  },
  {
    id: "action-new-project",
    title: "Start a Collaborative Project",
    category: "Actions",
    href: "/projects/new",
    icon: <FolderGit2 className="w-4 h-4 text-accent-400" />,
    subtitle: "Recruit builders with shared tech stack",
  },
  {
    id: "action-saved",
    title: "View Saved Bookmarks",
    category: "Actions",
    href: "/saved",
    icon: <Bookmark className="w-4 h-4 text-amber-400" />,
  },
  {
    id: "nav-hackathons",
    title: "Browse All Hackathons",
    category: "Events",
    href: "/events",
    icon: <Calendar className="w-4 h-4 text-indigo-400" />,
  },
  {
    id: "nav-opportunities",
    title: "Browse Internships & Fellowships",
    category: "Opportunities",
    href: "/opportunities",
    icon: <Briefcase className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: "nav-people",
    title: "Find Teammates & Match Skills",
    category: "People",
    href: "/people",
    icon: <UserSearch className="w-4 h-4 text-purple-400" />,
  },
  {
    id: "nav-teams",
    title: "Discover Hackathon Teams",
    category: "Teams",
    href: "/teams",
    icon: <UsersRound className="w-4 h-4 text-teal-400" />,
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global key listener for Cmd+K and Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return STATIC_COMMANDS;
    const q = query.toLowerCase();
    return STATIC_COMMANDS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleSelect(item: CommandItem) {
    setIsOpen(false);
    setQuery("");
    router.push(item.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex]);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-750 shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 border-b border-slate-800">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search opportunities, events, teams, people... (↑↓ to navigate)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-14 bg-transparent px-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No matching opportunities, teams, or actions found for "{query}".
                </div>
              ) : (
                filteredCommands.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition select-none ${
                        isSelected
                          ? "bg-brand-600/20 border border-brand-500/40 text-white"
                          : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-sm font-semibold flex items-center gap-2">
                            <span>{item.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                              {item.category}
                            </span>
                          </div>
                          {item.subtitle && (
                            <p className="text-xs text-slate-400 line-clamp-1">{item.subtitle}</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-4 h-4 transition ${
                          isSelected ? "opacity-100 translate-x-0 text-brand-400" : "opacity-0 -translate-x-1"
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer shortcut hints */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-2">
                <span>[↑↓] Navigate</span>
                <span>[↵] Select</span>
                <span>[ESC] Close</span>
              </div>
              <span className="text-brand-400">LaunchByte Global Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
