import React, { Suspense } from "react";
import type { Metadata } from "next";
import OpportunityCatalog from "@/components/OpportunityCatalog";
import PageHero from "@/components/common/PageHero";
import ExploreGate from "@/components/auth/ExploreGate";

export const metadata: Metadata = {
  title: "Hackathons",
  description:
    "Compete, build production-grade prototypes, and discover verified online and in-person hackathons on LaunchByte.",
  alternates: { canonical: "/hackathons" },
  openGraph: {
    title: "Hackathons | LaunchByte",
    description:
      "Compete, build production-grade prototypes, and discover verified online and in-person hackathons on LaunchByte.",
    url: "/hackathons",
  },
};

export default function HackathonsPage() {
  return (
    <ExploreGate>
      <div className="min-h-screen bg-transparent dark:bg-[#050510]">
        <PageHero
          eyebrow="HACKATHON ARENA"
          title={
            <>
              Discover{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Hackathons
              </span>
            </>
          }
          subtitle="Compete, build production-grade prototypes, and win prizes in verified global hackathons."
        />
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#424C63] dark:text-slate-400">Loading hackathons...</div>}>
          <OpportunityCatalog
            fixedType="hackathon"
            title="Hackathons"
            subtitle="Compete, build production-grade prototypes, and win prizes in verified global hackathons."
            hideHeader={true}
          />
        </Suspense>
      </div>
    </ExploreGate>
  );
}
