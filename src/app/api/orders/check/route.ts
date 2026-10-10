import { NextResponse } from "next/server";

import { checkLines, parseQuantities } from "@/lib/cart-check";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Read-only: reports current price and stock for the items in a bag so the cart can be kept honest.
// It exposes only what the public product API already exposes.
export async function POST(request: Request) {
  try {
    let body: { items?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const parsed = parseQuantities(body.items);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400, headers: NO_STORE });
    }

    const lines = await checkLines(parsed.quantities);
    return NextResponse.json({ lines }, { headers: NO_STORE });
  } catch (error) {
    console.error("Cart check failed:", error);
    return NextResponse.json({ message: "Unable to check your bag." }, { status: 500 });
  }
}
