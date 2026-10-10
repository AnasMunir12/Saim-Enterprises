import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { slugify } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const payload = (await request.json()) as Record<string, unknown>;
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    if (typeof payload.name === "string") category.name = payload.name.trim();
    if ("description" in payload) category.description = String(payload.description ?? "");
    if ("image" in payload) category.image = String(payload.image ?? "");
    if (typeof payload.active === "boolean") category.active = payload.active;
    if (typeof payload.name === "string") category.slug = slugify(payload.name);
    await category.save();

    return NextResponse.json({ ...category.toObject(), id: String(category._id), _id: undefined });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ message: "A category with this name already exists." }, { status: 409 });
    console.error("Category update failed:", error);
    return NextResponse.json({ message: "Could not update category." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: "Category not found." }, { status: 404 });
    return NextResponse.json({ message: "Category deleted." });
  } catch (error) {
    console.error("Category delete failed:", error);
    return NextResponse.json({ message: "Could not delete category." }, { status: 500 });
  }
}
