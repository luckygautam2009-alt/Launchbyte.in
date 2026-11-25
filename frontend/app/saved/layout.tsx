import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Saved Opportunities",
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
