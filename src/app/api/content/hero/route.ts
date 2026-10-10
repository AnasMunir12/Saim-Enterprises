import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { serializeRecords } from "@/lib/mongo-record";
import { createId } from "@/lib/site-data";
import { connectDB } from "@/lib/mongodb";
import { HeroSlide } from "@/models/HeroSlide";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const slides = await HeroSlide.find().sort({ order: 1 }).lean();
    return NextResponse.json(serializeRecords(slides as Array<Record<string, unknown>>));
  } catch (error) {
    console.error("Hero slides read failed:", error);
    return NextResponse.json({ message: "Unable to load hero slides." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await connectDB();
    const payload = (await request.json()) as {
    eyebrow?: string;
    title?: string;
    description?: string;
    image?: string;
    primaryButtonText?: string;
    primaryButtonUrl?: string;
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;
    active?: boolean;
    };

    if (!payload.title?.trim()) return NextResponse.json({ message: "Slide title is required." }, { status: 400 });

    const order = (await HeroSlide.countDocuments()) + 1;
    const slide = await HeroSlide.create({
    _id: createId("hero"),
    eyebrow: payload.eyebrow ?? "",
    title: payload.title.trim(),
    description: payload.description ?? "",
    image: payload.image ?? "",
    primaryButtonText: payload.primaryButtonText ?? "Explore collection",
    primaryButtonUrl: payload.primaryButtonUrl ?? "/catalog",
    secondaryButtonText: payload.secondaryButtonText ?? "Learn more",
    secondaryButtonUrl: payload.secondaryButtonUrl ?? "/contact",
    active: payload.active ?? true,
    order,
    });

    return NextResponse.json({ ...slide.toObject(), id: String(slide._id), _id: undefined }, { status: 201 });
  } catch (error) {
    console.error("Hero slide create failed:", error);
    return NextResponse.json({ message: "Could not create hero slide." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ message: "Slide id is required." }, { status: 400 });
    const deleted = await HeroSlide.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: "Slide not found." }, { status: 404 });
    return NextResponse.json({ message: "Slide deleted." });
  } catch (error) {
    console.error("Hero slide delete failed:", error);
    return NextResponse.json({ message: "Could not delete hero slide." }, { status: 500 });
  }
}
