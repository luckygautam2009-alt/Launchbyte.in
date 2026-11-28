import React, { Suspense } from "react";
import type { Metadata } from "next";
import OpportunityCatalog from "@/components/OpportunityCatalog";
import PageHero from "@/components/common/PageHero";
import ExploreGate from "@/components/auth/ExploreGate";

export const metadata: Metadata = {
  title: "Explore Opportunities",
  description:
    "Discover verified hackathons, internships, fellowships, and workshops curated for student engineers and builders.",
  alternates: { canonical: "/opportunities" },
  openGraph: {
    title: "Explore Opportunities | LaunchByte",
    description:
      "Discover verified hackathons, internships, fellowships, and workshops curated for student engineers and builders.",
    url: "/opportunities",
  },
};

export default function OpportunitiesPage() {
  return (
    <ExploreGate>
      <div className="min-h-screen bg-transparent dark:bg-[#050510]">
        <PageHero
          eyebrow="OPPORTUNITY HUB"
          title={
            <>
              Explore{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 dark:from-indigo-400 dark:via-cyan-400 dark:to-purple-400 bg-clip-text text-transparent">
                Opportunities
              </span>
            </>
          }
          subtitle="Discover verified hackathons, internships, fellowships, and expert workshops from top tech organizations."
        />
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#424C63] dark:text-slate-400">Loading catalog...</div>}>
          <OpportunityCatalog
            title="Explore Opportunities"
            subtitle="Discover verified hackathons, internships, fellowships, and expert workshops from top tech organizations."
            hideHeader={true}
          />
        </Suspense>
      </div>
    </ExploreGate>
  );
}
