import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { availabilityForStock } from "@/lib/inventory";
import { connectDB } from "@/lib/mongodb";
import { serializeRecords } from "@/lib/mongo-record";
import { generateSku, parseProductInput } from "@/lib/product-input";
import { MAX_FEATURED_PRODUCTS } from "@/lib/products";
import { createId } from "@/lib/site-data";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

// Admins receive every product (drafts included). The public storefront only receives live products;
// out-of-stock products stay visible and carry availability "Out of stock".
export async function GET() {
  try {
    await connectDB();
    const admin = await requireAdminUser();
    const filter = admin ? {} : { active: { $ne: false }, status: { $nin: ["draft", "inactive"] } };
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(serializeRecords(products as Array<Record<string, unknown>>), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Products read failed:", error);
    return NextResponse.json({ message: "Unable to load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    if (typeof payload.name !== "string" || !payload.name.trim() || payload.price === undefined || !payload.categoryId) {
      return NextResponse.json({ message: "Name, price and category are required." }, { status: 400 });
    }

    if (payload.status === undefined && payload.active === undefined) payload.status = "draft";

    const parsed = parseProductInput(payload);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }
    const values = parsed.values;

    if (values.featured === true && await Product.countDocuments({ featured: true }) >= MAX_FEATURED_PRODUCTS) {
      return NextResponse.json({ message: `A maximum of ${MAX_FEATURED_PRODUCTS} products can be featured on the homepage.` }, { status: 400 });
    }
    if (!(await Category.exists({ _id: values.categoryId as string }))) {
      return NextResponse.json({ message: "Category not found." }, { status: 400 });
    }

    const sku = (values.sku as string | undefined) || generateSku();
    if (await Product.exists({ sku })) {
      return NextResponse.json({ message: "Another product already uses this SKU." }, { status: 409 });
    }

    const stock = (values.stock as number | undefined) ?? 0;
    const image = (values.image as string | undefined) ?? "";
    const description = (values.description as string | undefined) ?? "";
    const shortDescription = (values.shortDescription as string | undefined) || description;

    const created = await Product.create({
      featured: false,
      customizable: false,
      images: image ? [image] : [],
      thumbnail: image,
      tags: [],
      seoTitle: values.name,
      seoDescription: shortDescription,
      ...values,
      _id: createId("product"),
      shortDescription,
      description,
      sku,
      stock,
      availability: availabilityForStock(stock),
      image,
    });

    return NextResponse.json({ ...created.toObject(), id: String(created._id), _id: undefined }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "A product with this slug already exists." }, { status: 409 });
    }
    console.error("Product create failed:", error);
    return NextResponse.json({ message: "Could not create product." }, { status: 500 });
  }
}
