import React from "react";

export default function OpportunitiesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-64 bg-white/[0.08] rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-white/[0.04] rounded-md" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-center gap-3 py-2">
        <div className="h-10 w-72 bg-white/[0.06] rounded-xl" />
        <div className="h-10 w-28 bg-white/[0.05] rounded-xl" />
        <div className="h-10 w-28 bg-white/[0.05] rounded-xl" />
        <div className="h-10 w-32 bg-white/[0.05] rounded-xl" />
      </div>

      {/* Grid of opportunity cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white/80 dark:bg-[#0c0d1d]/80 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/[0.08]" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-white/[0.08] rounded" />
                <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-white/[0.05] rounded" />
              <div className="h-3 w-5/6 bg-white/[0.04] rounded" />
            </div>
            <div className="flex gap-2 pt-3">
              <div className="h-6 w-16 bg-white/[0.06] rounded-full" />
              <div className="h-6 w-20 bg-white/[0.06] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
