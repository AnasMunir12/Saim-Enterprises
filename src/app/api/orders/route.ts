import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { checkLines, describeIssue, parseQuantities } from "@/lib/cart-check";
import { connectDB } from "@/lib/mongodb";
import { toOrderView } from "@/lib/orders";
import { createId } from "@/lib/site-data";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_OPEN_ORDERS = 20;

// Only the signed-in customer's own orders are ever returned.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Please sign in." }, { status: 401, headers: NO_STORE });
    }

    await connectDB();
    const orders = await Order.find({ userId: user.id }).sort({ createdAt: -1 }).limit(100).lean<Array<Record<string, unknown>>>();
    return NextResponse.json({ orders: orders.map(toOrderView) }, { headers: NO_STORE });
  } catch (error) {
    console.error("Orders read failed:", error);
    return NextResponse.json({ message: "Unable to load orders." }, { status: 500 });
  }
}

function cleanText(value: unknown, max: number): string | null {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;
  // Strip control characters except newlines/tabs.
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return cleaned.length > max ? null : cleaned;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Please sign in to place an order." }, { status: 401, headers: NO_STORE });
    }

    let body: { items?: unknown; phone?: unknown; shippingAddress?: unknown; notes?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const phone = cleanText(body.phone, 20);
    const shippingAddress = cleanText(body.shippingAddress, 500);
    const notes = cleanText(body.notes, 1000);

    if (phone === null || !/^[0-9+()\-\s]{6,20}$/.test(phone)) {
      return NextResponse.json({ message: "Please enter a valid phone number." }, { status: 400 });
    }
    if (shippingAddress === null || shippingAddress.length < 5) {
      return NextResponse.json({ message: "Please enter your shipping address." }, { status: 400 });
    }
    if (notes === null) {
      return NextResponse.json({ message: "Notes are too long." }, { status: 400 });
    }

    const parsed = parseQuantities(body.items);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    await connectDB();

    const open = await Order.countDocuments({ userId: user.id, status: "pending" });
    if (open >= MAX_OPEN_ORDERS) {
      return NextResponse.json({ message: "You have too many pending orders. Please wait for confirmation." }, { status: 429 });
    }

    // Availability is enforced here, on the server, never trusted from the browser. Stock itself is not
    // deducted at placement; the admin deducts it when confirming the order.
    const checked = await checkLines(parsed.quantities);
    const problems = checked.filter((line) => line.state !== "ok");
    if (problems.length > 0) {
      return NextResponse.json(
        {
          message: `Some items in your bag can't be ordered right now. ${problems.map(describeIssue).join(" ")}`,
          issues: problems.map((line) => ({
            productId: line.productId,
            name: line.name,
            reason: line.state,
            requested: line.quantity,
            available: line.stock,
          })),
        },
        { status: 409, headers: NO_STORE },
      );
    }

    const items = checked.map((line) => ({ productId: line.productId, name: line.name, image: line.image, price: line.price, quantity: line.quantity }));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      _id: createId("order"),
      userId: user.id, // always from the session
      customerName: user.name,
      customerEmail: user.email,
      phone,
      shippingAddress,
      notes: notes || undefined,
      items,
      total,
      status: "pending",
    });

    return NextResponse.json({ order: toOrderView(order.toObject() as Record<string, unknown>) }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error("Order create failed:", error);
    return NextResponse.json({ message: "Could not place your order." }, { status: 500 });
  }
}
