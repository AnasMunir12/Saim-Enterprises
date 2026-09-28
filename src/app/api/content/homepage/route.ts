import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { serializeRecords } from "@/lib/mongo-record";
import { HomepageSection } from "@/models/HomepageSection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sections = await HomepageSection.find().sort({ order: 1 }).lean();
    return NextResponse.json(serializeRecords(sections as Array<Record<string, unknown>>));
  } catch (error) {
    console.error("Homepage sections read failed:", error);
    return NextResponse.json({ message: "Unable to load homepage sections." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    if (typeof payload.id !== "string") return NextResponse.json({ message: "Section id is required." }, { status: 400 });
    const section = await HomepageSection.findById(payload.id);
    if (!section) {
      return NextResponse.json({ message: "Homepage section not found." }, { status: 404 });
    }

    for (const field of ["key", "title", "subtitle", "description", "image", "buttonText", "buttonLink", "enabled", "order"]) {
      if (field in payload) section.set(field, payload[field]);
    }
    await section.save();

    return NextResponse.json({ ...section.toObject(), id: String(section._id), _id: undefined });
  } catch (error) {
    console.error("Homepage section update failed:", error);
    return NextResponse.json({ message: "Could not update homepage section." }, { status: 500 });
  }
}
