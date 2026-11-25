import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Publish Project",
};

export default function NewProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
