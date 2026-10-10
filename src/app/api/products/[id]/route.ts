import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { serializeRecord } from "@/lib/mongo-record";
import { parseProductInput } from "@/lib/product-input";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    const isLive = product.active !== false && !["draft", "inactive"].includes(String(product.status));
    if (!isLive && !(await requireAdminUser())) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json(serializeRecord(product as unknown as Record<string, unknown>), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Product read failed:", error);
    return NextResponse.json({ message: "Unable to load product." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
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

    const parsed = parseProductInput(payload, {
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      status: product.status,
    });
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    const values = parsed.values;
    if (typeof values.categoryId === "string" && values.categoryId !== product.categoryId && !(await Category.exists({ _id: values.categoryId }))) {
      return NextResponse.json({ message: "Category not found." }, { status: 400 });
    }
    if (typeof values.sku === "string" && values.sku && values.sku !== product.sku && (await Product.exists({ sku: values.sku, _id: { $ne: id } }))) {
      return NextResponse.json({ message: "Another product already uses this SKU." }, { status: 409 });
    }

    for (const [field, value] of Object.entries(values)) {
      product.set(field, value);
    }
    if ("image" in values) {
      product.set("thumbnail", values.image);
      if (!("images" in values)) {
        const rest = ((product.images as string[] | undefined) ?? []).slice(1);
        product.set("images", values.image ? [values.image, ...rest] : rest);
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
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

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
