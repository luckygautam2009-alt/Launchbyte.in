"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { EventAdminItem, EventStatus } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import {
  PlusCircle, Calendar, Users, Loader2,
  AlertCircle, Sparkles, Eye, ChevronRight
} from "lucide-react";

const STATUS_COLOR: Record<EventStatus, string> = {
  draft: "text-slate-400 bg-slate-400/10",
  published: "text-green-400 bg-green-400/10",
  closed: "text-amber-400 bg-amber-400/10",
  cancelled: "text-red-400 bg-red-400/10",
  completed: "text-blue-400 bg-blue-400/10",
};

export default function AdminEventsListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState<EventAdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    if (!authLoading && (!user || !["admin", "moderator", "organizer"].includes(user.role))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listAdminEvents({ status: statusFilter || undefined, limit: LIMIT, offset });
      setEvents(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, offset]);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, fetchEvents]);

  return (
    <main className="min-h-screen bg-transparent dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-xs text-slate-500 hover:text-slate-300 mb-1 block">← Admin</Link>
            <h1 className="text-3xl font-bold text-white">Events</h1>
          </div>
          <Link
            href="/admin/events/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> New Event
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(["", "draft", "published", "closed", "cancelled", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setOffset(0); }}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${statusFilter === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600"}`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-slate-400">{error}</p>
            <button onClick={fetchEvents} className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm underline">Retry</button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">No events yet. Host your first event!</p>
            <Link href="/admin/events/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
              <PlusCircle className="w-4 h-4" /> Create Event
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {events.map((ev) => {
                const starts = new Date(ev.starts_at);
                return (
                  <div key={ev.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[ev.status]}`}>
                            {ev.status}
                          </span>
                          <span className="text-xs text-slate-500 capitalize">{ev.mode}</span>
                        </div>
                        <h3 className="font-semibold text-white leading-tight truncate">{ev.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{starts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          {ev.registrations_count != null && (
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ev.registrations_count} registered</span>
                          )}
                          {ev.capacity && <span>{ev.capacity} capacity</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ev.status === "published" && (
                          <Link href={`/events/${ev.slug}`} target="_blank" className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors" aria-label="View public page">
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link href={`/admin/events/${ev.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors">
                          Manage <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {total > LIMIT && (
              <div className="flex justify-center gap-3 mt-8">
                <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-400 disabled:opacity-40 hover:border-slate-600 transition-colors">Previous</button>
                <span className="px-4 py-2 text-sm text-slate-400">{Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}</span>
                <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= total} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-400 disabled:opacity-40 hover:border-slate-600 transition-colors">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
