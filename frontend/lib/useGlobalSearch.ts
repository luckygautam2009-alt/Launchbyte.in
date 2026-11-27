"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

export type SearchCategory =
  | "Opportunities"
  | "Events"
  | "Teams"
  | "People"
  | "Quick Actions";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  category: SearchCategory;
  badge?: string;
  avatarUrl?: string | null;
}

export interface SearchCategoryGroup {
  category: SearchCategory;
  items: SearchResultItem[];
}

export const QUICK_ACTIONS: SearchResultItem[] = [
  {
    id: "quick-find-team",
    title: "Find a Team",
    subtitle: "Discover active squads looking for builders",
    href: "/teams",
    category: "Quick Actions",
    badge: "Teams",
  },
  {
    id: "quick-create-team",
    title: "Create a Team",
    subtitle: "Launch a new squad for an upcoming hackathon",
    href: "/teams/new",
    category: "Quick Actions",
    badge: "New",
  },
  {
    id: "quick-opportunities",
    title: "Explore Opportunities",
    subtitle: "Internships, fellowships, grants & hackathons",
    href: "/opportunities",
    category: "Quick Actions",
    badge: "Catalog",
  },
  {
    id: "quick-hackathons",
    title: "Browse Hackathons",
    subtitle: "Live & upcoming competitive sprints",
    href: "/hackathons",
    category: "Quick Actions",
    badge: "Events",
  },
  {
    id: "quick-people",
    title: "Find Teammates",
    subtitle: "Match with developers & designers by skill",
    href: "/people",
    category: "Quick Actions",
    badge: "People",
  },
];

export function useGlobalSearch(query: string, enabled: boolean) {
  const [liveGroups, setLiveGroups] = useState<SearchCategoryGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  useEffect(() => {
    if (!enabled || trimmed.length < 2) {
      requestIdRef.current += 1;
      setLiveGroups([]);
      setLoading(false);
      return;
    }

    const currentId = ++requestIdRef.current;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const [oppsRes, eventsRes, teamsRes, peopleRes] = await Promise.allSettled([
          api.listOpportunities({ q: trimmed, limit: 3 }),
          api.listEvents({ q: trimmed, limit: 3 }),
          api.listTeams({ q: trimmed, per_page: 3 }),
          api.discoverPeople({ q: trimmed, limit: 3 }),
        ]);

        if (requestIdRef.current !== currentId) return;

        const nextGroups: SearchCategoryGroup[] = [];

        if (oppsRes.status === "fulfilled" && oppsRes.value.items.length > 0) {
          nextGroups.push({
            category: "Opportunities",
            items: oppsRes.value.items.map((o) => ({
              id: `opp-${o.id}`,
              title: o.title,
              subtitle: o.organization?.name || o.location_text || o.type,
              href: `/opportunities/${o.slug}`,
              category: "Opportunities",
              badge: o.type,
            })),
          });
        }

        if (eventsRes.status === "fulfilled" && eventsRes.value.items.length > 0) {
          nextGroups.push({
            category: "Events",
            items: eventsRes.value.items.map((e) => ({
              id: `evt-${e.id}`,
              title: e.title,
              subtitle: e.tagline || e.venue_city || e.organization?.name || undefined,
              href: `/events/${e.slug}`,
              category: "Events",
              badge: e.mode,
            })),
          });
        }

        if (teamsRes.status === "fulfilled" && teamsRes.value.items.length > 0) {
          nextGroups.push({
            category: "Teams",
            items: teamsRes.value.items.map((t) => ({
              id: `team-${t.id}`,
              title: t.name,
              subtitle: t.event_title || t.description || "Open hackathon squad",
              href: `/teams/${t.slug}`,
              category: "Teams",
              badge: `${t.members?.length ?? 1}/${t.max_size}`,
            })),
          });
        }

        if (peopleRes.status === "fulfilled" && peopleRes.value.length > 0) {
          nextGroups.push({
            category: "People",
            items: peopleRes.value.map((p) => ({
              id: `person-${p.id}`,
              title: p.full_name,
              subtitle:
                p.headline ||
                p.institution ||
                (p.skills.length > 0 ? p.skills.slice(0, 3).join(" • ") : `@${p.handle}`),
              href: `/u/${p.handle}`,
              category: "People",
              badge: `@${p.handle}`,
              avatarUrl: p.avatar_url,
            })),
          });
        }

        setLiveGroups(nextGroups);
      } finally {
        if (requestIdRef.current === currentId) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [trimmed, enabled]);

  const groups: SearchCategoryGroup[] = useMemo(() => {
    if (!hasQuery) {
      return [{ category: "Quick Actions", items: QUICK_ACTIONS }];
    }

    const qLower = trimmed.toLowerCase();
    const matchingQuick = QUICK_ACTIONS.filter(
      (a) =>
        a.title.toLowerCase().includes(qLower) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(qLower))
    );

    if (trimmed.length < 2) {
      return matchingQuick.length > 0
        ? [{ category: "Quick Actions", items: matchingQuick }]
        : [];
    }

    if (liveGroups.length === 0 && matchingQuick.length > 0) {
      return [{ category: "Quick Actions", items: matchingQuick }];
    }

    return liveGroups;
  }, [hasQuery, trimmed, liveGroups]);

  const flatItems = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups]
  );

  return {
    groups,
    flatItems,
    loading,
    hasQuery,
  };
}
