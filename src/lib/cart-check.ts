import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";

// Server-side stock and availability check shared by POST /api/orders and POST /api/orders/check.
// Stock is only read here. It is deducted later, when the admin confirms the order.

export type LineState = "ok" | "unavailable" | "out_of_stock" | "insufficient_stock";

export type CheckedLine = {
  productId: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  /** Units currently on hand (0 when sold out or no longer sold). */
  stock: number;
  quantity: number;
  state: LineState;
};

type Row = {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  stock?: number;
  active?: boolean;
  status?: string;
};

// Same visibility rule as the public product API, so anything a shopper can see can also be ordered.
export function isLive(product: Pick<Row, "active" | "status">) {
  return product.active !== false && product.status !== "draft" && product.status !== "inactive";
}

export async function checkLines(quantities: Map<string, number>): Promise<CheckedLine[]> {
  await connectDB();
  const ids = [...quantities.keys()];
  const rows = await Product.find({ _id: { $in: ids } }).lean<Row[]>();
  const byId = new Map(rows.map((row) => [String(row._id), row]));

  return ids.map((productId) => {
    const quantity = quantities.get(productId) ?? 0;
    const row = byId.get(productId);

    if (!row || !isLive(row)) {
      return { productId, name: row?.name ?? "", image: row?.image ?? "", price: row?.price ?? 0, stock: 0, quantity, state: "unavailable" as const };
    }

    const stock = Math.max(0, Math.floor(Number(row.stock) || 0));
    const state: LineState = stock <= 0 ? "out_of_stock" : quantity > stock ? "insufficient_stock" : "ok";
    return {
      productId,
      name: row.name,
      image: row.image ?? "",
      price: row.price,
      compareAtPrice: row.compareAtPrice && row.compareAtPrice > row.price ? row.compareAtPrice : undefined,
      stock,
      quantity,
      state,
    };
  });
}

export function describeIssue(line: CheckedLine) {
  if (!line.name) return "An item in your bag is no longer available.";
  if (line.state === "out_of_stock") return `"${line.name}" is sold out.`;
  if (line.state === "insufficient_stock") return `Only ${line.stock} of "${line.name}" available (you asked for ${line.quantity}).`;
  return `"${line.name}" is no longer available.`;
}

// Parses [{ productId, quantity }] from an untrusted body into merged quantities.
export function parseQuantities(items: unknown): { ok: true; quantities: Map<string, number> } | { ok: false; message: string } {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return { ok: false, message: "Your bag is empty or has too many items." };
  }
  const quantities = new Map<string, number>();
  for (const raw of items as unknown[]) {
    const line = raw as { productId?: unknown; quantity?: unknown } | null;
    const productId = typeof line?.productId === "string" ? line.productId.trim() : "";
    const quantity = line?.quantity;
    if (!productId || productId.length > 100 || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, message: "Each item needs a valid product and a quantity between 1 and 99." };
    }
    const merged = (quantities.get(productId) ?? 0) + quantity;
    if (merged > 99) return { ok: false, message: "Quantity per product cannot exceed 99." };
    quantities.set(productId, merged);
  }
  return { ok: true, quantities };
}
