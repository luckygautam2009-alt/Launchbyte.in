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
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
          <Bookmark className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to view saved opportunities</h2>
        <p className="text-sm text-slate-400 mb-6">
          Bookmark hackathons, internships, fellowships, and workshops to keep track of upcoming deadlines.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
        >
          Sign In
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Saved Bookmarks</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Saved Opportunities</h1>
          <p className="text-sm text-slate-400 mt-1">
            Keep track of deadlines and return quickly to apply
          </p>
        </div>
        <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 w-fit">
          {total} {total === 1 ? "Opportunity" : "Opportunities"}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-sm">Loading your saved items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8 max-w-lg mx-auto">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No saved opportunities yet</h3>
          <p className="text-sm text-slate-400 mb-6">
            When you find a hackathon or fellowship you want to track, click the bookmark icon on its card or detail page.
          </p>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
          >
            Explore Opportunities
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
