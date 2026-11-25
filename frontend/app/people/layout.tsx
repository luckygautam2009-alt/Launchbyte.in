import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicMetadata(
  "Discover Builders",
  "Connect with verified student engineers, product designers, and hackathon teammates across India and worldwide.",
  "/people"
);

export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
