export const AUTH_COOKIE_NAME = "saim_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not defined. Add it to your .env.local file.");
  }

  return secret;
}

function toBase64Url(value: string | Uint8Array): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function signEncodedPayload(encoded: string): Promise<string> {
  const secretBytes = new TextEncoder().encode(getAuthSecret());
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));

  return Array.from(new Uint8Array(signatureBytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export type SessionRole = "admin" | "customer";

export interface SessionPayload {
  userId: string;
  role: SessionRole;
  exp: number;
  // Issued-at (ms). Legacy tokens without the claim are treated as issued at exp - SESSION_MAX_AGE.
  iat: number;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return diff === 0;
}

export async function createSessionToken(userId: string, role: SessionRole = "customer"): Promise<string> {
  const now = Date.now();
  const payload = {
    sub: userId,
    role: role === "admin" ? "admin" : "customer",
    iat: now,
    exp: now + SESSION_MAX_AGE * 1000,
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = await signEncodedPayload(encoded);

  return `${encoded}.${signature}`;
}

// Tokens without a valid role claim (legacy tokens) are rejected, never treated as admin.
export async function verifySessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = await signEncodedPayload(encoded);

  if (!constantTimeEqual(signature, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as {
      sub?: string;
      role?: string;
      exp?: number;
      iat?: number;
    };

    if (!payload.sub || !payload.exp) {
      return null;
    }

    if (payload.role !== "admin" && payload.role !== "customer") {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    const iat = typeof payload.iat === "number" ? payload.iat : payload.exp - SESSION_MAX_AGE * 1000;

    return { userId: payload.sub, role: payload.role, exp: payload.exp, iat };
  } catch {
    return null;
  }
}
