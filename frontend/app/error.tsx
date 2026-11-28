"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: if any page throws, show a friendly retry screen (inside the normal
 * navbar/footer layout) instead of Next's blank "Application error" page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page crashed:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-28 text-center">
      <h2 className="text-xl font-bold text-[#17172B] dark:text-white mb-2">Something went wrong</h2>
      <p className="text-sm text-[#424C63] dark:text-slate-400 mb-6">
        This page hit an unexpected problem. Please try again — if it keeps happening, refresh the site.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium"
        >
          Try again
        </button>
        <a
          href="/"
          className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-[#17172B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          Home
        </a>
      </div>
    </div>
  );
}
