import type { Metadata } from "next";
import ExploreGate from "@/components/auth/ExploreGate";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Network",
};

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return <ExploreGate>{children}</ExploreGate>;
}
