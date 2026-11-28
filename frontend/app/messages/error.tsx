"use client";

import { useEffect } from "react";

/** Keeps a crash inside Messages from blanking the whole app with Next's generic error page. */
export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Messages page crashed:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h2 className="text-xl font-bold text-[#17172B] dark:text-white mb-2">Chat could not load</h2>
      <p className="text-sm text-[#424C63] dark:text-slate-400 mb-6">Something went wrong while opening your messages.</p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
