import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Explore/Hackathons are public unless explicitly gated (keeps SEO + first paint fast).
  if (process.env.NEXT_PUBLIC_REQUIRE_LOGIN_TO_EXPLORE !== "true") {
    return NextResponse.next();
  }

  const token = request.cookies.get("lb_token")?.value;

  if (!token || token.trim() === "") {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/opportunities", "/opportunities/:path*", "/hackathons", "/hackathons/:path*"],
};
