import React from "react";

export default function PeopleLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-white/[0.08] rounded-lg" />
        <div className="h-4 w-80 bg-white/[0.04] rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.07] bg-[#0c0d1d]/80 p-5 text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-white/[0.08] mx-auto" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-white/[0.08] rounded mx-auto" />
              <div className="h-3 w-24 bg-white/[0.04] rounded mx-auto" />
            </div>
            <div className="h-8 w-full bg-white/[0.06] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
