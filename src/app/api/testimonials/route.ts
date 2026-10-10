import { NextResponse } from "next/server";

import { adminRoute, isAdminRequest, ok, presentDoc, readJsonObject } from "@/lib/api";
import { nextOrder } from "@/lib/crud";
import { connectDB } from "@/lib/mongodb";
import { serializeRecords } from "@/lib/mongo-record";
import { TESTIMONIAL_SPEC } from "@/lib/testimonial-input";
import { createId } from "@/lib/site-data";
import { parseFields } from "@/lib/validate";
import { Testimonial } from "@/models/Testimonial";

export const dynamic = "force-dynamic";

// Visitors only receive active testimonials; the dashboard (signed-in admin) receives all of them.
export async function GET() {
  try {
    await connectDB();
    const filter = (await isAdminRequest()) ? {} : { active: { $ne: false } };
    const testimonials = await Testimonial.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json(serializeRecords(testimonials as Array<Record<string, unknown>>), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Testimonials read failed:", error);
    return NextResponse.json({ message: "Unable to load testimonials." }, { status: 500 });
  }
}

export const POST = adminRoute("create the testimonial", async ({ request }) => {
  const values = parseFields(await readJsonObject(request), TESTIMONIAL_SPEC);
  const testimonial = await Testimonial.create({
    ...values,
    _id: createId("testimonial"),
    active: values.active ?? true,
    order: await nextOrder(Testimonial, "order"),
  });
  return ok(presentDoc(testimonial), 201);
});
