const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

/**
 * Resolve backend-relative `/uploads/...` URLs against the API origin
 * while leaving absolute URLs and static frontend paths untouched.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/uploads")) {
    return `${API_ORIGIN}${trimmed}`;
  }
  return trimmed;
}
