import React, { Suspense } from "react";
import OpportunityCatalog from "@/components/OpportunityCatalog";

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading catalog...</div>}>
      <OpportunityCatalog
        title="Explore Opportunities"
        subtitle="Discover verified hackathons, internships, fellowships, and expert workshops from top tech organizations."
      />
    </Suspense>
  );
}
