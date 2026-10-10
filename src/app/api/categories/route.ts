import { NextResponse } from "next/server";

import { adminRoute, ok, presentDoc, readJsonObject } from "@/lib/api";
import { CATEGORY_SPEC } from "@/lib/catalog-input";
import { uniqueSlug } from "@/lib/crud";
import { connectDB } from "@/lib/mongodb";
import { serializeRecords } from "@/lib/mongo-record";
import { createId } from "@/lib/site-data";
import { parseFields } from "@/lib/validate";
import { Category } from "@/models/Category";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 }).lean();
    return NextResponse.json(serializeRecords(categories as Array<Record<string, unknown>>), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Categories read failed:", error);
    return NextResponse.json({ message: "Unable to load categories." }, { status: 500 });
  }
}

export const POST = adminRoute(
  "create the category",
  async ({ request }) => {
    const values = parseFields(await readJsonObject(request), CATEGORY_SPEC);
    const slug = await uniqueSlug(Category, values.name as string, "category");
    const category = await Category.create({ ...values, _id: createId("category"), slug, active: values.active ?? true });
    return ok(presentDoc(category), 201);
  },
  { duplicateMessage: "A category with this name already exists." },
);
