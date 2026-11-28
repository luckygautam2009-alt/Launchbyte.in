import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Browsing needs an account. Set NEXT_PUBLIC_REQUIRE_LOGIN_TO_EXPLORE=false to open it up again.
  if (process.env.NEXT_PUBLIC_REQUIRE_LOGIN_TO_EXPLORE === "false") {
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
  matcher: [
    "/opportunities/:path*",
    "/hackathons/:path*",
    "/events/:path*",
    "/projects/:path*",
    "/teams/:path*",
    "/people/:path*",
    "/network/:path*",
    "/u/:path*",
  ],
};
