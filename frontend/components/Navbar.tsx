"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Menu,
  X,
  Sparkles,
  Bookmark,
  PlusCircle,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Users,
  MessageSquare,
  FolderGit2,
  UsersRound,
  UserSearch,
  Mail,
  UserCircle,
  Search,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  requiredRole?: string[];
  comingSoon?: boolean;
  hidden?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Events", href: "/events" },
  { label: "Hackathons", href: "/hackathons" },
  { label: "Teams", href: "/teams" },
  { label: "Network", href: "/network" },
  { label: "Projects", href: "/projects" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => !item.hidden);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            Launch<span className="text-brand-400">Byte</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800/80 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Global Search Shortcut */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition select-none cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Search...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">⌘K</kbd>
        </button>

        {/* Right side Auth / User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/messages"
                aria-label="Messages"
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
                title="Messages"
              >
                <MessageSquare className="w-5 h-5" />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-label="User profile menu"
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-all text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-xs">
                    {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate text-slate-200 font-medium">
                    {user.full_name || user.email.split("@")[0]}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl py-2 z-50 text-sm text-slate-300 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="font-semibold text-white truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-brand-950 text-brand-400 border border-brand-800/50">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href="/profile/edit"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <UserCircle className="w-4 h-4 text-violet-400" />
                      Edit Profile
                    </Link>

                    <Link
                      href="/me/teams"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <UsersRound className="w-4 h-4 text-teal-400" />
                      My Teams
                    </Link>

                    <Link
                      href="/me/invites"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <Mail className="w-4 h-4 text-amber-400" />
                      Invites
                    </Link>

                    <Link
                      href="/people"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <UserSearch className="w-4 h-4 text-pink-400" />
                      Find Teammates
                    </Link>

                    <Link
                      href="/network"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <Users className="w-4 h-4 text-brand-400" />
                      My Network
                    </Link>

                    <Link
                      href="/messages"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      Messages & Chat
                    </Link>

                    <Link
                      href="/projects"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <FolderGit2 className="w-4 h-4 text-emerald-400" />
                      Projects
                    </Link>

                    <Link
                      href="/saved"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <Bookmark className="w-4 h-4 text-brand-400" />
                      Saved Opportunities
                    </Link>

                  {(user.role === "organizer" || user.role === "admin") && (
                    <Link
                      href="/dashboard/opportunities"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      Organizer Postings
                    </Link>
                  )}

                  {(user.role === "moderator" || user.role === "admin") && (
                    <Link
                      href="/admin/moderation"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Admin Moderation
                    </Link>
                  )}

                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-400 hover:bg-rose-950/30 transition text-left"
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
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col gap-1">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-base font-medium ${
                  pathname === item.href
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1 text-xs text-slate-400">
                  Signed in as <span className="text-white font-medium">{user.email}</span>
                </div>
                <Link
                  href="/network"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-slate-300 hover:text-white"
                >
                  My Network
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-slate-300 hover:text-white"
                >
                  Messages & Chat
                </Link>
                <Link
                  href="/projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-slate-300 hover:text-white"
                >
                  Projects
                </Link>
                <Link
                  href="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-slate-300 hover:text-white"
                >
                  Saved Opportunities
                </Link>
                {(user.role === "organizer" || user.role === "admin") && (
                  <Link
                    href="/dashboard/opportunities"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-slate-300 hover:text-white"
                  >
                    Organizer Postings
                  </Link>
                )}
                {(user.role === "moderator" || user.role === "admin") && (
                  <Link
                    href="/admin/moderation"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-slate-300 hover:text-white"
                  >
                    Admin Moderation
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:text-rose-300"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium border border-slate-700 rounded-xl text-slate-200"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium bg-brand-600 rounded-xl text-white"
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
