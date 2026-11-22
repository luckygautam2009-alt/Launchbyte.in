"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { EventRegistration, RegistrationStatus } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  Calendar, QrCode, XCircle, Loader2, AlertCircle,
  CheckCircle2, Clock, Ban, Ticket
} from "lucide-react";

const STATUS_CONFIG: Record<RegistrationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  registered: { label: "Registered", color: "text-green-400 bg-green-400/10 border-green-400/20", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  waitlisted: { label: "Waitlisted", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: <Clock className="w-3.5 h-3.5" /> },
  pending_approval: { label: "Pending", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: <Clock className="w-3.5 h-3.5" /> },
  checked_in: { label: "Checked In", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelled", color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: <Ban className="w-3.5 h-3.5" /> },
};

const CANCELLABLE: RegistrationStatus[] = ["registered", "waitlisted", "pending_approval"];

export default function MyRegistrationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "">("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyRegistrations();
      setRegistrations(data);
    } catch (e: any) {
      setError(e.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchRegistrations();
  }, [user, fetchRegistrations]);

  const handleCancel = async (reg: EventRegistration) => {
    if (!confirm(`Cancel registration for ${reg.event_title}?`)) return;
    setCancelling(reg.id);
    try {
      await api.cancelEventRegistration(reg.event_id);
      showToast("Registration cancelled", "success");
      fetchRegistrations();
    } catch (e: any) {
      showToast(e.message || "Failed to cancel", "error");
    } finally {
      setCancelling(null);
    }
  };

  const filtered = statusFilter
    ? registrations.filter((r) => r.status === statusFilter)
    : registrations;

  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Registrations</h1>
          <p className="text-slate-400 mt-1">Your event registrations and passes.</p>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            ["", "All"],
            ["registered", "Registered"],
            ["waitlisted", "Waitlisted"],
            ["checked_in", "Checked In"],
            ["cancelled", "Cancelled"],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val as RegistrationStatus | "")}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${statusFilter === val ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-slate-400">{error}</p>
            <button onClick={fetchRegistrations} className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm underline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">
              {statusFilter ? `No ${statusFilter} registrations.` : "You haven't registered for any events yet."}
            </p>
            <Link href="/events" className="mt-3 inline-block text-indigo-400 hover:text-indigo-300 text-sm underline">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((reg) => {
              const cfg = STATUS_CONFIG[reg.status] || STATUS_CONFIG.registered;
              const starts = reg.starts_at ? new Date(reg.starts_at) : null;
              return (
                <div key={reg.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={reg.event_slug ? `/events/${reg.event_slug}` : "#"}
                        className="font-semibold text-white hover:text-indigo-300 transition-colors line-clamp-1"
                      >
                        {reg.event_title || "Event"}
                      </Link>
                      {starts && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {starts.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        {reg.status === "waitlisted" && reg.waitlist_position && (
                          <span className="text-xs text-slate-500">Position #{reg.waitlist_position}</span>
                        )}
                        <span className="text-xs text-slate-600 font-mono">{reg.registration_code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(reg.status === "registered" || reg.status === "checked_in") && (
                        <Link
                          href={`/passes/${reg.id}`}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Pass
                        </Link>
                      )}
                      {CANCELLABLE.includes(reg.status) && (
                        <button
                          onClick={() => handleCancel(reg)}
                          disabled={cancelling === reg.id}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors disabled:opacity-50"
                          aria-label="Cancel registration"
                        >
                          {cancelling === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
