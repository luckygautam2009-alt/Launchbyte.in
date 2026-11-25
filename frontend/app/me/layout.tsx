import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "My Account",
};

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
