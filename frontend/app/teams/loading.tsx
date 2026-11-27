import React from "react";

export default function TeamsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-white/[0.08] rounded-lg" />
          <div className="h-4 w-72 bg-white/[0.04] rounded-md" />
        </div>
        <div className="h-10 w-36 bg-white/[0.08] rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white/80 dark:bg-[#0c0d1d]/80 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/[0.08]" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-2/3 bg-white/[0.08] rounded" />
                <div className="h-3 w-1/3 bg-white/[0.04] rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-white/[0.05] rounded" />
            <div className="h-3 w-4/5 bg-white/[0.04] rounded" />
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="h-6 w-24 bg-white/[0.06] rounded-full" />
              <div className="h-8 w-20 bg-white/[0.08] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
