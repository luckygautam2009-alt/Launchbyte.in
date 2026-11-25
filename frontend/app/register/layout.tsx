import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Create Account",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
