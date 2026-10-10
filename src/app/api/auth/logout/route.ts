import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Customer sign-out. Clears the session cookie; the bag stays in the shopper's browser storage.
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ message: "Signed out." });
}
