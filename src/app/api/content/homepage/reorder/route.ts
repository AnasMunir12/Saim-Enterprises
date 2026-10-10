import { adminRoute, ApiError, ok, readJsonObject } from "@/lib/api";
import { builtinByKey, isCustomKey, keyFromSectionId, sectionId } from "@/lib/homepage-sections";
import { HomepageSection } from "@/models/HomepageSection";

export const dynamic = "force-dynamic";

// Body: { ids: string[] } in the desired top-to-bottom order. Saves a position for every section listed.
export const POST = adminRoute("reorder the homepage", async ({ request }) => {
  const { ids } = await readJsonObject(request);
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200 || ids.some((id) => typeof id !== "string")) throw new ApiError("A list of sections is required.");
  const keys = (ids as string[]).map(keyFromSectionId);
  if (new Set(keys).size !== keys.length) throw new ApiError("The list contains duplicates.");

  const custom = keys.filter(isCustomKey);
  const existing = new Set((await HomepageSection.find({ key: { $in: custom } }).select("key").lean<Array<{ key: string }>>()).map((row) => row.key));
  if (keys.some((key) => !builtinByKey(key) && !existing.has(key))) throw new ApiError("Unknown homepage section.", 404);

  await HomepageSection.bulkWrite(
    keys.map((key, index) => ({
      updateOne: { filter: { key }, update: { $set: { order: index + 1 }, $setOnInsert: { _id: sectionId(key), key } }, upsert: true },
    })),
  );
  return ok({ message: "Order saved." });
});
