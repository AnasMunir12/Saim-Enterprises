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

export async function createSessionToken(userId: string): Promise<string> {
  const payload = {
    sub: userId,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = await signEncodedPayload(encoded);

  return `${encoded}.${signature}`;
}

export async function verifySessionToken(token?: string): Promise<{ userId: string; exp: number } | null> {
  if (!token) {
    return null;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = await signEncodedPayload(encoded);

  if (signature !== expected) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as {
      sub?: string;
      exp?: number;
    };

    if (!payload.sub || !payload.exp) {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    return { userId: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}
