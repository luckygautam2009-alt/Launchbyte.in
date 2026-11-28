"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { EventListItem, EventMode } from "@/lib/types";
import { Calendar, MapPin, Users, Wifi, Building2, Sparkles, Search, Clock } from "lucide-react";
import PageHero from "@/components/common/PageHero";
import { Avatar } from "@/components/ui/Avatar";

function EventCard({ event }: { event: EventListItem }) {
  const starts = new Date(event.starts_at);
  const now = new Date();
  const diff = starts.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

  const modeIcon = event.mode === "online" ? <Wifi className="w-3.5 h-3.5" /> : event.mode === "hybrid" ? <Sparkles className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />;
  const modeLabel = event.mode.charAt(0).toUpperCase() + event.mode.slice(1);

  const pct = event.capacity && event.capacity_remaining != null
    ? Math.round(((event.capacity - event.capacity_remaining) / event.capacity) * 100)
    : null;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block glass-card glow-hover rounded-2xl overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
    >
      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-br from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-900 overflow-hidden">
        <Avatar
          src={event.banner_url}
          name={event.title}
          size="fill"
          shape="square"
          className="bg-transparent"
          imgClassName="group-hover:scale-105 transition-transform duration-300"
          fallback={<Sparkles className="w-10 h-10 text-slate-400 dark:text-slate-600" />}
        />
        <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 md:backdrop-blur text-[#2F3A52] dark:text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700">
          {modeIcon} {modeLabel}
        </span>
        {event.organization.logo_url && (
          <div className="absolute bottom-3 left-3 w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <Avatar
              src={event.organization.logo_url}
              name={event.organization.name}
              size="fill"
              shape="square"
            />
          </div>
        )}
      </div>
      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-[#7552D9] dark:text-indigo-400 font-medium mb-1">{event.organization.name}</p>
        <h3 className="font-semibold text-[#17172B] dark:text-white text-sm leading-snug mb-1 group-hover:text-[#7552D9] dark:group-hover:text-indigo-300 transition-colors line-clamp-2">{event.title}</h3>
        {event.tagline && <p className="text-xs text-[#566178] dark:text-slate-400 mb-3 line-clamp-1">{event.tagline}</p>}
        <div className="flex items-center gap-1.5 text-xs text-[#59647A] dark:text-slate-400 mb-2">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{starts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        {event.venue_city && (
          <div className="flex items-center gap-1.5 text-xs text-[#59647A] dark:text-slate-400 mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{event.venue_city}</span>
          </div>
        )}
        {/* Capacity bar */}
        {pct !== null && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-[#647084] dark:text-slate-500 mb-1">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Spots</span>
              <span>{event.capacity_remaining} left</span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        )}
        {event.is_full && (
          <span className="mt-2 inline-flex items-center text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 px-2 py-0.5 rounded-full">Full — Waitlist</span>
        )}
        {daysLeft > 0 && daysLeft <= 30 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-[#7552D9] dark:text-purple-400">
            <Clock className="w-3 h-3" /> {daysLeft} day{daysLeft !== 1 ? "s" : ""} to go
          </div>
        )}
      </div>
    </Link>
  );
}

function EventCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-100 dark:bg-slate-800/60" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  );
}

const MODES: { value: EventMode | ""; label: string }[] = [
  { value: "", label: "All Modes" },
  { value: "online", label: "Online" },
  { value: "onsite", label: "Onsite" },
  { value: "hybrid", label: "Hybrid" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<EventMode | "">("");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [upcoming, setUpcoming] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 12;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { limit: LIMIT, offset };
      if (mode) params.mode = mode;
      if (q) params.q = q;
      if (upcoming) params.upcoming = "true";
      const res = await api.listEvents(params);
      setEvents(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [mode, q, upcoming, offset]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
    setOffset(0);
  };

  return (
    <main className="min-h-screen bg-transparent dark:bg-[#050510]">
      {/* PageHero with search form inside */}
      <PageHero
        eyebrow="EVENTS HUB"
        title={
          <>
            Discover{" "}
            <span className="bg-gradient-to-r from-[#7552D9] via-indigo-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Events
            </span>
          </>
        }
        subtitle="Find hackathons, workshops, and competitions from verified organizations."
      >
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events..."
              aria-label="Search events"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-white/95 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-[#17172B] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm shadow-sm dark:shadow-none"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Search
          </button>
        </form>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="flex bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1 shadow-sm dark:shadow-none">
            <button
              onClick={() => { setUpcoming(true); setOffset(0); }}
              className={`min-h-[44px] sm:min-h-[34px] px-4 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${upcoming ? "bg-indigo-600 text-white" : "text-[#4B5565] hover:text-[#17172B] dark:text-slate-300 dark:hover:text-white"}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => { setUpcoming(false); setOffset(0); }}
              className={`min-h-[44px] sm:min-h-[34px] px-4 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${!upcoming ? "bg-indigo-600 text-white" : "text-[#4B5565] hover:text-[#17172B] dark:text-slate-300 dark:hover:text-white"}`}
            >
              Past
            </button>
          </div>
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => { setMode(m.value as EventMode | ""); setOffset(0); }}
              className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${mode === m.value ? "bg-indigo-600 text-white border-indigo-600" : "bg-white/85 dark:bg-slate-900/60 text-[#424C63] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-slate-600"}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-center max-w-md mx-auto space-y-3">
            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{error}</p>
            <button
              onClick={fetchEvents}
              className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
            >
              Try again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="p-10 sm:p-14 rounded-2xl bg-white/85 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-3 shadow-sm dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-slate-800 text-[#5B3DF5] dark:text-violet-300 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#17172B] dark:text-white">No events found</h3>
            <p className="text-sm text-[#4B5565] dark:text-slate-300 leading-relaxed">
              Try switching between Upcoming and Past or clearing your mode filter to explore more events.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {events.map((ev) => <EventCard key={ev.id} event={ev} />)}
            </div>
            {total > LIMIT && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                  disabled={offset === 0}
                  className="min-h-[44px] px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-[#424C63] dark:text-slate-300 disabled:opacity-40 hover:border-slate-300 dark:hover:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-[#4B5565] dark:text-slate-300">
                  {Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}
                </span>
                <button
                  onClick={() => setOffset(offset + LIMIT)}
                  disabled={offset + LIMIT >= total}
                  className="min-h-[44px] px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-[#424C63] dark:text-slate-300 disabled:opacity-40 hover:border-slate-300 dark:hover:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
