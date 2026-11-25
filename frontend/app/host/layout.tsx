import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicMetadata(
  "Host an Event",
  "Submit your hackathon, workshop, or developer meetup to LaunchByte for rapid review, verified listing, and builder outreach.",
  "/host"
);

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
