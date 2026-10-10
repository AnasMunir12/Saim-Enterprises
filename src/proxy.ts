import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const authPages = new Set(["/login", "/signup"]);

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

// Edge enforcement of roles. API routes are not matched here and must authorize themselves.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminAuthPage = pathname === "/admin/login" || pathname === "/admin/signup";
  const isAccountRoute = pathname === "/account" || pathname.startsWith("/account/");
  const isAuthPage = authPages.has(pathname);

  if (isAdminAuthPage) {
    // Already-signed-in admins skip the login form; everyone else may see it
    // (a customer session can still open it to sign in with the admin account).
    // ?expired=1 means the dashboard rejected a stale admin cookie (e.g. demoted); don't bounce back.
    if (session?.role === "admin" && !request.nextUrl.searchParams.has("expired")) {
      return redirectTo(request, "/admin/dashboard");
    }
    return NextResponse.next();
  }

  if (isAdminRoute) {
    if (!session) {
      return redirectTo(request, "/admin/login");
    }
    if (session.role !== "admin") {
      return redirectTo(request, "/account");
    }
    return NextResponse.next();
  }

  if (isAccountRoute) {
    return session ? NextResponse.next() : redirectTo(request, `/login?next=${encodeURIComponent(pathname)}`);
  }

  // ?expired=1 means the server rejected this cookie (account suspended or deleted); ?error= carries a sign-in failure
  // message. Show the form in both cases instead of bouncing away (or looping).
  if (isAuthPage && session && !request.nextUrl.searchParams.has("expired") && !request.nextUrl.searchParams.has("error")) {
    return redirectTo(request, session.role === "admin" ? "/admin" : "/account");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*", "/login", "/signup"],
};
