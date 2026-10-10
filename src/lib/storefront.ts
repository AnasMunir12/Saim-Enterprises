import { headers } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { soldOutLast, toStoreProduct, type Product } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { Category } from "@/models/Category";
import { Product as ProductModel } from "@/models/Product";

// Server-side storefront reads. Visibility matches the public /api/products rule: drafts and
// inactive products never appear; sold-out products stay visible.
const LIVE = { active: { $ne: false }, status: { $nin: ["draft", "inactive"] } } as const;

type Raw = Record<string, unknown>;

function plain(doc: Raw): Raw {
  return {
    ...doc,
    id: String(doc._id),
    _id: undefined,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

async function categoryLookup() {
  const categories = await Category.find().select("name slug").lean<Array<{ _id: string; name: string; slug: string }>>();
  return new Map(categories.map((category) => [String(category._id), { name: category.name, slug: category.slug }]));
}

export async function getLiveProductBySlug(slug: string): Promise<{ product: Product; seoTitle: string; seoDescription: string } | null> {
  if (!slug || slug.length > 200) return null;
  await connectDB();
  const doc = await ProductModel.findOne({ slug, ...LIVE }).lean<Raw>();
  if (!doc) return null;
  const categories = await categoryLookup();
  return {
    product: toStoreProduct(plain(doc), categories),
    seoTitle: typeof doc.seoTitle === "string" ? doc.seoTitle : "",
    seoDescription: typeof doc.seoDescription === "string" ? doc.seoDescription : "",
  };
}

/** Same-category pieces first (in stock before sold out), topped up with other live pieces. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<{ products: Product[]; sameCategory: boolean }> {
  await connectDB();
  const categories = await categoryLookup();
  const siblings = product.categoryId
    ? await ProductModel.find({ ...LIVE, categoryId: product.categoryId, _id: { $ne: product.id } }).sort({ createdAt: -1 }).limit(24).lean<Raw[]>()
    : [];
  const mapped = soldOutLast(siblings.map((doc) => toStoreProduct(plain(doc), categories))).slice(0, limit);
  if (mapped.length >= limit) return { products: mapped, sameCategory: true };

  const taken = new Set([product.id, ...mapped.map((item) => item.id)]);
  const others = await ProductModel.find({ ...LIVE, _id: { $nin: [...taken] }, stock: { $gt: 0 } }).sort({ featured: -1, createdAt: -1 }).limit(limit).lean<Raw[]>();
  const filler = others.map((doc) => toStoreProduct(plain(doc), categories)).slice(0, limit - mapped.length);
  return { products: [...mapped, ...filler], sameCategory: mapped.length > 0 && filler.length === 0 };
}

export async function getContactSettings() {
  const settings = await getSettings();
  return { websiteName: settings.websiteName, whatsapp: settings.whatsapp };
}

/** Absolute origin of this request, used for canonical links and JSON-LD URLs. */
export async function getSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured && /^https?:\/\//.test(configured)) return configured;
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${protocol}://${host}`;
}
