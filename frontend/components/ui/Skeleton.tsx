import React from "react";
import { clsx } from "clsx";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse skeleton-shimmer",
        className
      )}
      {...props}
    />
  );
}

export function OpportunityCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white/90 dark:bg-slate-900/60 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-4 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="w-3/4 h-5 rounded" />
        <Skeleton className="w-full h-4 rounded" />
        <Skeleton className="w-2/3 h-4 rounded" />
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        <Skeleton className="w-20 h-6 rounded-lg" />
        <Skeleton className="w-24 h-6 rounded-lg" />
        <div className="ml-auto">
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
