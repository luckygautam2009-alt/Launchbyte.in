"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { OpportunityListItem } from "@/lib/types";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Bookmark, Sparkles, Loader2, ArrowRight } from "lucide-react";

export default function SavedOpportunitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<OpportunityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const res = await api.listSaved(50, 0);
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSaved();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center mb-4">
          <Bookmark className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#17172B] dark:text-white mb-2">Sign in to view saved opportunities</h2>
        <p className="text-sm text-[#424C63] dark:text-slate-400 mb-6">
          Bookmark hackathons, internships, fellowships, and workshops to keep track of upcoming deadlines.
        </p>
        <Link
          href="/login"
          className="min-h-[44px] inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Sign In
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Saved Bookmarks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17172B] dark:text-white tracking-tight">Your Saved Opportunities</h1>
          <p className="text-sm text-[#4B5565] dark:text-slate-300 mt-1">
            Keep track of deadlines and return quickly to apply.
          </p>
        </div>
        <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#2F3A52] dark:text-slate-300 w-fit">
          {total} {total === 1 ? "Opportunity" : "Opportunities"}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-60 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-10 sm:p-14 text-center rounded-2xl glass-card max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-slate-800 text-[#5B3DF5] dark:text-violet-300 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#17172B] dark:text-white">No saved opportunities yet</h3>
            <p className="text-sm text-[#4B5565] dark:text-slate-300 leading-relaxed">
              When you find a hackathon or fellowship you want to track, click the bookmark icon on its card or detail page.
            </p>
          </div>
          <Link
            href="/opportunities"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Explore Opportunities
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isSavedInitial={true}
              onSaveChange={() => fetchSaved()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
