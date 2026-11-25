import { MetadataRoute } from "next";

export const revalidate = 300;

interface SitemapOpportunity {
  slug: string;
  published_at?: string | null;
  updated_at?: string | null;
}

interface SitemapEvent {
  slug: string;
  starts_at?: string | null;
  updated_at?: string | null;
}

async function fetchDynamicSlugs<T>(endpoint: string): Promise<T[]> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
  try {
    const res = await fetch(`${apiUrl}${endpoint}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data as T[];
    if (Array.isArray(data?.items)) return data.items as T[];
    return [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://launchbyte.io").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/opportunities`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/hackathons`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/host`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/teams`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/people`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/projects`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const [opportunities, events] = await Promise.all([
    fetchDynamicSlugs<SitemapOpportunity>("/opportunities?limit=100"),
    fetchDynamicSlugs<SitemapEvent>("/events?limit=100"),
  ]);

  const oppRoutes: MetadataRoute.Sitemap = opportunities
    .filter((item) => Boolean(item?.slug))
    .map((item) => ({
      url: `${baseUrl}/opportunities/${encodeURIComponent(item.slug)}`,
      lastModified: item.updated_at
        ? new Date(item.updated_at)
        : item.published_at
          ? new Date(item.published_at)
          : now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const eventRoutes: MetadataRoute.Sitemap = events
    .filter((item) => Boolean(item?.slug))
    .map((item) => ({
      url: `${baseUrl}/events/${encodeURIComponent(item.slug)}`,
      lastModified: item.updated_at
        ? new Date(item.updated_at)
        : item.starts_at
          ? new Date(item.starts_at)
          : now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  return [...staticRoutes, ...oppRoutes, ...eventRoutes];
}
