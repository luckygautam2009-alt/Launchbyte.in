"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { NotificationItem } from "@/lib/types";

const POLL_MS = 60_000;

/** Where a notification should take the user. The backend stores a small payload per event. */
function resolveHref(n: NotificationItem): string | null {
  const d = (n.data || {}) as Record<string, any>;
  if (typeof d.link === "string" && d.link.startsWith("/")) return d.link;
  switch (d.event) {
    case "connection_request":
    case "connection_accepted":
      return "/network";
    case "team_joined":
      return d.team_slug ? `/teams/${d.team_slug}` : "/me/teams";
    case "project_collab_request":
      return "/projects";
  }
  if (d.invite_id) return "/me/invites";
  if (d.team_id) return "/me/teams";
  if (d.application_id) return "/dashboard";
  return null;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const userId = user?.id;

  const fetchCount = useCallback(async () => {
    try {
      setUnread(await api.getUnreadNotificationCount());
    } catch {
      /* a failed poll must never surface as an error: keep the last known count */
    }
  }, []);

  // Poll the (cheap) unread counter while signed in and the tab is visible.
  useEffect(() => {
    if (!userId) {
      setUnread(0);
      setItems(null);
      return;
    }
    const first = setTimeout(fetchCount, 2000); // let the page itself load first
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") void fetchCount();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, fetchCount]);

  const loadList = useCallback(async () => {
    setLoadError(false);
    try {
      const page = await api.listNotifications(20, 0);
      setItems(page?.items ?? []);
    } catch {
      setLoadError(true);
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadList();
      void fetchCount();
    }
  }, [open, loadList, fetchCount]);

  // Close on outside click, Escape and navigation.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!user) return null;

  async function handleOpenItem(n: NotificationItem) {
    const href = resolveHref(n);
    if (!n.read_at) {
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)) ?? prev);
      setUnread((c) => Math.max(0, c - 1));
      api.markNotificationRead(n.id).catch(() => void fetchCount());
    }
    if (href) {
      setOpen(false);
      router.push(href);
    }
  }

  async function handleMarkAll() {
    setItems((prev) => prev?.map((x) => (x.read_at ? x : { ...x, read_at: new Date().toISOString() })) ?? prev);
    setUnread(0);
    try {
      await api.markAllNotificationsRead();
    } catch {
      void fetchCount();
    }
  }

  const btnSize =
    variant === "mobile" ? "min-w-[44px] min-h-[44px]" : "w-9 h-9 xl:w-10 xl:h-10";

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
        className={`${btnSize} relative flex items-center justify-center rounded-xl border transition
          bg-slate-100 border-slate-200 text-slate-700 hover:bg-violet-50 hover:text-violet-700
          dark:bg-[#09091B]/85 dark:border-violet-500/30 dark:text-slate-300 dark:hover:text-white dark:hover:bg-violet-950/50`}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-[18px] text-center shadow ring-2 ring-white dark:ring-[#050510]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed left-3 right-3 top-[4.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] z-[70]
            rounded-2xl border shadow-2xl overflow-hidden
            bg-white border-slate-200 text-[#17172B]
            dark:bg-[#0B0B1E] dark:border-violet-500/20 dark:text-white"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold">Notifications</h3>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 dark:text-violet-300 disabled:opacity-40"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[min(70vh,440px)] overflow-y-auto overscroll-contain">
            {items === null ? (
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/60 skeleton-shimmer" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-medium">{loadError ? "Could not load notifications" : "You're all caught up"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {loadError
                    ? "Please try again in a moment."
                    : "Connection requests, team invites and updates will show up here."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {items.map((n) => {
                  const isUnread = !n.read_at;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleOpenItem(n)}
                        className={`w-full text-left px-4 py-3 flex gap-3 transition hover:bg-violet-50 dark:hover:bg-violet-950/30 ${
                          isUnread ? "bg-violet-50/60 dark:bg-violet-950/20" : ""
                        }`}
                      >
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                            isUnread ? "bg-violet-500" : "bg-transparent"
                          }`}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold leading-snug break-words">{n.title}</span>
                          {n.body && (
                            <span className="block text-xs text-[#424C63] dark:text-slate-400 mt-0.5 line-clamp-2 break-words">
                              {n.body}
                            </span>
                          )}
                          <span className="block text-[11px] text-slate-500 mt-1">{timeAgo(n.created_at)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
