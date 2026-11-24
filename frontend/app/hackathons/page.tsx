import React, { Suspense } from "react";
import OpportunityCatalog from "@/components/OpportunityCatalog";
import PageHero from "@/components/common/PageHero";

export default function HackathonsPage() {
  return (
    <div className="min-h-screen bg-[#050510]">
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
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading hackathons...</div>}>
        <OpportunityCatalog
          fixedType="hackathon"
          title="Hackathons"
          subtitle="Compete, build production-grade prototypes, and win prizes in verified global hackathons."
          hideHeader={true}
        />
      </Suspense>
    </div>
  );
}
