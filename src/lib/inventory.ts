// Client-safe inventory helpers shared by the storefront API, the admin API and the admin UI.

export const LOW_STOCK_THRESHOLD = 5;

export type StockState = "in" | "low" | "out";

export function stockState(stock: number | undefined | null): StockState {
  const value = Number(stock ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "out";
  if (value <= LOW_STOCK_THRESHOLD) return "low";
  return "in";
}

// The human readable text kept on product.availability. Only 0 stock flips it to "Out of stock".
export function availabilityForStock(stock: number | undefined | null): string {
  return stockState(stock) === "out" ? "Out of stock" : "In stock";
}

// Returns a non-negative integer or null when the value is not a valid stock quantity.
export function parseStock(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0 || parsed > 1_000_000) return null;
  return parsed;
}
