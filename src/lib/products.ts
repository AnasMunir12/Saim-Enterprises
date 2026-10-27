import { LOW_STOCK_THRESHOLD, stockState } from "@/lib/inventory";

/** A product shows one main image plus extras, up to this many pictures in total. */
export const MAX_PRODUCT_IMAGES = 8;
export const MAX_FEATURED_PRODUCTS = 5;

// Client-safe storefront product. Built from the public /api/products record with `toStoreProduct`.
export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  /** Original price, only present when it is higher than `price` (a real markdown). */
  compareAtPrice?: number;
  /** Category display name. */
  category: string;
  categoryId?: string;
  categorySlug?: string;
  collectionId?: string;
  image: string;
  images?: string[];
  /** Short description. */
  detail: string;
  description?: string;
  sku?: string;
  /** Units on hand. 0 means sold out. */
  stock: number;
  availability: string;
  status: "active" | "draft" | "inactive";
  customizable?: boolean;
  material?: string;
  dimensions?: string;
  color?: string;
  tags?: string[];
  createdAt?: string;
  // There is no review system yet, so rating and reviews are never invented or rendered.
  rating?: number;
  reviews?: number;
  badge?: string;
  featured?: boolean;
  bestseller?: boolean;
};

export const formatPrice = (price: number) => `PKR ${price.toLocaleString("en-PK")}`;

export { LOW_STOCK_THRESHOLD };

export function isSoldOut(product: Pick<Product, "stock">) {
  return stockState(product.stock) === "out";
}

export function isLowStock(product: Pick<Product, "stock">) {
  return stockState(product.stock) === "low";
}

/** Whole-number percentage saved, or 0 when there is no real markdown. */
export function discountPercent(product: Pick<Product, "price" | "compareAtPrice">) {
  const compare = product.compareAtPrice;
  if (!compare || compare <= product.price || compare <= 0) return 0;
  return Math.round(((compare - product.price) / compare) * 100);
}

/** The most a customer can put in the bag for this product. */
export function maxOrderQuantity(product: Pick<Product, "stock">) {
  return Math.max(0, Math.min(99, Math.floor(Number(product.stock) || 0)));
}

export function stockMessage(product: Pick<Product, "stock">) {
  const state = stockState(product.stock);
  if (state === "out") return "Sold out";
  if (state === "low") return `Only ${product.stock} left`;
  return "In stock";
}

type CategoryLookup = Map<string, { name: string; slug: string }>;

const text = (value: unknown) => (typeof value === "string" ? value : "");
const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Maps a raw API product record into the storefront shape. Stock is never guessed: missing means 0. */
export function toStoreProduct(item: Record<string, unknown>, categories?: CategoryLookup): Product {
  const categoryId = text(item.categoryId);
  const category = categories?.get(categoryId);
  const price = number(item.price);
  const compare = number(item.compareAtPrice);
  const image = text(item.image) || text(item.thumbnail);
  const gallery = Array.isArray(item.images)
    ? (item.images as unknown[]).filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "")
    : [];
  const images = [...new Set([image, ...gallery].filter(Boolean))];
  const stock = Math.max(0, Math.floor(number(item.stock)));
  const status = item.status === "draft" || item.status === "inactive" ? item.status : "active";

  return {
    id: String(item.id),
    name: text(item.name),
    slug: text(item.slug),
    price,
    compareAtPrice: compare > price ? compare : undefined,
    category: category?.name ?? "Uncategorized",
    categoryId: categoryId || undefined,
    categorySlug: category?.slug,
    collectionId: text(item.collectionId) || undefined,
    image: images[0] ?? "",
    images,
    detail: text(item.shortDescription) || text(item.description),
    description: text(item.description) || text(item.shortDescription),
    sku: text(item.sku) || undefined,
    stock,
    availability: stock > 0 ? "In stock" : "Out of stock",
    status,
    customizable: Boolean(item.customizable),
    material: text(item.material) || undefined,
    dimensions: text(item.dimensions) || undefined,
    color: text(item.color) || undefined,
    tags: Array.isArray(item.tags) ? (item.tags as unknown[]).filter((tag): tag is string => typeof tag === "string") : [],
    createdAt: text(item.createdAt) || undefined,
    featured: Boolean(item.featured),
  };
}

/** In-stock first, sold-out last, otherwise keeping the incoming order. */
export function soldOutLast<T extends Pick<Product, "stock">>(products: T[]): T[] {
  return [...products.filter((product) => !isSoldOut(product)), ...products.filter(isSoldOut)];
}
