import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Wishlist } from "@/models/Wishlist";

export const dynamic = "force-dynamic";

const MAX_WISHLIST = 200;
const NO_STORE = { "Cache-Control": "no-store" };

// The wishlist is always keyed by the SESSION user. No endpoint accepts a userId.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Please sign in." }, { status: 401, headers: NO_STORE });
    }

    await connectDB();
    const wishlist = await Wishlist.findOne({ userId: user.id }).lean<{ productIds?: string[] }>();
    return NextResponse.json({ productIds: wishlist?.productIds ?? [] }, { headers: NO_STORE });
  } catch (error) {
    console.error("Wishlist read failed:", error);
    return NextResponse.json({ message: "Unable to load wishlist." }, { status: 500 });
  }
}

// Toggle: adds the product if absent, removes it if present.
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Please sign in." }, { status: 401, headers: NO_STORE });
    }

    let body: { productId?: unknown };
    try {
      body = (await request.json()) as { productId?: unknown };
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    if (!productId || productId.length > 100) {
      return NextResponse.json({ message: "A valid productId is required." }, { status: 400 });
    }

    await connectDB();
    const existing = await Wishlist.findOne({ userId: user.id }).lean<{ productIds?: string[] }>();
    const has = existing?.productIds?.includes(productId) ?? false;

    if (has) {
      const updated = await Wishlist.findOneAndUpdate(
        { userId: user.id },
        { $pull: { productIds: productId } },
        { returnDocument: "after" },
      ).lean<{ productIds?: string[] }>();
      return NextResponse.json({ productIds: updated?.productIds ?? [], wished: false }, { headers: NO_STORE });
    }

    const product = await Product.findOne({ _id: productId, active: { $ne: false }, status: "active" }).select("_id").lean();
    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }
    if ((existing?.productIds?.length ?? 0) >= MAX_WISHLIST) {
      return NextResponse.json({ message: "Your wishlist is full." }, { status: 400 });
    }

    const updated = await Wishlist.findOneAndUpdate(
      { userId: user.id },
      { $addToSet: { productIds: productId } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).lean<{ productIds?: string[] }>();

    return NextResponse.json({ productIds: updated?.productIds ?? [], wished: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("Wishlist toggle failed:", error);
    return NextResponse.json({ message: "Unable to update wishlist." }, { status: 500 });
  }
}
