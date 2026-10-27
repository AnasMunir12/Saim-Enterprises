import { availabilityForStock, parseStock } from "@/lib/inventory";
import { MAX_PRODUCT_IMAGES } from "@/lib/products";
import { slugify } from "@/lib/site-data";

type Result = { ok: true; values: Record<string, unknown> } | { ok: false; message: string };

const STATUSES = ["draft", "active", "inactive"] as const;
const TEXT_FIELDS = ["shortDescription", "description", "sku", "image", "thumbnail", "material", "dimensions", "color", "seoTitle", "seoDescription", "collectionId"] as const;

function toMoney(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

/**
 * Validates and normalises an admin product payload into a flat set of fields to write.
 * `current` is the stored product for updates (used to cross-check price vs compare-at price
 * and to keep status/active/availability consistent).
 */
export function parseProductInput(payload: Record<string, unknown>, current?: { price?: number; compareAtPrice?: number; stock?: number; status?: string }): Result {
  const values: Record<string, unknown> = {};

  if ("name" in payload) {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!name) return { ok: false, message: "Product name is required." };
    values.name = name;
  }

  if ("slug" in payload || "name" in payload) {
    const raw = typeof payload.slug === "string" && payload.slug.trim() ? payload.slug : "name" in payload && !current ? String(payload.name) : "";
    if (raw) {
      const slug = slugify(raw);
      if (!slug) return { ok: false, message: "Slug must contain letters or numbers." };
      values.slug = slug;
    }
  }

  if ("price" in payload) {
    const price = toMoney(payload.price);
    if (price === null || Number.isNaN(price)) return { ok: false, message: "Price must be a number of 0 or more." };
    values.price = price;
  }

  const price = (values.price as number | undefined) ?? current?.price;
  if ("compareAtPrice" in payload) {
    const compare = toMoney(payload.compareAtPrice);
    if (Number.isNaN(compare)) return { ok: false, message: "Compare-at price must be a number of 0 or more." };
    values.compareAtPrice = compare === null || compare === 0 ? undefined : compare;
  }
  const compareAtPrice = "compareAtPrice" in values ? (values.compareAtPrice as number | undefined) : current?.compareAtPrice;
  if (compareAtPrice !== undefined && price !== undefined && compareAtPrice <= price) {
    return { ok: false, message: "Compare-at price must be higher than the price." };
  }

  if ("stock" in payload) {
    const stock = parseStock(payload.stock);
    if (stock === null) return { ok: false, message: "Stock must be a whole number of 0 or more." };
    values.stock = stock;
  }

  for (const field of TEXT_FIELDS) {
    if (field in payload) {
      if (payload[field] !== null && payload[field] !== undefined && typeof payload[field] !== "string") {
        return { ok: false, message: `${field} must be text.` };
      }
      values[field] = typeof payload[field] === "string" ? (payload[field] as string).trim() : "";
    }
  }
  if (values.collectionId === "") values.collectionId = undefined;

  if ("categoryId" in payload) {
    if (typeof payload.categoryId !== "string" || !payload.categoryId) return { ok: false, message: "Category is required." };
    values.categoryId = payload.categoryId;
  }

  for (const field of ["featured", "customizable"] as const) {
    if (field in payload) {
      if (typeof payload[field] !== "boolean") return { ok: false, message: `${field} must be on or off.` };
      values[field] = payload[field];
    }
  }

  for (const field of ["images", "tags"] as const) {
    if (field in payload) {
      if (!Array.isArray(payload[field]) || (payload[field] as unknown[]).some((item) => typeof item !== "string")) {
        return { ok: false, message: `${field} must be a list of text values.` };
      }
      values[field] = payload[field];
    }
  }
  if (Array.isArray(values.images) && values.images.length > MAX_PRODUCT_IMAGES) {
    return { ok: false, message: `A product can have at most ${MAX_PRODUCT_IMAGES} images (a main image and ${MAX_PRODUCT_IMAGES - 1} more).` };
  }

  // status and the legacy `active` flag always move together.
  if ("status" in payload) {
    if (!(STATUSES as readonly string[]).includes(payload.status as string)) return { ok: false, message: "Invalid status." };
    values.status = payload.status;
  } else if (typeof payload.active === "boolean") {
    values.status = payload.active ? "active" : current?.status === "draft" ? "draft" : "inactive";
  }
  if (values.status !== undefined) values.active = values.status === "active";

  // availability text is derived from stock, never trusted from the client.
  if ("stock" in values) values.availability = availabilityForStock(values.stock as number);

  return { ok: true, values };
}

export function generateSku() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SE-${random}`;
}
