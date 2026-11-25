import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Verify Email",
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
