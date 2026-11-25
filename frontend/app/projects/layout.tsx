import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicMetadata(
  "Builder Projects",
  "Explore innovative developer projects and hackathon builds shipped by the LaunchByte community.",
  "/projects"
);

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
