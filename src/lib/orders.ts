import type { IOrder } from "@/models/Order";

export type OrderView = {
  id: string;
  status: IOrder["status"];
  total: number;
  phone?: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items: { productId: string; name: string; image: string; price: number; quantity: number }[];
};

// Customer-safe projection of an order (no userId / email leaks beyond the owner's own view).
export function toOrderView(order: Record<string, unknown>): OrderView {
  const items = Array.isArray(order.items) ? (order.items as OrderView["items"]) : [];
  return {
    id: String(order._id),
    status: order.status as OrderView["status"],
    total: Number(order.total),
    phone: typeof order.phone === "string" ? order.phone : undefined,
    shippingAddress: typeof order.shippingAddress === "string" ? order.shippingAddress : undefined,
    notes: typeof order.notes === "string" ? order.notes : undefined,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt ?? ""),
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : typeof order.updatedAt === "string" ? order.updatedAt : undefined,
    items: items.map((item) => ({
      productId: String(item.productId),
      name: String(item.name),
      image: String(item.image ?? ""),
      price: Number(item.price),
      quantity: Number(item.quantity),
    })),
  };
}
