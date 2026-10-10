import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { isOrderStatus, ORDER_STATUSES } from "@/lib/order-status";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const q = (params.get("q") ?? "").trim().slice(0, 80);
    const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(params.get("limit") ?? "20", 10) || 20));

    if (status && status !== "all" && !isOrderStatus(status)) {
      return NextResponse.json({ message: "Invalid status filter." }, { status: 400 });
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (q) {
      const pattern = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ customerName: pattern }, { customerEmail: pattern }, { _id: pattern }, { phone: pattern }];
    }

    const [orders, total, statusCounts] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const counts: Record<string, number> = Object.fromEntries(ORDER_STATUSES.map((value) => [value, 0]));
    for (const row of statusCounts as Array<{ _id: string; count: number }>) counts[row._id] = row.count;

    return NextResponse.json({
      orders: (orders as unknown as Array<Record<string, unknown>>).map(({ _id, ...rest }) => ({ ...rest, id: String(_id) })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      counts,
    });
  } catch (error) {
    console.error("Admin orders read failed:", error);
    return NextResponse.json({ message: "Unable to load orders." }, { status: 500 });
  }
}
