import type { Metadata } from "next";
import ExploreGate from "@/components/auth/ExploreGate";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicMetadata(
  "Find Hackathon Teams",
  "Discover active developer squads recruiting builders, designers, and AI engineers for upcoming hackathons on LaunchByte.",
  "/teams"
);

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return <ExploreGate>{children}</ExploreGate>;
}
