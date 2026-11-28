"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Trophy,
  UsersRound,
  FolderGit2,
  Bookmark,
  UserCircle,
  ShieldCheck,
  Loader2,
  ArrowRight,
  MailCheck,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-700 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      title: "Explore Opportunities",
      desc: "Browse verified hackathons, fellowships, and competitions.",
      href: "/opportunities",
      icon: Trophy,
      color: "text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Squads & Teams",
      desc: "Find teammates, create a squad, or manage invites.",
      href: "/teams",
      icon: UsersRound,
      color: "text-violet-700 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    {
      title: "Projects",
      desc: "Showcase your GitHub builds and discover student projects.",
      href: "/projects",
      icon: FolderGit2,
      color: "text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Saved & Registrations",
      desc: "View bookmarked opportunities and event registrations.",
      href: "/saved",
      icon: Bookmark,
      color: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Edit Profile",
      desc: "Update your avatar, skills, bio, and social links.",
      href: "/profile/edit",
      icon: UserCircle,
      color: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  if (user.role === "admin" || user.role === "moderator") {
    cards.push({
      title: "Admin Moderation",
      desc: "Review event submissions and moderate platform listings.",
      href: "/admin/moderation",
      icon: ShieldCheck,
      color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#17172B] dark:text-white tracking-tight">
            Welcome back, {user.full_name || user.email.split("@")[0]}
          </h1>
          <p className="text-[#424C63] dark:text-slate-400 mt-1 text-sm">
            Your LaunchByte builder hub — opportunities, squads, and projects.
          </p>
        </div>

        {!user.is_email_verified && (
          <Link
            href="/verify-email"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-sm font-medium hover:bg-amber-500/25 transition"
          >
            <MailCheck className="w-4 h-4" />
            Verify your email
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group p-6 rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-violet-500/40 transition-all hover:-translate-y-0.5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-[#17172B] dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition">
                  {card.title}
                </h2>
                <p className="text-sm text-[#424C63] dark:text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
                <span>Open</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
