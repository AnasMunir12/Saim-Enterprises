// Google OAuth 2.0 (authorization code + PKCE) helpers. Plain fetch, no extra dependencies.
import { createHash, createPublicKey, randomBytes, timingSafeEqual, verify as verifySignature, type JsonWebKey } from "crypto";

export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_ENDPOINT = "https://www.googleapis.com/oauth2/v3/certs";
export const GOOGLE_OAUTH_COOKIE = "saim_google_oauth";
export const GOOGLE_OAUTH_COOKIE_MAX_AGE = 60 * 10;
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_CLOCK_SKEW_MS = 60_000;

type GoogleJwk = JsonWebKey & { kid: string; alg?: string; use?: string };

let cachedGoogleKeys: { keys: GoogleJwk[]; expiresAt: number } | null = null;

/** `next` is the same-site page to return to after sign-in (for example checkout). */
export type GoogleOAuthCookie = { state: string; verifier: string; nonce: string; next?: string };

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
};

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function getBaseUrl() {
  const configuredUrl = process.env.NEXTAUTH_URL?.trim();
  if (!configuredUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_URL must be set to the public site origin in production.");
    }
    return "http://localhost:3000";
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("NEXTAUTH_URL must be an absolute site origin.");
  }

  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:") ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error("NEXTAUTH_URL must be the site origin only; production URLs must use HTTPS.");
  }

  return url.origin;
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

function decodeJwtHeader(jwt: string): Record<string, unknown> | null {
  const [encodedHeader] = jwt.split(".");
  if (!encodedHeader) return null;
  try {
    const header: unknown = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
    return header && typeof header === "object" && !Array.isArray(header) ? header as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

async function getGoogleSigningKeys(forceRefresh = false): Promise<GoogleJwk[]> {
  if (!forceRefresh && cachedGoogleKeys && cachedGoogleKeys.expiresAt > Date.now()) {
    return cachedGoogleKeys.keys;
  }

  const response = await fetch(GOOGLE_JWKS_ENDPOINT, { cache: "no-store" });
  if (!response.ok) throw new Error(`Google signing-key request failed with status ${response.status}.`);

  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("keys" in body) || !Array.isArray(body.keys)) {
    throw new Error("Google returned an invalid signing-key set.");
  }

  const keys = body.keys.filter((value): value is GoogleJwk => {
    if (!value || typeof value !== "object") return false;
    const key = value as Record<string, unknown>;
    return key.kty === "RSA"
      && typeof key.kid === "string"
      && typeof key.n === "string"
      && typeof key.e === "string"
      && (key.use === undefined || key.use === "sig")
      && (key.alg === undefined || key.alg === "RS256");
  });
  if (keys.length === 0) throw new Error("Google did not return any usable signing keys.");

  const maxAge = response.headers.get("cache-control")?.match(/max-age=(\d+)/i)?.[1];
  const cacheDuration = Math.min(Number(maxAge ?? 300), 3600) * 1000;
  cachedGoogleKeys = { keys, expiresAt: Date.now() + Math.max(cacheDuration, 60_000) };
  return keys;
}

export async function verifyGoogleIdToken(idToken: string, clientId: string, nonce: string): Promise<ClaimsResult> {
  const parts = idToken.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return { ok: false, error: "google_failed" };
  }

  const header = decodeJwtHeader(idToken);
  if (header?.alg !== "RS256" || typeof header.kid !== "string") {
    return { ok: false, error: "google_failed" };
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const keys = await getGoogleSigningKeys(attempt === 1);
      const jwk = keys.find((key) => key.kid === header.kid);
      if (!jwk) continue;

      const publicKey = createPublicKey({ key: jwk, format: "jwk" });
      const verified = verifySignature(
        "RSA-SHA256",
        Buffer.from(`${parts[0]}.${parts[1]}`),
        publicKey,
        Buffer.from(parts[2], "base64url"),
      );
      if (!verified) continue;

      return validateIdTokenClaims(decodeJwtPayload(idToken), clientId, nonce);
    } catch (error) {
      if (attempt === 1) {
        console.error("Google ID token verification failed:", error);
        return { ok: false, error: "google_failed" };
      }
    }
  }

  return { ok: false, error: "google_failed" };
}

export type ClaimsResult = { ok: true; profile: GoogleProfile } | { ok: false; error: "google_failed" | "google_unverified" };

/**
 * Validates standard Google ID-token claims after the token signature has been checked against Google's JWKS.
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
    exp * 1000 < Date.now() - GOOGLE_CLOCK_SKEW_MS ||
    typeof claims.iat !== "number" ||
    claims.iat * 1000 > Date.now() + GOOGLE_CLOCK_SKEW_MS ||
    typeof claims.nonce !== "string" ||
    !safeEqual(claims.nonce, nonce) ||
    typeof sub !== "string" ||
    !sub ||
    typeof email !== "string" ||
    !email
  ) {
    return { ok: false, error: "google_failed" };
  }

  if (claims.email_verified !== true) {
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
