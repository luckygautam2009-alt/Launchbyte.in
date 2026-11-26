"use client";

import { useEffect } from "react";

export function WarmBackend() {
  useEffect(() => {
    // Fire-and-forget fetch to /health to warm Render backend / DB pool
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const healthUrl = `${apiUrl.replace(/\/api\/v1\/?$/, "")}/health`;
      fetch(healthUrl, { method: "GET", mode: "cors", credentials: "omit" }).catch(() => {
        // Safe no-op
      });
    } catch {
      // Safe no-op
    }
  }, []);

  return null;
}
