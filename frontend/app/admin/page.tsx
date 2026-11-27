"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Calendar, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !["admin", "moderator", "organizer"].includes(user.role))) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-transparent dark:bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  const cards = [
    {
      href: "/admin/events",
      icon: <Calendar className="w-6 h-6 text-indigo-400" />,
      title: "Events",
      desc: "Create, publish, and manage hackathons and events. View registrations, stats, and check-in.",
      roles: ["admin", "organizer"],
    },
    {
      href: "/admin/moderation",
      icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
      title: "Moderation Queue",
      desc: "Review and approve opportunity listings submitted by organizers.",
      roles: ["admin", "moderator"],
    },
  ];

  const visibleCards = cards.filter((c) => user && c.roles.includes(user.role));

  return (
    <main className="min-h-screen bg-transparent dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Admin Portal</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-2">Welcome back, {user?.full_name || user?.email}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {visibleCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-slate-800 rounded-xl">{card.icon}</div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">{card.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
