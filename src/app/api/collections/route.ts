import { NextResponse } from "next/server";

import { adminRoute, ok, presentDoc, readJsonObject } from "@/lib/api";
import { COLLECTION_SPEC } from "@/lib/catalog-input";
import { nextOrder, uniqueSlug } from "@/lib/crud";
import { connectDB } from "@/lib/mongodb";
import { serializeRecords } from "@/lib/mongo-record";
import { createId } from "@/lib/site-data";
import { parseFields } from "@/lib/validate";
import { Collection } from "@/models/Collection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const collections = await Collection.find().sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json(serializeRecords(collections as Array<Record<string, unknown>>), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Collections read failed:", error);
    return NextResponse.json({ message: "Unable to load collections." }, { status: 500 });
  }
}

export const POST = adminRoute(
  "create the collection",
  async ({ request }) => {
    const values = parseFields(await readJsonObject(request), COLLECTION_SPEC);
    const slug = await uniqueSlug(Collection, values.name as string, "collection");
    const collection = await Collection.create({
      ...values,
      _id: createId("collection"),
      slug,
      active: values.active ?? true,
      featured: values.featured ?? false,
      sortOrder: await nextOrder(Collection, "sortOrder"),
    });
    return ok(presentDoc(collection), 201);
  },
  { duplicateMessage: "A collection with this name already exists." },
);
