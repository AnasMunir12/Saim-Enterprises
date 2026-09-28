import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { Collection } from "@/models/Collection";
import { slugify } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const payload = (await request.json()) as Record<string, unknown>;
    const collection = await Collection.findById(id);
    if (!collection) {
      return NextResponse.json({ message: "Collection not found." }, { status: 404 });
    }

    if (typeof payload.name === "string") {
      collection.name = payload.name.trim();
      collection.slug = slugify(payload.name);
    }
    if ("description" in payload) collection.description = String(payload.description ?? "");
    if ("image" in payload) collection.image = String(payload.image ?? "");
    if (typeof payload.active === "boolean") collection.active = payload.active;
    if (typeof payload.featured === "boolean") collection.featured = payload.featured;
    await collection.save();

    return NextResponse.json({ ...collection.toObject(), id: String(collection._id), _id: undefined });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ message: "A collection with this name already exists." }, { status: 409 });
    console.error("Collection update failed:", error);
    return NextResponse.json({ message: "Could not update collection." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await Collection.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: "Collection not found." }, { status: 404 });
    return NextResponse.json({ message: "Collection deleted." });
  } catch (error) {
    console.error("Collection delete failed:", error);
    return NextResponse.json({ message: "Could not delete collection." }, { status: 500 });
  }
}
