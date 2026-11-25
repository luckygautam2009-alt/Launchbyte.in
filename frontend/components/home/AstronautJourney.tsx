"use client";

import React from "react";

export default function AstronautJourney({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="relative w-full">{children}</div>;
}
