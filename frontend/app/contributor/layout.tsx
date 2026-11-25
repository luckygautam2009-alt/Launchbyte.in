import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Contributor Access",
};

export default function ContributorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
