import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/auth-redirect";
import {
  GOOGLE_OAUTH_COOKIE,
  GOOGLE_OAUTH_COOKIE_MAX_AGE,
  buildGoogleAuthUrl,
  encodeOAuthCookie,
  getBaseUrl,
  isGoogleConfigured,
  randomToken,
} from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

// Starts the Google OAuth flow: stores state + PKCE verifier + nonce in a short-lived httpOnly cookie.
export async function GET(request: Request) {
  const base = getBaseUrl();

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${base}/login?error=google_not_configured`);
  }

  // Remember where the shopper was (same-site paths only) so they land back there after signing in.
  const next = safeNextPath(new URL(request.url).searchParams.get("next")) ?? undefined;
  const flow = { state: randomToken(), verifier: randomToken(48), nonce: randomToken(), next };
  const response = NextResponse.redirect(buildGoogleAuthUrl(process.env.GOOGLE_CLIENT_ID as string, flow));

  response.cookies.set(GOOGLE_OAUTH_COOKIE, encodeOAuthCookie(flow), {
    httpOnly: true,
    path: "/api/auth/google",
    sameSite: "lax", // must be lax: Google redirects back via a cross-site top-level navigation
    secure: process.env.NODE_ENV === "production",
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE,
  });

  return response;
}
