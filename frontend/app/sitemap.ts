import { MetadataRoute } from "next";

export const revalidate = 3600;

/**
 * Only the public marketing pages are listed. Opportunities, events, teams, people and projects
 * need a signed-in account (see middleware.ts), so crawlers can't see them and they are not listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://launchbyte.io").replace(/\/$/, "");
  const now = new Date();

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/host`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
