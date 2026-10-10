import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { toOrderView } from "@/lib/orders";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

// Scoped by userId in the query itself: someone else's order id is indistinguishable from a missing one.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Please sign in." }, { status: 401 });
    }

    const { id } = await context.params;
    if (typeof id !== "string" || id.length > 100) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    await connectDB();
    const order = await Order.findOne({ _id: id, userId: user.id }).lean<Record<string, unknown>>();
    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order: toOrderView(order) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Order read failed:", error);
    return NextResponse.json({ message: "Unable to load order." }, { status: 500 });
  }
}
