"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Avatar } from "@/components/ui/Avatar";
import { NavbarSearch } from "@/components/NavbarSearch";
import NotificationBell from "@/components/NotificationBell";
import {
  Menu,
  X,
  Bookmark,
  PlusCircle,
  ShieldCheck,
  LogOut,
  Users,
  MessageSquare,
  FolderGit2,
  UsersRound,
  UserSearch,
  Mail,
  UserCircle,
  Search,
  ChevronDown,
  Plus,
  Compass,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

const PRIMARY_NAV_BEFORE_TEAMS: NavItem[] = [
  { label: "Explore", href: "/opportunities" },
  { label: "Hackathons", href: "/hackathons" },
];

const PRIMARY_NAV_AFTER_TEAMS: NavItem[] = [
  { label: "Host an Event", href: "/host" },
  { label: "Events", href: "/events" },
  { label: "Network", href: "/network" },
  { label: "About", href: "/about" },
];

interface TeamMenuItem {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accentClass: string;
}

const TEAM_MENU_ITEMS: TeamMenuItem[] = [
  {
    label: "Find a Team",
    description: "Discover existing squads looking for members",
    href: "/teams",
    icon: <Compass className="w-4 h-4 text-cyan-400" />,
    accentClass: "group-hover:border-cyan-500/40 group-hover:bg-cyan-950/50",
  },
  {
    label: "Create a Team",
    description: "Launch your own team for an upcoming build",
    href: "/teams/new",
    icon: <Plus className="w-4 h-4 text-violet-400" />,
    accentClass: "group-hover:border-violet-500/40 group-hover:bg-violet-950/60",
  },
  {
    label: "My Teams",
    description: "View and manage teams you joined or created",
    href: "/me/teams",
    icon: <UsersRound className="w-4 h-4 text-indigo-400" />,
    accentClass: "group-hover:border-indigo-500/40 group-hover:bg-indigo-950/50",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { isLight, toggleTheme, mounted } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTeamsOpen, setMobileTeamsOpen] = useState(true);
  const [teamsDropdownOpen, setTeamsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const teamsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const teamsHoverTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setTeamsDropdownOpen(false);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Outside click and Escape handling for dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        teamsDropdownRef.current &&
        !teamsDropdownRef.current.contains(e.target as Node)
      ) {
        setTeamsDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTeamsDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isTeamsActive =
    pathname.startsWith("/teams") || pathname.startsWith("/me/teams");

  function openTeamsWithIntent() {
    if (teamsHoverTimeoutRef.current) {
      window.clearTimeout(teamsHoverTimeoutRef.current);
      teamsHoverTimeoutRef.current = null;
    }
    setTeamsDropdownOpen(true);
  }

  function closeTeamsWithDelay() {
    if (teamsHoverTimeoutRef.current) {
      window.clearTimeout(teamsHoverTimeoutRef.current);
    }
    teamsHoverTimeoutRef.current = window.setTimeout(() => {
      setTeamsDropdownOpen(false);
    }, 140);
  }

  function openMobileOrTabletSearch() {
    window.dispatchEvent(new CustomEvent("launchbyte:open-search"));
  }

  function renderNavLink(item: NavItem) {
    const isActive =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-[13px] xl:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
          isActive
            ? mounted && isLight
              ? "bg-violet-100 text-violet-800 border border-violet-300 shadow-sm"
              : "bg-violet-950/75 text-white border border-violet-500/40 shadow-sm shadow-violet-950/40"
            : mounted && isLight
              ? "text-slate-700 hover:text-slate-900 hover:bg-violet-50 hover:border-violet-200 border border-transparent"
              : "text-slate-300 hover:text-white hover:bg-violet-950/40 hover:border-violet-500/20 border border-transparent"
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <header
      className={`sticky z-40 transition-all duration-300 ${
        mounted && isLight
          ? scrolled
            ? "top-4 w-[calc(100%-2rem)] max-w-7xl mx-auto rounded-[24px] bg-white/80 backdrop-blur-[14px] border border-white/85 shadow-[0_10px_36px_rgba(23,23,43,0.09)]"
            : "top-4 w-[calc(100%-2rem)] max-w-7xl mx-auto rounded-[24px] bg-white/70 backdrop-blur-[14px] border border-white/75 shadow-[0_8px_32px_rgba(23,23,43,0.06)]"
          : scrolled
            ? "top-0 w-full bg-[#050510]/90 backdrop-blur-xl border-b border-violet-500/20 shadow-xl shadow-black/50"
            : "top-0 w-full bg-[#050510]/60 backdrop-blur-md border-b border-violet-900/15"
      }`}
    >
      {/* Top Hairline Gradient Accent (Dark Mode only) */}
      {(!mounted || !isLight) && (
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/35 to-transparent pointer-events-none" />
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 xl:gap-4 ${
        mounted && isLight
          ? "h-16"
          : "pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))]"
      }`}>
        {/* Official Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg py-1"
          aria-label="LaunchByte Home"
        >
          <div className="relative h-9 sm:h-10 xl:h-[44px] w-auto aspect-[1024/939] flex items-center justify-center">
            <Image
              src="/brand/launchbyte-navbar-logo.png"
              alt="LaunchByte"
              width={1024}
              height={939}
              priority
              className="h-full w-auto object-contain select-none filter drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-0.5 xl:gap-1 min-w-0"
        >
          {PRIMARY_NAV_BEFORE_TEAMS.map(renderNavLink)}

          {/* Teams Dropdown */}
          <div
            ref={teamsDropdownRef}
            className="relative"
            onMouseEnter={openTeamsWithIntent}
            onMouseLeave={closeTeamsWithDelay}
          >
            <button
              type="button"
              onClick={() => setTeamsDropdownOpen((prev) => !prev)}
              aria-expanded={teamsDropdownOpen}
              aria-haspopup="menu"
              className={`inline-flex items-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-xl text-[13px] xl:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isTeamsActive || teamsDropdownOpen
                  ? mounted && isLight
                    ? "bg-violet-100 text-violet-800 border border-violet-300 shadow-sm"
                    : "bg-violet-950/75 text-white border border-violet-500/40 shadow-sm shadow-violet-950/40"
                  : mounted && isLight
                    ? "text-slate-700 hover:text-slate-900 hover:bg-violet-50 hover:border-violet-200 border border-transparent"
                    : "text-slate-300 hover:text-white hover:bg-violet-950/40 hover:border-violet-500/20 border border-transparent"
              }`}
            >
              <span>Teams</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  teamsDropdownOpen ? "rotate-180 text-violet-500" : "text-slate-400"
                }`}
              />
            </button>

            {teamsDropdownOpen && (
              <div
                role="menu"
                aria-label="Teams menu"
                className={`absolute left-0 top-[calc(100%+0.5rem)] w-72 rounded-2xl border p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  mounted && isLight
                    ? "border-slate-200 bg-white/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15),0_0_24px_rgba(117,82,217,0.08)]"
                    : "border-violet-500/30 bg-[#08081A]/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85),0_0_24px_rgba(124,58,237,0.16)]"
                }`}
              >
                <div className={`px-2.5 pt-1 pb-1.5 flex items-center justify-between border-b mb-1.5 ${mounted && isLight ? "border-slate-100" : "border-white/[0.06]"}`}>
                  <span className={`text-[10px] font-semibold tracking-wider uppercase ${mounted && isLight ? "text-violet-700" : "text-violet-300/90"}`}>
                    Teams &amp; Squads
                  </span>
                  <span className={`text-[10px] ${mounted && isLight ? "text-slate-500" : "text-slate-500"}`}>Build together</span>
                </div>

                <div className="space-y-1">
                  {TEAM_MENU_ITEMS.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setTeamsDropdownOpen(false)}
                        className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 ${
                          active
                            ? mounted && isLight
                              ? "bg-violet-100 text-violet-900 border border-violet-200"
                              : "bg-violet-600/20 border border-violet-500/40"
                            : mounted && isLight
                              ? "hover:bg-slate-50 border border-transparent"
                              : "hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            mounted && isLight
                              ? "bg-slate-100 border border-slate-200"
                              : `bg-slate-900/90 border border-white/[0.07] ${item.accentClass}`
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-sm font-semibold ${mounted && isLight ? "text-slate-800 group-hover:text-violet-700" : "text-slate-100 group-hover:text-white"}`}>
                              {item.label}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-violet-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </div>
                          <p className={`text-xs leading-snug mt-0.5 ${mounted && isLight ? "text-slate-500" : "text-slate-400"}`}>
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {PRIMARY_NAV_AFTER_TEAMS.map(renderNavLink)}
        </nav>

        {/* Right Cluster: Search + Auth / Profile */}
        <div className="hidden md:flex items-center gap-2 xl:gap-2.5 shrink-0">
          {/* Desktop Inline Expanding Search */}
          <NavbarSearch />

          {/* Tablet (md..lg) Compact Search Trigger */}
          <button
            type="button"
            onClick={openMobileOrTabletSearch}
            aria-label="Search LaunchByte"
            className="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl bg-[#09091B]/85 border border-slate-800/90 text-slate-400 hover:text-white hover:border-violet-500/40 hover:bg-violet-950/30 transition-all"
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {loading ? (
            <div className="w-28 h-9 rounded-xl bg-slate-800/50 animate-pulse" aria-hidden="true" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/messages"
                aria-label="Messages"
                className={`relative p-2 rounded-xl border transition ${
                  pathname.startsWith("/messages")
                    ? mounted && isLight
                      ? "bg-violet-100 text-violet-900 border-violet-300"
                      : "bg-violet-950/70 text-white border-violet-500/40"
                    : mounted && isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-violet-50 border-transparent hover:border-violet-200"
                      : "text-slate-400 hover:text-white hover:bg-violet-950/40 border-transparent hover:border-violet-500/30"
                }`}
                title="Messages"
              >
                <MessageSquare className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </Link>

              <div ref={profileDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  aria-label="User profile menu"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="menu"
                  className={`flex items-center gap-2 p-1 pr-2.5 rounded-full border transition-all text-sm shadow-md ${
                    mounted && isLight
                      ? "border-slate-200 bg-white/90 hover:bg-slate-50 hover:border-violet-300 text-slate-800"
                      : "border-violet-500/30 bg-[#09091B]/90 hover:bg-violet-950/50 hover:border-violet-500/50 text-slate-200"
                  }`}
                >
                  <Avatar
                    src={user.avatar_url}
                    name={user.full_name || user.email}
                    alt={user.full_name || "User avatar"}
                    size="sm"
                    className="border border-violet-400/30 bg-gradient-to-tr from-[#4F46E5] to-[#8B5CF6] text-white font-semibold shadow-inner"
                  />
                  <span className={`hidden xl:inline max-w-[110px] truncate font-medium text-[13px] ${mounted && isLight ? "text-slate-800" : "text-slate-200"}`}>
                    {user.full_name || user.email.split("@")[0]}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileDropdownOpen && (
                  <div
                    role="menu"
                    className={`absolute right-0 mt-2 w-56 rounded-2xl border backdrop-blur-xl shadow-2xl py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100 ${
                      mounted && isLight
                        ? "border-slate-200 bg-white/95 text-slate-700"
                        : "border-violet-500/30 bg-[#09091B]/95 text-slate-300"
                    }`}
                  >
                    <div className={`px-4 py-2 border-b ${mounted && isLight ? "border-slate-100" : "border-slate-800"}`}>
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className={`font-semibold truncate ${mounted && isLight ? "text-slate-900" : "text-white"}`}>{user.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                        mounted && isLight
                          ? "bg-violet-100 text-violet-800 border border-violet-200"
                          : "bg-violet-950 text-violet-300 border border-violet-800/50"
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href="/profile/edit"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                    >
                      <UserCircle className="w-4 h-4 text-violet-500" />
                      Edit Profile
                    </Link>

                    <Link
                      href="/me/teams"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                    >
                      <UsersRound className="w-4 h-4 text-teal-500" />
                      My Teams
                    </Link>

                    <Link
                      href="/me/invites"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                    >
                      <Mail className="w-4 h-4 text-amber-500" />
                      Invites
                    </Link>

                    <Link
                      href="/people"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                    >
                      <UserSearch className="w-4 h-4 text-pink-500" />
                      Find Teammates
                    </Link>

                    <Link
                      href="/network"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                    >
                      <Users className="w-4 h-4 text-violet-500" />
                      My Network
                    </Link>

                    <Link
                      href="/messages"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                    >
                      <MessageSquare className="w-4 h-4 text-cyan-500" />
                      Messages &amp; Chat
                    </Link>

                    <Link
                      href="/projects"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                    >
                      <FolderGit2 className="w-4 h-4 text-emerald-500" />
                      Projects
                    </Link>

                    <Link
                      href="/saved"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                    >
                      <Bookmark className="w-4 h-4 text-violet-500" />
                      Saved Opportunities
                    </Link>

                    {(user.role === "organizer" || user.role === "admin") && (
                      <Link
                        href="/dashboard/opportunities"
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-500" />
                        Organizer Postings
                      </Link>
                    )}

                    {(user.role === "moderator" || user.role === "admin") && (
                      <Link
                        href="/admin/moderation"
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 transition ${mounted && isLight ? "hover:bg-violet-50 hover:text-violet-900" : "hover:bg-violet-950/50 hover:text-white"}`}
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        Admin Moderation
                      </Link>
                    )}

                    <div className={`border-t mt-1 pt-1 ${mounted && isLight ? "border-slate-100" : "border-slate-800"}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 transition text-left ${mounted && isLight ? "text-rose-600 hover:bg-rose-50" : "text-rose-400 hover:bg-rose-950/30"}`}
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className={`px-3 py-1.5 text-[13px] xl:text-sm font-medium transition rounded-xl whitespace-nowrap ${
                  mounted && isLight
                    ? "text-slate-700 hover:text-violet-700 hover:bg-violet-50"
                    : "text-slate-300 hover:text-white hover:bg-violet-950/30"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-[13px] xl:text-sm font-medium rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#7C3AED] text-white shadow-md shadow-violet-500/25 transition whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>
          )}

          <NotificationBell variant="desktop" />

          {/* Theme Toggle Button (Sun in Dark, Moon in Light) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center shrink-0 ${
              mounted && isLight
                ? "bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-600 shadow-sm"
                : "bg-[#09091B]/85 hover:bg-violet-950/50 border-violet-500/30 text-amber-300 shadow-inner"
            }`}
          >
            {mounted && isLight ? (
              <Moon className="w-[18px] h-[18px] text-violet-700 transition-transform duration-300 hover:-rotate-12" />
            ) : (
              <Sun className="w-[18px] h-[18px] text-amber-300 transition-transform duration-300 hover:rotate-45" />
            )}
          </button>
        </div>

        {/* Mobile Search + Theme Toggle + Hamburger Button */}
        <div className="flex md:hidden items-center gap-1.5">
          <NotificationBell variant="mobile" />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition border ${
              mounted && isLight
                ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-violet-950/40 border-white/[0.06] hover:border-violet-500/30 bg-[#09091B]/70"
            }`}
          >
            {mounted && isLight ? <Moon className="w-5 h-5 text-violet-700" /> : <Sun className="w-5 h-5 text-amber-300" />}
          </button>
          <button
            type="button"
            onClick={openMobileOrTabletSearch}
            aria-label="Search LaunchByte"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition border ${
              mounted && isLight
                ? "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                : "text-slate-300 hover:text-white hover:bg-violet-950/40 border-white/[0.06] hover:border-violet-500/30 bg-[#09091B]/70"
            }`}
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition border ${
              mounted && isLight
                ? "text-slate-700 hover:text-slate-900 border-transparent hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-violet-950/40 border-transparent hover:border-violet-500/30"
            }`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={`md:hidden max-h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-y-auto border-b backdrop-blur-xl px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-3 ${
          mounted && isLight
            ? "border-slate-200 bg-white/95 text-slate-900"
            : "border-violet-900/30 bg-[#070719]/95 text-slate-100"
        }`}>
          {/* Quick Search Bar in Mobile Drawer */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              openMobileOrTabletSearch();
            }}
            className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition ${
              mounted && isLight
                ? "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                : "bg-[#0B0B1E] border-violet-500/25 text-slate-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-violet-500" />
              <span>Search hackathons, teams, people...</span>
            </span>
          </button>

          <div className="flex flex-col gap-1">
            {PRIMARY_NAV_BEFORE_TEAMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`min-h-[44px] flex items-center px-3 py-2.5 rounded-xl text-base font-medium transition ${
                  pathname.startsWith(item.href)
                    ? mounted && isLight
                      ? "bg-violet-100 text-violet-900 border border-violet-300"
                      : "bg-violet-950/80 text-white border border-violet-500/40"
                    : mounted && isLight
                      ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                      : "text-slate-300 hover:text-white hover:bg-violet-950/30"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Teams Collapsible Group */}
            <div className={`rounded-xl border overflow-hidden my-1 ${
              mounted && isLight
                ? "border-slate-200 bg-slate-50/80"
                : "border-violet-500/20 bg-violet-950/20"
            }`}>
              <button
                type="button"
                onClick={() => setMobileTeamsOpen((prev) => !prev)}
                aria-expanded={mobileTeamsOpen}
                className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-base font-medium ${
                  mounted && isLight ? "text-slate-900" : "text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <UsersRound className="w-4 h-4 text-violet-500" />
                  <span>Teams</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    mobileTeamsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {mobileTeamsOpen && (
                <div className="px-2 pb-2 space-y-1">
                  {TEAM_MENU_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`min-h-[44px] flex items-center gap-3 px-2.5 py-2 rounded-lg transition ${
                        pathname === item.href
                          ? mounted && isLight
                            ? "bg-violet-100 text-violet-900 border border-violet-200"
                            : "bg-violet-600/25 text-white border border-violet-500/40"
                          : mounted && isLight
                            ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                            : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        mounted && isLight ? "bg-white border border-slate-200" : "bg-slate-900/90 border border-white/[0.06]"
                      }`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className={`text-[11px] truncate ${mounted && isLight ? "text-slate-500" : "text-slate-400"}`}>
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {PRIMARY_NAV_AFTER_TEAMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`min-h-[44px] flex items-center px-3 py-2.5 rounded-xl text-base font-medium transition ${
                  pathname.startsWith(item.href)
                    ? mounted && isLight
                      ? "bg-violet-100 text-violet-900 border border-violet-300"
                      : "bg-violet-950/80 text-white border border-violet-500/40"
                    : mounted && isLight
                      ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                      : "text-slate-300 hover:text-white hover:bg-violet-950/30"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className={`pt-4 border-t ${mounted && isLight ? "border-slate-200" : "border-slate-800"}`}>
            {loading ? (
              <div className="h-11 rounded-xl bg-slate-800/40 animate-pulse" aria-hidden="true" />
            ) : user ? (
              <div className="space-y-2">
                <div className={`px-3 py-1 text-xs ${mounted && isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Signed in as <span className={`font-medium ${mounted && isLight ? "text-slate-900" : "text-white"}`}>{user.email}</span>
                </div>
                <Link
                  href="/network"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition ${mounted && isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100" : "text-slate-300 hover:text-white hover:bg-violet-950/30"}`}
                >
                  My Network
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition ${mounted && isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100" : "text-slate-300 hover:text-white hover:bg-violet-950/30"}`}
                >
                  Messages &amp; Chat
                </Link>
                <Link
                  href="/projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition ${mounted && isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100" : "text-slate-300 hover:text-white hover:bg-violet-950/30"}`}
                >
                  Projects
                </Link>
                <Link
                  href="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition ${mounted && isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100" : "text-slate-300 hover:text-white hover:bg-violet-950/30"}`}
                >
                  Saved Opportunities
                </Link>
                {(user.role === "organizer" || user.role === "admin") && (
                  <Link
                    href="/dashboard/opportunities"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg transition ${mounted && isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100" : "text-slate-300 hover:text-white hover:bg-violet-950/30"}`}
                  >
                    Organizer Postings
                  </Link>
                )}
                {(user.role === "moderator" || user.role === "admin") && (
                  <Link
                    href="/admin/moderation"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg transition ${mounted && isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100" : "text-slate-300 hover:text-white hover:bg-violet-950/30"}`}
                  >
                    Admin Moderation
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full min-h-[44px] flex items-center justify-center text-center py-2.5 text-sm font-medium rounded-xl transition ${
                    mounted && isLight
                      ? "border border-slate-300 text-slate-800 bg-slate-100 hover:bg-slate-200"
                      : "border border-violet-500/30 text-slate-200 bg-violet-950/30"
                  }`}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[44px] flex items-center justify-center text-center py-2.5 text-sm font-medium bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] rounded-xl text-white shadow-md shadow-violet-500/30"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
