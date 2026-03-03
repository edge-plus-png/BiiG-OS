import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "biig_session";

const protectedPrefixes = ["/", "/attendance", "/referrals", "/thank-you", "/one-to-ones", "/visitors", "/rota", "/admin"];

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
  );

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/attendance/:path*", "/referrals/:path*", "/thank-you/:path*", "/one-to-ones/:path*", "/visitors/:path*", "/rota/:path*", "/admin/:path*"],
};
