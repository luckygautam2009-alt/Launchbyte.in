import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicMetadata(
  "About LaunchByte",
  "Learn about LaunchByte's mission to deliver verified hackathons, fellowships, transparent event hosting, and student builder networks.",
  "/about"
);

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
