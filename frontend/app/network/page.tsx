"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ConnectionRead, NetworkSuggestion, UserBlockRead } from "@/lib/types";
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Sparkles,
  ShieldAlert,
  Check,
  X,
  Trash2,
  Building,
  MessageSquare,
} from "lucide-react";
import PageHero from "@/components/common/PageHero";

export default function NetworkPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"connections" | "requests" | "suggestions" | "blocked">("connections");

  // State
  const [connections, setConnections] = useState<ConnectionRead[]>([]);
  const [incoming, setIncoming] = useState<ConnectionRead[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRead[]>([]);
  const [suggestions, setSuggestions] = useState<NetworkSuggestion[]>([]);
  const [blocks, setBlocks] = useState<UserBlockRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<{ id: string; name: string; handle?: string | null } | null>(null);

  // Manual connect form
  const [targetHandle, setTargetHandle] = useState("");
  const [requestMsg, setRequestMsg] = useState("");
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [connRes, incRes, outRes, suggRes, blkRes] = await Promise.all([
        api.listConnections({ per_page: 50 }),
        api.listConnectionRequests("incoming"),
        api.listConnectionRequests("outgoing"),
        api.getNetworkSuggestions(20),
        api.listBlocks(),
      ]);
      setConnections(connRes.items);
      setIncoming(incRes);
      setOutgoing(outRes);
      setSuggestions(suggRes);
      setBlocks(blkRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load network data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(reqId: string) {
    setActionLoading(reqId);
    try {
      await api.acceptConnection(reqId);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || "Failed to accept connection request");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline(reqId: string) {
    setActionLoading(reqId);
    try {
      await api.declineConnection(reqId);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || "Failed to decline connection request");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(reqId: string) {
    setActionLoading(reqId);
    try {
      await api.cancelConnectionRequest(reqId);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || "Failed to cancel connection request");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(connId: string) {
    if (!confirm("Are you sure you want to remove this connection?")) return;
    setActionLoading(connId);
    try {
      await api.removeConnection(connId);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || "Failed to remove connection");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendRequest(targetUserId?: string, handle?: string, msg?: string) {
    try {
      await api.requestConnection({
        user_id: targetUserId,
        handle: handle,
        message: msg,
      });
      setRequestSuccess("Connection request sent successfully!");
      setTargetHandle("");
      setRequestMsg("");
      setModalUser(null);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || "Could not send connection request");
    }
  }

  async function handleBlock(userId: string) {
    if (!confirm("Block this user? They will not be able to message or view your profile.")) return;
    try {
      await api.blockUser(userId);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || "Failed to block user");
    }
  }

  async function handleUnblock(userId: string) {
    try {
      await api.unblockUser(userId);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || "Failed to unblock user");
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent dark:bg-[#050510]">
        <PageHero
          eyebrow="BUILDER NETWORK"
          title={
            <>
              Connect with{" "}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                Developers
              </span>
            </>
          }
          subtitle="Sign in to find hackathon teammates, share projects, and build your network."
        >
          <Link
            href="/login"
            className="inline-flex px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition shadow-lg shadow-brand-600/25"
          >
            Sign In
          </Link>
        </PageHero>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510]">
      {/* PageHero */}
      <PageHero
        eyebrow="BUILDER NETWORK"
        title={
          <>
            Developer{" "}
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Network
            </span>
          </>
        }
        subtitle="Build your hackathon network, discover teammates with shared skills, and chat directly."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick Connect By Handle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 glass-card rounded-2xl">
          <p className="text-sm text-slate-300">Invite a developer directly:</p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Enter @handle..."
              value={targetHandle}
              onChange={(e) => setTargetHandle(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 flex-1 sm:w-60"
            />
            <button
              onClick={() => handleSendRequest(undefined, targetHandle.replace("@", ""))}
              disabled={!targetHandle.trim()}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-sm transition flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Connect
            </button>
          </div>
        </div>

        {requestSuccess && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm flex items-center justify-between">
            <span>{requestSuccess}</span>
            <button onClick={() => setRequestSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("connections")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition ${
              activeTab === "connections"
                ? "border-brand-500 text-brand-400 bg-slate-900/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            My Connections ({connections.length})
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition ${
              activeTab === "requests"
                ? "border-brand-500 text-brand-400 bg-slate-900/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            Requests ({incoming.length + outgoing.length})
          </button>

          <button
            onClick={() => setActiveTab("suggestions")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition ${
              activeTab === "suggestions"
                ? "border-brand-500 text-brand-400 bg-slate-900/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Suggestions ({suggestions.length})
          </button>

          <button
            onClick={() => setActiveTab("blocked")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition ${
              activeTab === "blocked"
                ? "border-brand-500 text-brand-400 bg-slate-900/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Blocked ({blocks.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading your network...</div>
        ) : (
          <>
            {/* TAB 1: CONNECTIONS */}
            {activeTab === "connections" && (
              <div>
                {connections.length === 0 ? (
                  <div className="text-center py-16 glass-card rounded-2xl">
                    <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-300 font-medium">No connections yet</p>
                    <p className="text-slate-500 text-sm mt-1 mb-4">
                      Explore suggestions or invite peers using their handle.
                    </p>
                    <button
                      onClick={() => setActiveTab("suggestions")}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition"
                    >
                      View Suggested Teammates
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {connections.map((c) => {
                      const u = c.user;
                      if (!u) return null;
                      return (
                        <div
                          key={c.id}
                          className="p-5 rounded-2xl glass-card glow-hover transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                  {u.full_name?.[0]?.toUpperCase() || u.handle?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white leading-tight">
                                    {u.full_name || `@${u.handle}`}
                                  </h3>
                                  <p className="text-xs text-slate-400">@{u.handle}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemove(c.id)}
                                disabled={actionLoading === c.id}
                                title="Remove connection"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {u.institution && (
                              <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                                <Building className="w-3.5 h-3.5 text-slate-500" />
                                {u.institution}
                              </p>
                            )}

                            {u.headline && (
                              <p className="text-xs text-slate-300 italic mb-3 line-clamp-2">"{u.headline}"</p>
                            )}

                            {u.skills && u.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {u.skills.slice(0, 4).map((s) => (
                                  <span
                                    key={s}
                                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/50"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {u.skills.length > 4 && (
                                  <span className="text-[10px] text-slate-500 self-center">
                                    +{u.skills.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                            <Link
                              href={`/messages`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                              Send Message
                            </Link>

                            <button
                              onClick={() => handleBlock(u.id)}
                              className="text-[11px] text-slate-500 hover:text-rose-400 transition"
                            >
                              Block
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REQUESTS */}
            {activeTab === "requests" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-brand-400" />
                    Incoming Requests ({incoming.length})
                  </h2>
                  {incoming.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No incoming requests at this moment.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {incoming.map((req) => (
                        <div
                          key={req.id}
                          className="p-5 rounded-2xl glass-card flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-sm">
                                {req.user?.full_name?.[0]?.toUpperCase() || "U"}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white leading-tight">
                                  {req.user?.full_name || `@${req.user?.handle}`}
                                </h4>
                                <p className="text-xs text-slate-400">@{req.user?.handle}</p>
                              </div>
                            </div>
                            {req.message && (
                              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 italic mb-3">
                                "{req.message}"
                              </div>
                            )}
                            {req.user?.institution && (
                              <p className="text-xs text-slate-400 mb-2">{req.user.institution}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                            <button
                              onClick={() => handleAccept(req.id)}
                              disabled={actionLoading === req.id}
                              className="flex-1 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(req.id)}
                              disabled={actionLoading === req.id}
                              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    Sent Requests ({outgoing.length})
                  </h2>
                  {outgoing.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No outgoing pending requests.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {outgoing.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 rounded-2xl glass-card flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-medium text-white text-sm">
                              {req.user?.full_name || `@${req.user?.handle}`}
                            </h4>
                            <p className="text-xs text-slate-500">Sent on {new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                          <button
                            onClick={() => handleCancel(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SUGGESTIONS */}
            {activeTab === "suggestions" && (
              <div>
                <p className="text-sm text-slate-400 mb-6">
                  Recommended developers based on shared hackathons, complementary skills, and institutions.
                </p>

                {suggestions.length === 0 ? (
                  <div className="text-center py-16 glass-card rounded-2xl">
                    <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-300 font-medium">No new suggestions at the moment</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Complete your profile skills or join events to see smart teammate recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {suggestions.map((sug) => {
                      const u = sug.user;
                      return (
                        <div
                          key={u.id}
                          className="p-5 rounded-2xl glass-card glow-hover transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                                  {u.full_name?.[0]?.toUpperCase() || u.handle?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white leading-tight">
                                    {u.full_name || `@${u.handle}`}
                                  </h3>
                                  <p className="text-xs text-slate-400">@{u.handle}</p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-950 text-brand-400 border border-brand-800/60">
                                {sug.score}% Match
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {sug.reasons.map((r, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3 text-cyan-400" />
                                  {r}
                                </span>
                              ))}
                            </div>

                            {u.institution && (
                              <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                                <Building className="w-3.5 h-3.5 text-slate-500" />
                                {u.institution}
                              </p>
                            )}

                            {u.skills && u.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {u.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                            <button
                              onClick={() =>
                                setModalUser({ id: u.id, name: u.full_name || `@${u.handle}`, handle: u.handle })
                              }
                              className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Connect
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: BLOCKED USERS */}
            {activeTab === "blocked" && (
              <div>
                <p className="text-sm text-slate-400 mb-6">
                  Blocked users cannot send you connection requests, message you, or see your activity.
                </p>
                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    You have not blocked any users.
                  </div>
                ) : (
                  <div className="max-w-2xl divide-y divide-slate-800 rounded-2xl glass-card">
                    {blocks.map((b) => (
                      <div key={b.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {b.blocked_user?.full_name || `@${b.blocked_user?.handle}` || "User"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Blocked on {new Date(b.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnblock(b.blocked_id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200 transition"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Connect Modal */}
        {modalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1">Connect with {modalUser.name}</h3>
              <p className="text-xs text-slate-400 mb-4">
                Add a personalized message explaining why you'd like to connect.
              </p>

              <textarea
                rows={3}
                placeholder="Hey, I noticed we both know Python and are interested in hackathons..."
                value={requestMsg}
                onChange={(e) => setRequestMsg(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendRequest(modalUser.id, undefined, requestMsg)}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
