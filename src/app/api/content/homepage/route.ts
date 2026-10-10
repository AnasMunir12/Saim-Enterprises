import { NextResponse } from "next/server";

import { adminRoute, ApiError, ok, readJsonObject } from "@/lib/api";
import { SECTION_SPEC, newCustomKey, readResolvedSection, readResolvedSections } from "@/lib/homepage-api";
import { nextOrder } from "@/lib/crud";
import { sectionId } from "@/lib/homepage-sections";
import { connectDB } from "@/lib/mongodb";
import { parseFields } from "@/lib/validate";
import { HomepageSection } from "@/models/HomepageSection";

export const dynamic = "force-dynamic";

// Public: the merged homepage layout (built-in sections plus any content blocks the owner added).
export async function GET() {
  try {
    await connectDB();
    return NextResponse.json(await readResolvedSections(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Homepage sections read failed:", error);
    return NextResponse.json({ message: "Unable to load homepage sections." }, { status: 500 });
  }
}

// Adds a custom content block at the end of the page.
export const POST = adminRoute("create the homepage block", async ({ request }) => {
  const values = parseFields(await readJsonObject(request), SECTION_SPEC);
  if (!values.title) throw new ApiError("Heading is required.");

  const key = newCustomKey();
  await HomepageSection.create({ ...values, _id: sectionId(key), key, enabled: values.enabled ?? true, order: Math.max(await nextOrder(HomepageSection, "order"), 1000) });
  return ok(await readResolvedSection(key), 201);
});
