import type { Metadata } from "next";
import { API_URL, APP_URL, buildPublicMetadata, safeJsonLd } from "@/lib/seo";
import type { OpportunityDetail } from "@/lib/types";

async function fetchOpportunity(slug: string): Promise<OpportunityDetail | null> {
  try {
    const res = await fetch(`${API_URL}/opportunities/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as OpportunityDetail;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const opp = await fetchOpportunity(params.slug);
  if (!opp) {
    return buildPublicMetadata(
      "Opportunity Details",
      "Explore verified hackathons, internships, fellowships, and developer opportunities on LaunchByte.",
      `/opportunities/${params.slug}`
    );
  }
  const orgName = opp.organizer_name_override || opp.organization?.name || "LaunchByte";
  const desc =
    opp.summary?.slice(0, 160) ||
    `${opp.title} hosted by ${orgName}. Verified details and direct registration on LaunchByte.`;
  return buildPublicMetadata(
    opp.title,
    desc,
    `/opportunities/${opp.slug}`,
    opp.thumbnail_url
  );
}

export default async function OpportunityDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const opp = await fetchOpportunity(params.slug);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
      { "@type": "ListItem", position: 2, name: "Opportunities", item: `${APP_URL}/opportunities` },
      {
        "@type": "ListItem",
        position: 3,
        name: opp?.title || "Opportunity",
        item: `${APP_URL}/opportunities/${params.slug}`,
      },
    ],
  };

  const eventSchema =
    opp && (opp.type === "hackathon" || opp.type === "event" || opp.type === "competition") && opp.starts_at
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: opp.title,
          description: opp.summary || opp.title,
          startDate: opp.starts_at,
          endDate: opp.ends_at || opp.deadline_at || opp.starts_at,
          eventAttendanceMode:
            opp.location_type === "remote"
              ? "https://schema.org/OnlineEventAttendanceMode"
              : opp.location_type === "hybrid"
                ? "https://schema.org/MixedEventAttendanceMode"
                : "https://schema.org/OfflineEventAttendanceMode",
          organizer: {
            "@type": "Organization",
            name: opp.organizer_name_override || opp.organization?.name || "LaunchByte",
          },
          url: `${APP_URL}/opportunities/${opp.slug}`,
          ...(opp.thumbnail_url ? { image: [opp.thumbnail_url] } : {}),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      {eventSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(eventSchema) }}
        />
      )}
      {children}
    </>
  );
}
