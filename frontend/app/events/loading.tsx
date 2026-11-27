import React from "react";

export default function EventsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-60 bg-white/[0.08] rounded-lg" />
        <div className="h-4 w-80 max-w-full bg-white/[0.04] rounded-md" />
      </div>

      {/* Filter / Search tabs */}
      <div className="flex flex-wrap items-center gap-3 py-2">
        <div className="h-10 w-64 bg-white/[0.06] rounded-xl" />
        <div className="h-10 w-24 bg-white/[0.05] rounded-xl" />
        <div className="h-10 w-24 bg-white/[0.05] rounded-xl" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white/80 dark:bg-[#0c0d1d]/80 overflow-hidden space-y-4"
          >
            <div className="h-44 w-full bg-white/[0.06]" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-white/[0.08] rounded" />
              <div className="h-3.5 w-1/2 bg-white/[0.04] rounded" />
              <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                <div className="h-4 w-24 bg-white/[0.05] rounded" />
                <div className="h-8 w-20 bg-white/[0.08] rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
