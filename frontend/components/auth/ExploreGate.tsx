"use client";

import React from "react";
import RequireAuth from "./RequireAuth";

/**
 * Explore, Hackathons, Events, Projects, Teams, People and Network need a signed-in user.
 * middleware.ts blocks cookie-less visitors before the page even renders; this wrapper also
 * covers an expired token. The backend enforces the same rule (REQUIRE_LOGIN_TO_EXPLORE).
 * Set NEXT_PUBLIC_REQUIRE_LOGIN_TO_EXPLORE=false to open browsing up again.
 */
const REQUIRE_LOGIN = process.env.NEXT_PUBLIC_REQUIRE_LOGIN_TO_EXPLORE !== "false";

export default function ExploreGate({ children }: { children: React.ReactNode }) {
  if (REQUIRE_LOGIN) return <RequireAuth>{children}</RequireAuth>;
  return <>{children}</>;
}
