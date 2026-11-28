import React from "react";

/**
 * Route-transition fallback. It used to be a full-screen logo splash that covered the navbar on
 * every navigation; now it is a slim top progress bar plus a quiet placeholder, so moving
 * between pages never feels like the app is restarting.
 */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="relative min-h-[50vh]">
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] overflow-hidden bg-transparent pointer-events-none">
        <div className="h-full w-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 -translate-x-full animate-[shimmer_1.1s_infinite]" />
      </div>
    </div>
  );
}
