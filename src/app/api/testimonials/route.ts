import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import { serializeRecords } from "@/lib/mongo-record";
import { Testimonial } from "@/models/Testimonial";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(serializeRecords(testimonials as Array<Record<string, unknown>>));
  } catch (error) {
    console.error("Testimonials read failed:", error);
    return NextResponse.json({ message: "Unable to load testimonials." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const payload = (await request.json()) as { name?: string; role?: string; quote?: string; image?: string; active?: boolean };
    if (!payload.name?.trim() || !payload.quote?.trim()) {
      return NextResponse.json({ message: "Name and quote are required." }, { status: 400 });
    }
    const testimonial = await Testimonial.create({
      _id: `testimonial-${Date.now()}`,
      name: payload.name.trim(),
      role: payload.role ?? "",
      quote: payload.quote.trim(),
      image: payload.image ?? "",
      active: payload.active ?? true,
    });
    return NextResponse.json({ ...testimonial.toObject(), id: String(testimonial._id), _id: undefined }, { status: 201 });
  } catch (error) {
    console.error("Testimonial create failed:", error);
    return NextResponse.json({ message: "Could not create testimonial." }, { status: 500 });
  }
}
