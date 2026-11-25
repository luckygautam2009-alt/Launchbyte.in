import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Network",
};

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
