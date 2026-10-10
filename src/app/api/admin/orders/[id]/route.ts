import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ALLOWED_TRANSITIONS, isOrderStatus, ORDER_STATUS_LABELS, STOCK_HOLDING_STATUSES } from "@/lib/order-status";
import { deductStock, restoreApplied, restoreStock } from "@/lib/order-stock";
import { Order, type IOrderItem } from "@/models/Order";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function present(order: Record<string, unknown>) {
  const { _id, ...rest } = order;
  return { ...rest, id: String(_id) };
}

export async function GET(_request: Request, { params }: Context) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    const order = await Order.findById(id).lean();
    if (!order) return NextResponse.json({ message: "Order not found." }, { status: 404 });
    return NextResponse.json(present(order as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Admin order read failed:", error);
    return NextResponse.json({ message: "Unable to load order." }, { status: 500 });
  }
}

/**
 * Change an order's status. Stock handling is driven by `stockAdjusted`:
 *  - entering confirmed/shipped/delivered while stockAdjusted is false deducts stock (guarded by stock >= qty);
 *  - entering pending/cancelled while stockAdjusted is true puts the stock back;
 *  - repeating a request that already happened changes nothing, so retries are safe.
 */
export async function PATCH(request: Request, { params }: Context) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    let payload: { status?: unknown };
    try {
      payload = (await request.json()) as { status?: unknown };
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    if (!isOrderStatus(payload.status)) {
      return NextResponse.json({ message: "A valid status is required." }, { status: 400 });
    }
    const target = payload.status;

    const order = await Order.findById(id).lean();
    if (!order) return NextResponse.json({ message: "Order not found." }, { status: 404 });

    const from = order.status as keyof typeof ALLOWED_TRANSITIONS;
    if (from === target) {
      return NextResponse.json(present(order as unknown as Record<string, unknown>));
    }
    if (!ALLOWED_TRANSITIONS[from]?.includes(target)) {
      return NextResponse.json({ message: `An order that is ${ORDER_STATUS_LABELS[from] ?? from} cannot be moved to ${ORDER_STATUS_LABELS[target]}.` }, { status: 409 });
    }

    const items = ((order.items ?? []) as IOrderItem[]).map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity }));
    const wasAdjusted = order.stockAdjusted === true;
    const shouldHold = STOCK_HOLDING_STATUSES.has(target);

    let applied: Array<[string, number]> = [];
    if (shouldHold && !wasAdjusted) {
      const result = await deductStock(items);
      if (!result.ok) {
        return NextResponse.json({ message: `Not enough stock for "${result.name}". Restock it before confirming this order.` }, { status: 409 });
      }
      applied = result.applied;
    } else if (!shouldHold && wasAdjusted) {
      await restoreStock(items);
    }

    const nextAdjusted = shouldHold;
    const updated = await Order.findOneAndUpdate(
      { _id: id, status: from, ...(wasAdjusted ? { stockAdjusted: true } : { stockAdjusted: { $ne: true } }) },
      { $set: { status: target, stockAdjusted: nextAdjusted } },
      { returnDocument: "after" },
    ).lean();

    if (!updated) {
      // Someone else changed this order first: undo whatever stock we just moved.
      if (shouldHold && !wasAdjusted) await restoreApplied(applied);
      else if (!shouldHold && wasAdjusted) await deductStock(items);
      return NextResponse.json({ message: "This order was changed elsewhere. Refresh and try again." }, { status: 409 });
    }

    return NextResponse.json(present(updated as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Admin order update failed:", error);
    return NextResponse.json({ message: "Could not update the order." }, { status: 500 });
  }
}
