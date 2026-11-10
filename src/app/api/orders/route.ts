import { NextResponse, after } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { checkLines, describeIssue, parseQuantities } from "@/lib/cart-check";
import { BUSINESS_EMAIL } from "@/lib/constants";
import { formatCurrency, sendOrderNotificationEmailJS } from "@/lib/email";
import { connectDB } from "@/lib/mongodb";
import { toOrderView } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { createId } from "@/lib/site-data";
import { Order, type IOrderItem } from "@/models/Order";
import { User } from "@/models/User";

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

    let body: {
      items?: unknown;
      fullName?: unknown;
      email?: unknown;
      phone?: unknown;
      address?: unknown;
      city?: unknown;
      postalCode?: unknown;
      notes?: unknown;
      saveDetails?: unknown;
      checkoutRequestId?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const fullName = cleanText(body.fullName, 100);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = cleanText(body.phone, 20);
    const address = cleanText(body.address, 500);
    const city = cleanText(body.city, 100);
    const postalCode = cleanText(body.postalCode, 20);
    const notes = cleanText(body.notes, 1000);
    const saveDetails = body.saveDetails === true;
    const checkoutRequestId = body.checkoutRequestId;

    if (fullName === null || fullName.length < 2) {
      return NextResponse.json({ message: "Please enter your full name." }, { status: 400 });
    }
    if (!user && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }
    if (phone === null || !/^[0-9+()\-\s]{6,20}$/.test(phone) || phone.replace(/\D/g, "").length < 6) {
      return NextResponse.json({ message: "Please enter a valid phone number." }, { status: 400 });
    }
    if (address === null || address.length < 5) {
      return NextResponse.json({ message: "Please enter your delivery address." }, { status: 400 });
    }
    if (city === null || city.length < 2) {
      return NextResponse.json({ message: "Please enter your city." }, { status: 400 });
    }
    if (postalCode === null) {
      return NextResponse.json({ message: "Postal code is too long." }, { status: 400 });
    }
    if (notes === null) {
      return NextResponse.json({ message: "Notes are too long." }, { status: 400 });
    }
    if (body.saveDetails !== undefined && typeof body.saveDetails !== "boolean") {
      return NextResponse.json({ message: "Invalid saved-details choice." }, { status: 400 });
    }
    if (typeof checkoutRequestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutRequestId)) {
      return NextResponse.json({ message: "Please refresh checkout and try again." }, { status: 400 });
    }

    const parsed = parseQuantities(body.items);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    await connectDB();

    const customerEmail = user?.email.toLowerCase() ?? email;
    const shippingAddress = [address, city, postalCode].filter(Boolean).join(", ");
    const belongsToRequester = (order: { userId?: string; customerEmail?: string }) =>
      user ? order.userId === user.id : !order.userId && order.customerEmail?.toLowerCase() === customerEmail;
    const duplicate = await Order.findOne({ checkoutRequestId }).lean<{ userId?: string; customerEmail?: string } & Record<string, unknown>>();
    if (duplicate) {
      if (!belongsToRequester(duplicate)) {
        return NextResponse.json({ message: "Could not safely verify this checkout request. Please refresh and try again." }, { status: 409, headers: NO_STORE });
      }
      return NextResponse.json({ order: toOrderView(duplicate) }, { headers: NO_STORE });
    }

    const openFilter = user ? { userId: user.id } : { customerEmail };
    const [open, checked] = await Promise.all([
      Order.countDocuments({ ...openFilter, status: "pending" }),
      checkLines(parsed.quantities),
    ]);
    if (open >= MAX_OPEN_ORDERS) {
      return NextResponse.json({ message: "There are too many pending orders for these details. Please contact us to place another order." }, { status: 429 });
    }

    // Availability is enforced here, on the server, never trusted from the browser. Stock itself is not
    // deducted at placement; the admin deducts it when confirming the order.
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

    if (user) {
      if (saveDetails) {
        await User.updateOne(
          { _id: user.id },
          { $set: { checkoutDetails: { fullName, phone, address, city, ...(postalCode ? { postalCode } : {}) } } },
        );
      } else {
        await User.updateOne({ _id: user.id }, { $unset: { checkoutDetails: 1 } });
      }
    }

    let order;
    try {
      order = await Order.create({
        _id: createId("order"),
        ...(user ? { userId: user.id } : {}),
        checkoutRequestId,
        customerName: fullName,
        customerEmail,
        phone,
        shippingAddress,
        notes: notes || undefined,
        items,
        total,
        status: "pending",
      });
    } catch (error) {
      const duplicateKey = error && typeof error === "object" && "code" in error && error.code === 11000;
      if (!duplicateKey) throw error;
      const retryOrder = await Order.findOne({ checkoutRequestId }).lean<Record<string, unknown>>();
      if (!retryOrder || !belongsToRequester(retryOrder as { userId?: string; customerEmail?: string })) throw error;
      return NextResponse.json({ order: toOrderView(retryOrder) }, { headers: NO_STORE });
    }

    after(async () => {
      try {
        const settings = await getSettings();
        const notificationEmail =
          settings.businessOrderEmail.trim() || process.env.BUSINESS_EMAIL?.trim() || BUSINESS_EMAIL;
        const orderDate = order.createdAt
          ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(order.createdAt)
          : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date());

        await sendOrderNotificationEmailJS({
          to_email: notificationEmail,
          order_id: String(order._id),
          customer_name: order.customerName || "Not provided",
          customer_email: order.customerEmail || "Not provided",
          customer_phone: order.phone?.trim() || "Not provided",
          order_items: order.items
            .map((item: IOrderItem) => `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`)
            .join("\n"),
          order_total: formatCurrency(order.total),
          delivery_address: order.shippingAddress?.trim() || "Not provided",
          order_date: orderDate,
        });
      } catch (error) {
        console.error("Order email dispatch failed:", error instanceof Error ? error.message : error);
      }
    });

    return NextResponse.json({ order: toOrderView(order.toObject() as Record<string, unknown>) }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error("Order create failed:", error);
    return NextResponse.json({ message: "Could not place your order." }, { status: 500 });
  }
}
