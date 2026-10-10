import { adminRoute, ApiError, ok, readJsonObject } from "@/lib/api";
import { SECTION_SPEC, editableKey, parseSectionItems, readResolvedSection, upsertSection } from "@/lib/homepage-api";
import { builtinByKey, isCustomKey } from "@/lib/homepage-sections";
import { parseFields } from "@/lib/validate";
import { HomepageSection } from "@/models/HomepageSection";

export const dynamic = "force-dynamic";

type Params = { id: string };

// Edits wording or visibility. A built-in section is saved the first time it is changed.
export const PUT = adminRoute<Params>("update the homepage section", async ({ request, params }) => {
  const key = await editableKey(params.id);
  const payload = await readJsonObject(request);
  const values: Record<string, unknown> = parseFields(payload, SECTION_SPEC, { partial: true });
  if (isCustomKey(key) && "title" in values && !values.title) throw new ApiError("Heading is required.");
  const itemsConfig = builtinByKey(key)?.items;
  if (itemsConfig && "items" in payload) values.items = parseSectionItems(itemsConfig, payload.items);
  await upsertSection(key, values);
  return ok(await readResolvedSection(key));
});

// Custom blocks are deleted; a built-in section cannot be deleted, so this puts it back to its default wording.
export const DELETE = adminRoute<Params>("remove the homepage section", async ({ params }) => {
  const key = await editableKey(params.id);
  if (isCustomKey(key)) {
    await HomepageSection.deleteOne({ key });
    return ok({ message: "Block deleted." });
  }
  await HomepageSection.updateOne({ key }, { $set: { title: "", subtitle: "", description: "", image: "", buttonText: "", buttonLink: "", items: [] } });
  return ok({ message: "Section restored to its default wording." });
});
