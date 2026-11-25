import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Messages",
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
