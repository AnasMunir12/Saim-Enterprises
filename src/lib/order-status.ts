// Client-safe order status metadata and transition rules.

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Statuses during which the order's items are deducted from inventory.
export const STOCK_HOLDING_STATUSES: ReadonlySet<string> = new Set(["confirmed", "shipped", "delivered"]);

export const ALLOWED_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: ["pending"],
};

export function isOrderStatus(value: unknown): value is OrderStatusValue {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export const ORDER_STATUS_TONES = { pending: "amber", confirmed: "blue", shipped: "violet", delivered: "green", cancelled: "red" } as const;
