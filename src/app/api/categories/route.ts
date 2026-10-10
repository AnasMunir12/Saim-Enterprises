import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { serializeRecords } from "@/lib/mongo-record";
import { createId, slugify } from "@/lib/site-data";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 }).lean();
    return NextResponse.json(serializeRecords(categories as Array<Record<string, unknown>>));
  } catch (error) {
    console.error("Categories read failed:", error);
    return NextResponse.json({ message: "Unable to load categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const payload = (await request.json()) as { name?: string; description?: string; image?: string; active?: boolean };

    if (!payload.name?.trim()) return NextResponse.json({ message: "Category name is required." }, { status: 400 });

    const category = await Category.create({
      _id: createId("category"), name: payload.name.trim(), slug: slugify(payload.name),
      description: payload.description ?? "", image: payload.image ?? "", active: payload.active ?? true,
    });

    return NextResponse.json({ ...category.toObject(), id: String(category._id), _id: undefined }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ message: "A category with this name already exists." }, { status: 409 });
    console.error("Category create failed:", error);
    return NextResponse.json({ message: "Could not create category." }, { status: 500 });
  }
}
