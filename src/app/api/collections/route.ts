import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { serializeRecords } from "@/lib/mongo-record";
import { createId, slugify } from "@/lib/site-data";
import { connectDB } from "@/lib/mongodb";
import { Collection } from "@/models/Collection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const collections = await Collection.find().sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json(serializeRecords(collections as Array<Record<string, unknown>>));
  } catch (error) {
    console.error("Collections read failed:", error);
    return NextResponse.json({ message: "Unable to load collections." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  try {
    await connectDB();
    const payload = (await request.json()) as { name?: string; description?: string; image?: string; active?: boolean; featured?: boolean };
    if (!payload.name?.trim()) return NextResponse.json({ message: "Collection name is required." }, { status: 400 });
    const count = await Collection.countDocuments();
    const collection = await Collection.create({
      _id: createId("collection"), name: payload.name.trim(), slug: slugify(payload.name),
      description: payload.description ?? "", image: payload.image ?? "", active: payload.active ?? true,
      featured: payload.featured ?? false, sortOrder: count + 1,
    });
    return NextResponse.json({ ...collection.toObject(), id: String(collection._id), _id: undefined }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ message: "A collection with this name already exists." }, { status: 409 });
    console.error("Collection create failed:", error);
    return NextResponse.json({ message: "Could not create collection." }, { status: 500 });
  }
}
