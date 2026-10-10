import { NextResponse } from "next/server";

import { adminRoute, isAdminRequest, ok, presentDoc, readJsonObject } from "@/lib/api";
import { HERO_SPEC, withHeroDefaults } from "@/lib/hero-input";
import { nextOrder } from "@/lib/crud";
import { connectDB } from "@/lib/mongodb";
import { serializeRecords } from "@/lib/mongo-record";
import { createId } from "@/lib/site-data";
import { parseFields } from "@/lib/validate";
import { HeroSlide } from "@/models/HeroSlide";

export const dynamic = "force-dynamic";

// Visitors only receive active slides; the dashboard (signed-in admin) receives all of them.
export async function GET() {
  try {
    await connectDB();
    const filter = (await isAdminRequest()) ? {} : { active: { $ne: false } };
    const slides = await HeroSlide.find(filter).sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json(serializeRecords(slides as Array<Record<string, unknown>>), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Hero slides read failed:", error);
    return NextResponse.json({ message: "Unable to load hero slides." }, { status: 500 });
  }
}

export const POST = adminRoute("create the hero slide", async ({ request }) => {
  const values = withHeroDefaults(parseFields(await readJsonObject(request), HERO_SPEC));
  const slide = await HeroSlide.create({ ...values, _id: createId("hero"), active: values.active ?? true, order: await nextOrder(HeroSlide, "order") });
  return ok(presentDoc(slide), 201);
});
