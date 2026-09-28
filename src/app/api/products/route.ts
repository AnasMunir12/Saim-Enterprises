import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { serializeRecords } from "@/lib/mongo-record";
import { slugify, createId } from "@/lib/site-data";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(serializeRecords(products as Array<Record<string, unknown>>));
  } catch (error) {
    console.error("Products read failed:", error);
    return NextResponse.json({ message: "Unable to load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    let payload: {
      name?: string;
      price?: number;
      categoryId?: string;
      description?: string;
      slug?: string;
      featured?: boolean;
      active?: boolean;
      image?: string;
      shortDescription?: string;
    };

    try {
      payload = (await request.json()) as typeof payload;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    if (!payload.name?.trim() || typeof payload.price !== "number" || payload.price < 0 || !payload.categoryId) {
      return NextResponse.json({ message: "Name, price and category are required." }, { status: 400 });
    }

    if (!(await Category.exists({ _id: payload.categoryId }))) {
      return NextResponse.json({ message: "Category not found." }, { status: 400 });
    }

    const status: "draft" | "active" | "inactive" = payload.active ? "active" : "draft";
    const product = {
      _id: createId("product"),
      name: payload.name,
      slug: payload.slug ?? slugify(payload.name),
      shortDescription: payload.shortDescription ?? payload.description ?? "",
      description: payload.description ?? "",
      price: Number(payload.price),
      compareAtPrice: undefined,
      categoryId: payload.categoryId,
      collectionId: undefined,
      sku: `SE-${Date.now()}`,
      stock: 0,
      availability: "In stock",
      status,
      featured: Boolean(payload.featured),
      image: payload.image ?? "",
      images: payload.image ? [payload.image] : [],
      thumbnail: payload.image ?? "",
      tags: [],
      material: "",
      dimensions: "",
      color: "",
      customizable: false,
      seoTitle: payload.name,
      seoDescription: payload.description ?? payload.shortDescription ?? "",
      active: Boolean(payload.active),
    };

    const created = await Product.create(product);

    return NextResponse.json({ ...created.toObject(), id: String(created._id), _id: undefined }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "A product with this slug already exists." }, { status: 409 });
    }
    console.error("Product create failed:", error);
    return NextResponse.json({ message: "Could not create product." }, { status: 500 });
  }
}
