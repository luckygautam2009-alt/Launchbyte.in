import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Event Pass",
};

export default function PassesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
