"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ConversationRead, MessageRead } from "@/lib/types";
import {
  MessageSquare,
  Users,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Flag,
  Circle,
  Clock,
  Check,
  CheckCheck,
  Search,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuth();

  // Conversations & selected
  const [conversations, setConversations] = useState<ConversationRead[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationRead | null>(null);
  const [convLoading, setConvLoading] = useState(true);

  // Messages & pagination
  const [messages, setMessages] = useState<MessageRead[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Typing & input
  const [inputBody, setInputBody] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  // Editing & reporting
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [reportModalMsg, setReportModalMsg] = useState<MessageRead | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // The WebSocket is created once; without this ref its onmessage kept a stale `selectedConv`
  // (always null) so live messages never showed up in the open chat.
  const wsHandlerRef = useRef<(msg: any) => void>(() => {});

  // 1. Initial Load of Conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  async function loadConversations() {
    setConvLoading(true);
    try {
      const convs = await api.listConversations();
      setConversations(convs);
      if (convs.length > 0 && !selectedConv) {
        setSelectedConv(convs[0]);
      }
    } catch (err: any) {
      console.error("Failed to load conversations:", err);
    } finally {
      setConvLoading(false);
    }
  }

  // 2. Load Messages when Selected Conversation changes
  useEffect(() => {
    if (!selectedConv) return;
    loadMessages(selectedConv.id);
    // Mark as read
    api.markConversationRead(selectedConv.id).catch(() => {});
  }, [selectedConv?.id]);

  async function loadMessages(convId: string, cursor?: string) {
    setLoadingMessages(true);
    try {
      const res = await api.getConversationMessages(convId, { cursor, limit: 30 });
      if (cursor) {
        setMessages((prev) => [...res.items, ...prev]);
      } else {
        setMessages(res.items);
        setTimeout(scrollToBottom, 50);
      }
      setNextCursor(res.next_cursor || null);
      setHasMore(res.has_more);
    } catch (err: any) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // 3. Setup WebSocket Connection with Ticket Auth
  useEffect(() => {
    if (!user) return;
    let isSubscribed = true;
    let pingInterval: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;

    async function initWs() {
      try {
        const ticketRes = await api.getWsTicket();
        if (!isSubscribed) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const wsUrl = apiUrl.replace(/^http/, "ws").replace(/\/api\/v1$/, "") + `/ws?ticket=${ticketRes.ticket}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Heartbeat ping every 25 seconds
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ action: "ping" }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            wsHandlerRef.current(data);
          } catch (e) {
            console.error("WS parse error:", e);
          }
        };

        ws.onclose = () => {
          clearInterval(pingInterval);
          // Auto reconnect after 3 seconds
          if (isSubscribed) {
            reconnectTimeout = setTimeout(initWs, 3000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (e) {
        console.error("WS ticket error:", e);
        if (isSubscribed) {
          reconnectTimeout = setTimeout(initWs, 5000);
        }
      }
    }

    initWs();

    return () => {
      isSubscribed = false;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, [user]);

  function handleWsEvent(msg: any) {
    if (!msg || typeof msg !== "object") return;
    if (msg.event === "message.new") {
      const newMsg = msg.data as MessageRead;
      // If currently open conversation
      if (selectedConv && newMsg.conversation_id === selectedConv.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id || (newMsg.client_msg_id && m.client_msg_id === newMsg.client_msg_id))) {
            return prev.map((m) => (m.client_msg_id === newMsg.client_msg_id ? newMsg : m));
          }
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);
        // mark as read
        api.markConversationRead(selectedConv.id, newMsg.id).catch(() => {});
      }

      // Update conversations list latest message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === newMsg.conversation_id
            ? {
                ...c,
                last_message: newMsg,
                unread_count: selectedConv?.id === c.id ? 0 : (c.unread_count || 0) + 1,
              }
            : c
        )
      );
    } else if (msg.event === "message.edited") {
      const edited = msg.data as MessageRead;
      setMessages((prev) => prev.map((m) => (m.id === edited.id ? edited : m)));
    } else if (msg.event === "message.deleted") {
      const delId = msg.data?.message_id;
      setMessages((prev) =>
        prev.map((m) => (m.id === delId ? { ...m, is_deleted: true, body: "This message was deleted" } : m))
      );
    } else if (msg.event === "typing") {
      const { conversation_id, user_name, is_typing, user_id } = msg.data;
      if (selectedConv?.id === conversation_id && user_id !== user?.id) {
        if (is_typing) {
          setTypingUsers((prev) => ({ ...prev, [user_id]: user_name }));
        } else {
          setTypingUsers((prev) => {
            const copy = { ...prev };
            delete copy[user_id];
            return copy;
          });
        }
      }
    }
  }

  wsHandlerRef.current = handleWsEvent;

  // 4. Send Message (with optimistic update)
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputBody.trim() || !selectedConv || sending) return;

    const body = inputBody.trim();
    const clientMsgId = `cli-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setInputBody("");
    setSending(true);

    // Optimistic message
    const tempMsg: MessageRead = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConv.id,
      sender_id: user!.id,
      client_msg_id: clientMsgId,
      body,
      created_at: new Date().toISOString(),
      is_deleted: false,
      sender_name: user!.full_name,
      sender_handle: (user as any).handle,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    // Emit stop typing
    sendTypingStatus(false);

    try {
      const saved = await api.sendMessage(selectedConv.id, { body, client_msg_id: clientMsgId });
      setMessages((prev) => prev.map((m) => (m.client_msg_id === clientMsgId ? saved : m)));
    } catch (err: any) {
      alert(err?.message || "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.client_msg_id !== clientMsgId));
      setInputBody(body);
    } finally {
      setSending(false);
    }
  }

  function handleTypingChange(val: string) {
    setInputBody(val);
    if (!selectedConv) return;

    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  }

  function sendTypingStatus(isTyping: boolean) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedConv) {
      wsRef.current.send(
        JSON.stringify({
          action: "typing",
          conversation_id: selectedConv.id,
          is_typing: isTyping,
        })
      );
    }
  }

  async function handleSaveEdit(msgId: string) {
    if (!editBody.trim()) return;
    try {
      const edited = await api.editMessage(msgId, editBody.trim());
      setMessages((prev) => prev.map((m) => (m.id === msgId ? edited : m)));
      setEditingMessageId(null);
      setEditBody("");
    } catch (err: any) {
      alert(err?.message || "Failed to edit message");
    }
  }

  async function handleDeleteMessage(msgId: string) {
    if (!confirm("Delete this message?")) return;
    try {
      await api.deleteMessage(msgId);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, is_deleted: true, body: "This message was deleted" } : m))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to delete message");
    }
  }

  async function handleReportSubmit() {
    if (!reportModalMsg) return;
    try {
      await api.reportMessage(reportModalMsg.id, {
        reason: reportReason,
        details: reportDetails,
      });
      alert("Message reported to moderators.");
      setReportModalMsg(null);
      setReportDetails("");
    } catch (err: any) {
      alert(err?.message || "Failed to report message");
    }
  }

  // Conversation title helper
  function getConvTitle(conv: ConversationRead): string {
    if (conv.title) return conv.title;
    if (conv.type === "team") return `Team ${conv.team_slug || "Chat"}`;
    const other = (conv.participants ?? []).find((p) => p.user_id !== user?.id);
    return (
      other?.user_name ||
      (other?.user_handle ? `@${other.user_handle}` : null) ||
      conv.other_user?.full_name ||
      (conv.other_user?.handle ? `@${conv.other_user.handle}` : null) ||
      "Direct Chat"
    );
  }

  const participantCount = selectedConv
    ? selectedConv.participants?.length ?? selectedConv.participants_count ?? 0
    : 0;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Direct & Team Messaging</h1>
        <p className="text-slate-400 mb-6">Sign in to communicate in real time with teammates and peers.</p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[calc(100dvh-10.5rem-env(safe-area-inset-bottom))] min-h-[460px] md:h-[min(780px,calc(100dvh-7.5rem))]">
        {/* LEFT COLUMN: CONVERSATION LIST (Full-width on mobile when no chat selected) */}
        <div
          className={`w-full md:w-80 lg:w-96 md:border-r border-slate-800 flex-col bg-slate-950/40 min-h-0 flex-1 md:flex-none ${
            selectedConv ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-400" />
              Messages
            </h2>
            <Link
              href="/network"
              className="min-h-[36px] inline-flex items-center px-2 text-xs text-brand-400 hover:text-brand-300 font-medium transition"
            >
              Find Peers &rarr;
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {convLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 text-sm font-medium">No conversations yet</p>
                <p className="text-slate-500 text-xs mt-1 mb-3">
                  Connect with peers or join a team to start chatting.
                </p>
                <Link
                  href="/network"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  Explore Network
                </Link>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                const title = getConvTitle(c);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    className={`w-full text-left p-4 transition flex items-start gap-3 ${
                      isSelected
                        ? "bg-slate-800/80 border-l-4 border-brand-500"
                        : "hover:bg-slate-900/60"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                        c.type === "team"
                          ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white"
                          : "bg-gradient-to-tr from-brand-600 to-cyan-600 text-white"
                      }`}
                    >
                      {c.type === "team" ? <Users className="w-5 h-5" /> : (title || "U")[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-sm text-white truncate">{title}</span>
                        {c.last_message && (
                          <span className="text-[10px] text-slate-500">
                            {new Date(c.last_message.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 truncate pr-2">
                          {c.last_message?.body ?? "No messages yet"}
                        </p>
                        {c.unread_count > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT PANEL (Full-width on mobile when chat selected) */}
        <div
          className={`flex-1 flex-col bg-slate-900/30 min-w-0 min-h-0 ${
            selectedConv ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedConv(null)}
                    aria-label="Back to conversations"
                    className="md:hidden min-w-[44px] min-h-[44px] -ml-1 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition shrink-0"
                  >
                    &larr;
                  </button>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2 truncate">
                      <span className="truncate">{getConvTitle(selectedConv)}</span>
                      {selectedConv.type === "team" && (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-purple-950/60 text-purple-300 border border-purple-800/60 shrink-0">
                          Team
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {participantCount} participant
                      {participantCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {selectedConv.type === "team" && selectedConv.team_slug && (
                  <Link
                    href={`/projects`}
                    className="min-h-[36px] inline-flex items-center text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 transition shrink-0"
                  >
                    View Project
                  </Link>
                )}
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {hasMore && (
                  <div className="text-center py-2">
                    <button
                      onClick={() => nextCursor && loadMessages(selectedConv.id, nextCursor)}
                      disabled={loadingMessages}
                      className="px-3 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      {loadingMessages ? "Loading..." : "Load Older Messages"}
                    </button>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="text-center py-24 text-slate-500 text-sm">
                    No messages yet. Say hello to start the conversation!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user.id;
                    const isEditing = editingMessageId === m.id;

                    return (
                      <div
                        key={m.id}
                        className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        {!isMe && (
                          <span className="text-[11px] font-semibold text-slate-400 ml-2 mb-1">
                            {m.sender_name || (m.sender_handle ? `@${m.sender_handle}` : "Peer")}
                          </span>
                        )}

                        <div className="relative max-w-[88%] sm:max-w-[80%] flex items-center gap-1.5 sm:gap-2">
                          {/* Message actions: accessible on touch and subtle hover on desktop */}
                          {isMe && !m.is_deleted && (
                            <div className="opacity-85 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingMessageId(m.id);
                                  setEditBody(m.body);
                                }}
                                aria-label="Edit message"
                                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                title="Edit message"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(m.id)}
                                aria-label="Delete message"
                                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {!isMe && !m.is_deleted && (
                            <div className="opacity-85 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition shrink-0">
                              <button
                                onClick={() => setReportModalMsg(m)}
                                aria-label="Report message"
                                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/60"
                                title="Report message"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Balloon */}
                          <div
                            className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                              m.is_deleted
                                ? "bg-slate-800/40 border border-slate-700/40 text-slate-500 italic"
                                : isMe
                                ? "bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-600/10"
                                : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/50"
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-2 min-w-[200px]">
                                <input
                                  type="text"
                                  value={editBody}
                                  onChange={(e) => setEditBody(e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-2 py-0.5 text-[10px] text-slate-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(m.id)}
                                    className="px-2 py-0.5 bg-emerald-600 rounded text-[10px] text-white font-medium"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="whitespace-pre-wrap break-words">{m.body ?? ""}</p>
                                <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75">
                                  {m.edited_at && !m.is_deleted && <span>(edited)</span>}
                                  <span>
                                    {new Date(m.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {isMe && <CheckCheck className="w-3 h-3 ml-0.5 text-white/80" />}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicators */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="px-4 py-1 text-xs text-brand-400 italic bg-slate-950/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
                  {Object.values(typingUsers).join(", ")} is typing...
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-800 bg-slate-950/40 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputBody}
                  onChange={(e) => handleTypingChange(e.target.value)}
                  className="min-w-0 flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-base md:text-sm focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={!inputBody.trim() || sending}
                  aria-label="Send message"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium transition shadow-md shadow-brand-600/20 shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <MessageSquare className="w-14 h-14 mb-3 text-slate-700" />
              <p className="text-base font-semibold text-slate-300">Select a conversation</p>
              <p className="text-xs text-slate-500 mt-1">Choose a conversation from the sidebar to chat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportModalMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Flag className="w-5 h-5 text-amber-400" />
              Report Message
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Help keep LaunchByte safe. Flag abusive, harmful, or spam content for review.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200"
              >
                <option value="spam">Spam or Unsolicited Promotion</option>
                <option value="harassment">Harassment or Abuse</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="scam">Scam / Fraud</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Details (Optional)</label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide additional context for moderators..."
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReportModalMsg(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
