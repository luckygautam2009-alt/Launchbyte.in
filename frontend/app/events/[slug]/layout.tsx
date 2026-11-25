import type { Metadata } from "next";
import { API_URL, APP_URL, buildPublicMetadata, safeJsonLd } from "@/lib/seo";
import type { EventDetail } from "@/lib/types";

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  try {
    const res = await fetch(`${API_URL}/events/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as EventDetail;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await fetchEvent(params.slug);
  if (!event) {
    return buildPublicMetadata(
      "Event Details",
      "Explore verified developer events and hackathons hosted on LaunchByte.",
      `/events/${params.slug}`
    );
  }
  const desc =
    event.tagline?.slice(0, 160) ||
    `${event.title} hosted by ${event.organization?.name || "LaunchByte"}. Register on LaunchByte.`;
  return buildPublicMetadata(
    event.title,
    desc,
    `/events/${event.slug}`,
    event.banner_url || event.thumbnail_url
  );
}

export default async function EventDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const event = await fetchEvent(params.slug);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
      { "@type": "ListItem", position: 2, name: "Events", item: `${APP_URL}/events` },
      {
        "@type": "ListItem",
        position: 3,
        name: event?.title || "Event",
        item: `${APP_URL}/events/${params.slug}`,
      },
    ],
  };

  const eventSchema = event
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        description: event.tagline || event.title,
        startDate: event.starts_at,
        endDate: event.ends_at,
        eventAttendanceMode:
          event.mode === "online"
            ? "https://schema.org/OnlineEventAttendanceMode"
            : event.mode === "hybrid"
              ? "https://schema.org/MixedEventAttendanceMode"
              : "https://schema.org/OfflineEventAttendanceMode",
        eventStatus:
          event.status === "cancelled"
            ? "https://schema.org/EventCancelled"
            : "https://schema.org/EventScheduled",
        location:
          event.mode === "online"
            ? { "@type": "VirtualLocation", url: `${APP_URL}/events/${event.slug}` }
            : {
                "@type": "Place",
                name: event.venue_text || event.venue_city || "In-Person Venue",
              },
        organizer: {
          "@type": "Organization",
          name: event.organization?.name || "LaunchByte",
        },
        url: `${APP_URL}/events/${event.slug}`,
        ...(event.banner_url || event.thumbnail_url
          ? { image: [event.banner_url || event.thumbnail_url] }
          : {}),
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
