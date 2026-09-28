import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { serializeRecord } from "@/lib/mongo-record";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json(serializeRecord(product as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Product read failed:", error);
    return NextResponse.json({ message: "Unable to load product." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    const allowedFields = ["name", "slug", "shortDescription", "description", "price", "compareAtPrice", "categoryId", "collectionId", "sku", "stock", "availability", "status", "featured", "image", "images", "thumbnail", "tags", "material", "dimensions", "color", "customizable", "seoTitle", "seoDescription", "active"];
    for (const field of allowedFields) {
      if (field in payload) {
        product.set(field, payload[field]);
      }
    }

    await product.save();

    return NextResponse.json({ ...product.toObject(), id: String(product._id), _id: undefined });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "A product with this slug already exists." }, { status: 409 });
    }
    console.error("Product update failed:", error);
    return NextResponse.json({ message: "Could not update product." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted." });
  } catch (error) {
    console.error("Product delete failed:", error);
    return NextResponse.json({ message: "Could not delete product." }, { status: 500 });
  }
}
