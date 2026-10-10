import { Product } from "@/models/Product";

type StockItem = { productId: string; name?: string; quantity: number };

export type StockFailure = { ok: false; productId: string; name: string; reason: "insufficient" };
export type StockSuccess = { ok: true; applied: Array<[string, number]>; missing: string[] };

function merge(items: StockItem[]) {
  const map = new Map<string, { quantity: number; name: string }>();
  for (const item of items) {
    const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!item.productId || quantity === 0) continue;
    const current = map.get(item.productId);
    map.set(item.productId, { quantity: (current?.quantity ?? 0) + quantity, name: current?.name ?? item.name ?? item.productId });
  }
  return map;
}

// Atomically subtract `quantity` guarded by stock >= quantity, keeping availability text in sync.
async function decrement(productId: string, quantity: number) {
  const result = await Product.collection.updateOne(
    { _id: productId as never, stock: { $gte: quantity } },
    [
      { $set: { stock: { $subtract: ["$stock", quantity] }, updatedAt: new Date() } },
      { $set: { availability: { $cond: [{ $lte: ["$stock", 0] }, "Out of stock", "In stock"] } } },
    ],
  );
  return result.modifiedCount === 1;
}

async function increment(productId: string, quantity: number) {
  const result = await Product.collection.updateOne(
    { _id: productId as never },
    [
      { $set: { stock: { $add: [{ $ifNull: ["$stock", 0] }, quantity] }, updatedAt: new Date() } },
      { $set: { availability: { $cond: [{ $lte: ["$stock", 0] }, "Out of stock", "In stock"] } } },
    ],
  );
  return result.matchedCount === 1;
}

/**
 * Deduct stock for every item. Each product is updated atomically with a stock >= qty guard.
 * If any item cannot be fulfilled, everything already deducted is put back and a failure is returned.
 * Products that no longer exist are skipped (reported in `missing`).
 */
export async function deductStock(items: StockItem[]): Promise<StockSuccess | StockFailure> {
  const applied: Array<[string, number]> = [];
  const missing: string[] = [];

  for (const [productId, { quantity, name }] of merge(items)) {
    if (await decrement(productId, quantity)) {
      applied.push([productId, quantity]);
      continue;
    }

    if (await Product.collection.countDocuments({ _id: productId as never }, { limit: 1 }) === 0) {
      missing.push(productId);
      continue;
    }

    await restoreApplied(applied);
    return { ok: false, productId, name, reason: "insufficient" };
  }

  return { ok: true, applied, missing };
}

export async function restoreApplied(applied: Array<[string, number]>) {
  for (const [productId, quantity] of applied) {
    await increment(productId, quantity);
  }
}

// Put an order's items back into stock (products that were deleted meanwhile are ignored).
export async function restoreStock(items: StockItem[]) {
  for (const [productId, { quantity }] of merge(items)) {
    await increment(productId, quantity);
  }
}
