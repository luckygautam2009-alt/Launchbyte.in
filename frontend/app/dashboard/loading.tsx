import React from "react";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-white/[0.08] rounded-lg" />
        <div className="h-4 w-72 bg-white/[0.04] rounded-md" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.07] bg-[#0c0d1d]/80 p-5 space-y-2"
          >
            <div className="h-3 w-20 bg-white/[0.04] rounded" />
            <div className="h-7 w-16 bg-white/[0.08] rounded" />
          </div>
        ))}
      </div>

      {/* Main dashboard content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-[#0c0d1d]/80 p-6 h-80" />
        <div className="rounded-2xl border border-white/[0.07] bg-[#0c0d1d]/80 p-6 h-80" />
      </div>
    </div>
  );
}
