"use client";

import React from "react";
import RequireAuth from "./RequireAuth";

/**
 * Explore / Hackathons are public by default: the data is public, search engines can index them,
 * and visitors no longer wait for /users/me (a cold-backend round trip) before seeing anything.
 * To bring the login wall back set NEXT_PUBLIC_REQUIRE_LOGIN_TO_EXPLORE=true (also read by middleware.ts).
 */
const REQUIRE_LOGIN = process.env.NEXT_PUBLIC_REQUIRE_LOGIN_TO_EXPLORE === "true";

export default function ExploreGate({ children }: { children: React.ReactNode }) {
  if (REQUIRE_LOGIN) return <RequireAuth>{children}</RequireAuth>;
  return <>{children}</>;
}
