import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { postLoginPath, resolveRole, safeNextPath } from "@/lib/auth-redirect";
import {
  GOOGLE_OAUTH_COOKIE,
  GOOGLE_TOKEN_ENDPOINT,
  decodeJwtPayload,
  decodeOAuthCookie,
  getBaseUrl,
  getGoogleRedirectUri,
  isGoogleConfigured,
  safeEqual,
  validateIdTokenClaims,
} from "@/lib/google-oauth";
import { isSuspended } from "@/lib/customers";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const base = getBaseUrl();
  const fail = (code: string) => {
    const response = NextResponse.redirect(`${base}/login?error=${code}`);
    // The flow cookie is single use whatever the outcome.
    response.cookies.set(GOOGLE_OAUTH_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });
    return response;
  };

  if (!isGoogleConfigured()) {
    return fail("google_not_configured");
  }

  const params = new URL(request.url).searchParams;

  if (params.get("error")) {
    return fail("google_denied");
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const rawCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_OAUTH_COOKIE}=`))
    ?.slice(GOOGLE_OAUTH_COOKIE.length + 1);
  const flow = decodeOAuthCookie(rawCookie);
  const state = params.get("state");
  const code = params.get("code");

  if (!flow || !state || !code || !safeEqual(state, flow.state)) {
    return fail("google_state");
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: getGoogleRedirectUri(),
        grant_type: "authorization_code",
        code_verifier: flow.verifier,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      console.error("Google token exchange failed with status", tokenResponse.status);
      return fail("google_failed");
    }

    const tokens = (await tokenResponse.json()) as { id_token?: string };
    const result = validateIdTokenClaims(
      tokens.id_token ? decodeJwtPayload(tokens.id_token) : null,
      process.env.GOOGLE_CLIENT_ID as string,
      flow.nonce,
    );

    if (!result.ok) {
      return fail(result.error);
    }

    const { googleId, email, name, avatar } = result.profile;

    await connectDB();

    // 1) Known Google account. 2) Existing account with the same (Google-verified) email: link it. 3) New customer.
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        if (user.googleId && user.googleId !== googleId) {
          // Email already linked to a different Google identity: never overwrite.
          return fail("google_failed");
        }
        user.googleId = googleId;
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save();
      } else {
        try {
          user = await User.create({ name, email, googleId, avatar, role: "customer" });
        } catch (error) {
          if (error && typeof error === "object" && "code" in error && error.code === 11000) {
            // Concurrent first sign-in created the user already.
            user = await User.findOne({ $or: [{ googleId }, { email }] });
          } else {
            throw error;
          }
        }
        if (!user) return fail("google_failed");
      }
    }

    if (isSuspended(user)) {
      return fail("google_suspended");
    }

    const role = resolveRole(user.role);
    await setSessionCookie(String(user._id), role);

    // Customers return to the page they came from; admins always go to their dashboard.
    const destination = role === "admin" ? postLoginPath(role) : (safeNextPath(flow.next) ?? postLoginPath(role));
    const response = NextResponse.redirect(`${base}${destination}`);
    response.cookies.set(GOOGLE_OAUTH_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    return fail("google_failed");
  }
}
