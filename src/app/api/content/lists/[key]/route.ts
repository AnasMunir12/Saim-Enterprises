import { NextResponse } from "next/server";

import { adminRoute, ApiError, apiError, isAdminRequest, ok, readJsonObject } from "@/lib/api";
import { isContentListKey } from "@/lib/content-lists";
import { connectDB } from "@/lib/mongodb";
import { parseListItems } from "@/lib/site-content-input";
import { readList, resetList, saveList } from "@/lib/site-content";

export const dynamic = "force-dynamic";

type Params = { key: string };

function listKey(key: string) {
  if (!isContentListKey(key)) throw new ApiError("List not found.", 404);
  return key;
}

// Visitors only receive active items; the dashboard (signed-in admin) receives all of them.
export async function GET(_request: Request, context: { params: Promise<Params> }) {
  try {
    const key = listKey((await context.params).key);
    await connectDB();
    return NextResponse.json(await readList(key, { activeOnly: !(await isAdminRequest()) }), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) return apiError(error.message, error.status);
    console.error("Content list read failed:", error);
    return apiError("Unable to load this list.", 500);
  }
}

// Replaces the whole list with the items sent, in the order sent.
export const PUT = adminRoute<Params>("save the list", async ({ request, params }) => {
  const key = listKey(params.key);
  await saveList(key, parseListItems(key, (await readJsonObject(request)).items));
  return ok(await readList(key));
});

// Forgets the saved list so the built-in default shows again.
export const DELETE = adminRoute<Params>("restore the default list", async ({ params }) => {
  const key = listKey(params.key);
  await resetList(key);
  return ok(await readList(key));
});
