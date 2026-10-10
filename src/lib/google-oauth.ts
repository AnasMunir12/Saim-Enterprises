// Google OAuth 2.0 (authorization code + PKCE) helpers. Plain fetch, no extra dependencies.
import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_OAUTH_COOKIE = "saim_google_oauth";
export const GOOGLE_OAUTH_COOKIE_MAX_AGE = 60 * 10;
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

/** `next` is the same-site page to return to after sign-in (for example checkout). */
export type GoogleOAuthCookie = { state: string; verifier: string; nonce: string; next?: string };

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
};

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getBaseUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function getGoogleRedirectUri() {
  return `${getBaseUrl()}/api/auth/google/callback`;
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function encodeOAuthCookie(value: GoogleOAuthCookie) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function decodeOAuthCookie(raw: string | undefined): GoogleOAuthCookie | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<GoogleOAuthCookie>;
    if (typeof parsed.state === "string" && typeof parsed.verifier === "string" && typeof parsed.nonce === "string") {
      return { state: parsed.state, verifier: parsed.verifier, nonce: parsed.nonce, next: typeof parsed.next === "string" ? parsed.next : undefined };
    }
  } catch {
    // fall through
  }
  return null;
}

export function buildGoogleAuthUrl(clientId: string, cookie: GoogleOAuthCookie) {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: cookie.state,
    nonce: cookie.nonce,
    code_challenge: pkceChallenge(cookie.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export type ClaimsResult = { ok: true; profile: GoogleProfile } | { ok: false; error: "google_failed" | "google_unverified" };

/**
 * Validates the id_token claims. The token is received directly from Google's token endpoint over TLS
 * in exchange for our client secret, so (per Google's OpenID Connect docs) signature verification is not
 * required; we still check issuer, audience, expiry, nonce and email_verified.
 */
export function validateIdTokenClaims(claims: Record<string, unknown> | null, clientId: string, nonce: string): ClaimsResult {
  if (!claims) return { ok: false, error: "google_failed" };

  const { iss, aud, exp, sub, email, name, picture } = claims;
  const audOk = aud === clientId || (Array.isArray(aud) && aud.includes(clientId));

  if (
    typeof iss !== "string" ||
    !GOOGLE_ISSUERS.includes(iss) ||
    !audOk ||
    typeof exp !== "number" ||
    exp * 1000 < Date.now() ||
    typeof claims.nonce !== "string" ||
    !safeEqual(claims.nonce, nonce) ||
    typeof sub !== "string" ||
    !sub ||
    typeof email !== "string" ||
    !email
  ) {
    return { ok: false, error: "google_failed" };
  }

  // email_verified must be the boolean true (Google sometimes serialises it as the string "true").
  if (claims.email_verified !== true && claims.email_verified !== "true") {
    return { ok: false, error: "google_unverified" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  return {
    ok: true,
    profile: {
      googleId: sub,
      email: normalizedEmail,
      name: (typeof name === "string" && name.trim()) || normalizedEmail.split("@")[0],
      avatar: typeof picture === "string" ? picture : undefined,
    },
  };
}
