import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

// Returns the signed-in user (no secrets) or `{ user: null }`. Always 200 so the
// storefront can call it on every page without console noise.
export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
    }

    await connectDB();
    const record = await User.findById(current.id).select("avatar checkoutDetails").lean<{
      avatar?: string;
      checkoutDetails?: {
        fullName?: string;
        phone?: string;
        address?: string;
        city?: string;
        postalCode?: string;
      };
    }>();

    return NextResponse.json(
      {
        user: {
          id: current.id,
          name: current.name,
          email: current.email,
          role: current.role,
          avatar: record?.avatar ?? null,
          checkoutDetails: record?.checkoutDetails ?? null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Account lookup failed:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ message: "Please sign in." }, { status: 401 });
    }

    await connectDB();
    await User.updateOne({ _id: current.id }, { $unset: { checkoutDetails: 1 } });
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Saved checkout details removal failed:", error);
    return NextResponse.json({ message: "Unable to remove your saved details." }, { status: 500 });
  }
}
