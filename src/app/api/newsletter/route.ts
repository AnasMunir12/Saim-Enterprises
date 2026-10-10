import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { createId } from "@/lib/site-data";
import { Newsletter } from "@/models/Newsletter";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

// Light in-memory throttle: 5 attempts per IP per 10 minutes. It resets on server restart and is per
// instance, which is enough to stop a casual script; it is not a substitute for a WAF.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, number[]>();

function limited(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 5000) {
    for (const [k, times] of attempts) if (times.every((time) => now - time >= WINDOW_MS)) attempts.delete(k);
  }
  return recent.length > MAX_ATTEMPTS;
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

const THANKS = "Thank you. You are on the list.";

export async function POST(request: Request) {
  try {
    if (limited(clientKey(request))) {
      return NextResponse.json({ message: "Too many attempts. Please try again in a few minutes." }, { status: 429, headers: { ...NO_STORE, "Retry-After": "600" } });
    }

    let body: { email?: unknown; website?: unknown; source?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400, headers: NO_STORE });
    }

    // Honeypot: real visitors never see or fill the hidden "website" field. Pretend success to bots.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ message: THANKS }, { headers: NO_STORE });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || !EMAIL.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400, headers: NO_STORE });
    }
    const source = typeof body.source === "string" && /^[a-z0-9-]{1,40}$/.test(body.source) ? body.source : "website";

    await connectDB();
    // One atomic upsert keyed on the address: an existing subscriber is left untouched, a new one is inserted.
    // The response is identical either way so the list cannot be probed for addresses.
    await Newsletter.updateOne({ email }, { $setOnInsert: { _id: createId("subscriber"), email, source } }, { upsert: true });
    // Make sure the unique index exists (a no-op once it does); duplicates are already prevented above.
    void Newsletter.createIndexes().catch(() => undefined);

    return NextResponse.json({ message: THANKS }, { headers: NO_STORE });
  } catch (error) {
    console.error("Newsletter signup failed:", error);
    return NextResponse.json({ message: "We could not subscribe you right now. Please try again." }, { status: 500 });
  }
}
