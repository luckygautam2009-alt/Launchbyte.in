import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Reset Password",
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
