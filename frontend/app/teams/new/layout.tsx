import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Create Team",
};

export default function NewTeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
