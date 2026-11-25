"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { EventAdminItem, EventStats, EventRegistrationAdmin, EventStaffRead, RegistrationStatus } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  Download, QrCode, UserPlus, Trash2, Loader2, AlertCircle, Eye, Globe, Search,
  ChevronLeft, RefreshCw, CheckCircle2, XCircle
} from "lucide-react";

const STATUS_BADGE: Record<RegistrationStatus, string> = {
  registered: "text-green-400 bg-green-400/10 border-green-400/20",
  waitlisted: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  pending_approval: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  checked_in: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
  cancelled: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const id = params?.id as string;

  const [event, setEvent] = useState<EventAdminItem | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistrationAdmin[]>([]);
  const [regTotal, setRegTotal] = useState(0);
  const [staff, setStaff] = useState<EventStaffRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "">("");
  const [searchQ, setSearchQ] = useState("");
  const [regOffset, setRegOffset] = useState(0);
  const REG_LIMIT = 20;

  const [publishing, setPublishing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState("scanner");
  const [addingStaff, setAddingStaff] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !["admin", "moderator", "organizer"].includes(user.role))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [ev, st, sf] = await Promise.all([
        api.getAdminEvent(id),
        api.getEventStats(id),
        api.listEventStaff(id),
      ]);
      setEvent(ev);
      setStats(st);
      setStaff(sf);
    } catch (e: any) {
      setError(e.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRegistrations = useCallback(async () => {
    if (!id) return;
    setRegLoading(true);
    try {
      const res = await api.listEventRegistrations(id, {
        status: statusFilter || undefined,
        q: searchQ || undefined,
        limit: REG_LIMIT,
        offset: regOffset,
      });
      setRegistrations(res.items);
      setRegTotal(res.total);
    } catch {
      // silent
    } finally {
      setRegLoading(false);
    }
  }, [id, statusFilter, searchQ, regOffset]);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);
  useEffect(() => { if (user && !loading) fetchRegistrations(); }, [user, loading, fetchRegistrations]);

  const handleEventAction = async (action: "publish" | "unpublish" | "close" | "cancel" | "delete") => {
    const confirmMsg: Record<string, string> = {
      publish: "Publish this event? It will appear publicly.",
      unpublish: "Unpublish this event?",
      close: "Close registration for this event?",
      cancel: "Cancel this event? Registrants will be notified.",
      delete: "Delete this event permanently?",
    };
    if (!confirm(confirmMsg[action])) return;
    setPublishing(true);
    try {
      if (action === "publish") await api.publishEvent(id);
      else if (action === "unpublish") await api.unpublishEvent(id);
      else if (action === "close") await api.closeEvent(id);
      else if (action === "cancel") await api.cancelEvent(id);
      else if (action === "delete") {
        await api.deleteAdminEvent(id);
        router.push("/admin/events");
        return;
      }
      showToast(`Event updated`, "success");
      fetchAll();
    } catch (e: any) {
      showToast(e.message || `Failed to ${action}`, "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleRegAction = async (rid: string, action: "approve" | "reject" | "undo-check-in") => {
    setActionLoading(rid + action);
    try {
      if (action === "approve") await api.approveRegistration(id, rid);
      else if (action === "reject") await api.rejectRegistration(id, rid);
      else await api.undoCheckIn(id, rid);
      showToast("Done", "success");
      fetchRegistrations();
      fetchAll();
    } catch (e: any) {
      showToast(e.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCSV = async () => {
    try {
      const csv = await api.exportRegistrationsCSV(id);
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `registrations-${id}.csv`;
      a.click();
    } catch (e: any) {
      showToast(e.message || "Export failed", "error");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail.trim()) return;
    setAddingStaff(true);
    try {
      await api.addEventStaff(id, { email: staffEmail.trim(), role: staffRole });
      showToast("Staff added", "success");
      setStaffEmail("");
      fetchAll();
    } catch (e: any) {
      showToast(e.message || "Failed to add staff", "error");
    } finally {
      setAddingStaff(false);
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    if (!confirm("Remove this staff member?")) return;
    try {
      await api.removeEventStaff(id, userId);
      showToast("Staff removed", "success");
      fetchAll();
    } catch (e: any) {
      showToast(e.message || "Failed to remove staff", "error");
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-slate-400">{error}</p>
      <Link href="/admin/events" className="text-indigo-400 underline text-sm">Back to Events</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <Link href="/admin/events" className="text-xs text-slate-500 hover:text-slate-300 mb-2 flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Admin Events
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${event.status === "published" ? "text-green-400 bg-green-400/10 border-green-400/20" : event.status === "draft" ? "text-slate-400 bg-slate-800 border-slate-700" : "text-amber-400 bg-amber-400/10 border-amber-400/20"}`}>
                  {event.status}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">{event.title}</h1>
              <p className="text-slate-400 text-sm mt-1">{event.slug}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/admin/events/${id}/scan`}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 rounded-xl text-sm font-medium transition-colors">
                <QrCode className="w-4 h-4" /> Scanner
              </Link>
              {event.status === "published" && (
                <Link href={`/events/${event.slug}`} target="_blank"
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500 rounded-xl text-sm transition-colors">
                  <Eye className="w-4 h-4" /> Public View
                </Link>
              )}
              {event.status === "draft" && (
                <button onClick={() => handleEventAction("publish")} disabled={publishing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Publish
                </button>
              )}
              {event.status === "published" && (
                <>
                  <button onClick={() => handleEventAction("close")} disabled={publishing}
                    className="px-3 py-2 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 rounded-xl text-sm font-medium transition-colors">
                    Close
                  </button>
                  <button onClick={() => handleEventAction("cancel")} disabled={publishing}
                    className="px-3 py-2 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 rounded-xl text-sm font-medium transition-colors">
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Registered" value={stats.registered} color="text-green-400" />
            <StatCard label="Waitlisted" value={stats.waitlisted} color="text-amber-400" />
            <StatCard label="Checked In" value={stats.checked_in} color="text-indigo-400" />
            <StatCard label="Pending" value={stats.pending_approval} color="text-blue-400" />
          </div>
        )}

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-semibold text-white">Attendees</h2>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text" placeholder="Search..." value={searchQ}
                  onChange={(e) => { setSearchQ(e.target.value); setRegOffset(0); }}
                  className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-base md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-48 min-h-[44px]"
                />
              </div>
              <button onClick={handleCSV}
                className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500 rounded-xl text-xs font-medium transition-colors">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="px-5 py-2 border-b border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
            {(["", "registered", "waitlisted", "pending_approval", "checked_in", "cancelled"] as const).map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setRegOffset(0); }}
                className={`min-h-[36px] whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {s === "" ? "All" : s.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {regLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" /></div>
          ) : registrations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No attendees yet.</div>
          ) : (
            <>
              {/* Mobile Compact Attendee Card List (< 768px) */}
              <div className="md:hidden divide-y divide-slate-800/70">
                {registrations.map((reg) => (
                  <div key={reg.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{reg.user?.full_name || "—"}</p>
                        <p className="text-xs text-slate-400 truncate">{reg.user?.email}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[reg.status] || ""}`}>
                        {reg.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono">{reg.registration_code}</span>
                      <span>{new Date(reg.registered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                    {(reg.status === "pending_approval" || reg.status === "checked_in") && (
                      <div className="flex items-center gap-2 pt-1">
                        {reg.status === "pending_approval" && (
                          <>
                            <button onClick={() => handleRegAction(reg.id, "approve")}
                              disabled={actionLoading === reg.id + "approve"}
                              className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/25 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => handleRegAction(reg.id, "reject")}
                              disabled={actionLoading === reg.id + "reject"}
                              className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {reg.status === "checked_in" && (
                          <button onClick={() => handleRegAction(reg.id, "undo-check-in")}
                            disabled={actionLoading === reg.id + "undo-check-in"}
                            className="min-h-[40px] px-3 flex items-center justify-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-xl">
                            <RefreshCw className="w-3.5 h-3.5" /> Undo Check-in
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Attendee</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Code</th>
                    <th className="text-left px-5 py-3">Registered</th>
                    <th className="text-left px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{reg.user?.full_name || "—"}</p>
                        <p className="text-xs text-slate-500">{reg.user?.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[reg.status] || ""}`}>
                          {reg.status.replace(/_/g, " ")}
                        </span>
                        {reg.status === "waitlisted" && reg.waitlist_position && (
                          <span className="text-xs text-slate-500 ml-1">#{reg.waitlist_position}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-slate-400">{reg.registration_code}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {new Date(reg.registered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {reg.status === "pending_approval" && (
                            <>
                              <button onClick={() => handleRegAction(reg.id, "approve")}
                                disabled={actionLoading === reg.id + "approve"}
                                className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve">
                                {actionLoading === reg.id + "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => handleRegAction(reg.id, "reject")}
                                disabled={actionLoading === reg.id + "reject"}
                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject">
                                {actionLoading === reg.id + "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              </button>
                            </>
                          )}
                          {reg.status === "checked_in" && (
                            <button onClick={() => handleRegAction(reg.id, "undo-check-in")}
                              disabled={actionLoading === reg.id + "undo-check-in"}
                              className="p-1.5 text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors text-xs disabled:opacity-50"
                              title="Undo Check-in">
                              {actionLoading === reg.id + "undo-check-in" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}

          {regTotal > REG_LIMIT && (
            <div className="p-4 flex justify-center gap-3 border-t border-slate-800">
              <button onClick={() => setRegOffset(Math.max(0, regOffset - REG_LIMIT))} disabled={regOffset === 0}
                className="px-4 py-1.5 bg-slate-800 rounded-xl text-xs text-slate-400 disabled:opacity-40 hover:bg-slate-700 transition-colors">Previous</button>
              <span className="px-4 py-1.5 text-xs text-slate-400">{Math.floor(regOffset / REG_LIMIT) + 1} / {Math.ceil(regTotal / REG_LIMIT)}</span>
              <button onClick={() => setRegOffset(regOffset + REG_LIMIT)} disabled={regOffset + REG_LIMIT >= regTotal}
                className="px-4 py-1.5 bg-slate-800 rounded-xl text-xs text-slate-400 disabled:opacity-40 hover:bg-slate-700 transition-colors">Next</button>
            </div>
          )}
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Staff & Scanners</h2>
          <form onSubmit={handleAddStaff} className="flex gap-2 mb-5 flex-wrap">
            <input
              type="email" placeholder="user@example.com" value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="scanner">Scanner</option>
              <option value="organizer">Organizer</option>
              <option value="volunteer">Volunteer</option>
            </select>
            <button type="submit" disabled={addingStaff}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
              {addingStaff ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add
            </button>
          </form>
          {staff.length === 0 ? (
            <p className="text-slate-500 text-sm">No staff assigned. Add someone above.</p>
          ) : (
            <div className="space-y-2">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div>
                    <p className="text-white text-sm font-medium">{s.user?.full_name || s.user?.email}</p>
                    <p className="text-xs text-slate-500">{s.user?.email} · {s.role}</p>
                  </div>
                  <button onClick={() => handleRemoveStaff(s.user_id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
