import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import { Testimonial } from "@/models/Testimonial";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  try {
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const { id } = await params;
    const payload = (await request.json()) as Record<string, unknown>;
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) return NextResponse.json({ message: "Testimonial not found." }, { status: 404 });
    for (const field of ["name", "role", "quote", "image", "active"]) {
      if (field in payload) testimonial.set(field, payload[field]);
    }
    await testimonial.save();
    return NextResponse.json({ ...testimonial.toObject(), id: String(testimonial._id), _id: undefined });
  } catch (error) {
    console.error("Testimonial update failed:", error);
    return NextResponse.json({ message: "Could not update testimonial." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const { id } = await params;
    const deleted = await Testimonial.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: "Testimonial not found." }, { status: 404 });
    return NextResponse.json({ message: "Testimonial deleted." });
  } catch (error) {
    console.error("Testimonial delete failed:", error);
    return NextResponse.json({ message: "Could not delete testimonial." }, { status: 500 });
  }
}
