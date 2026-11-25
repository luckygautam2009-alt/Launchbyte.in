import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicMetadata(
  "Live & Upcoming Events",
  "Browse verified developer events, workshops, and hackathons hosted directly on LaunchByte with digital passes and instant check-in.",
  "/events"
);

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
