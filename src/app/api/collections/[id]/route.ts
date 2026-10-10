import { adminRoute, ApiError, ok, presentDoc, readJsonObject } from "@/lib/api";
import { COLLECTION_SPEC } from "@/lib/catalog-input";
import { uniqueSlug } from "@/lib/crud";
import { parseFields } from "@/lib/validate";
import { Collection } from "@/models/Collection";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

type Params = { id: string };

export const PUT = adminRoute<Params>(
  "update the collection",
  async ({ request, params }) => {
    const values = parseFields(await readJsonObject(request), COLLECTION_SPEC, { partial: true });
    const update: Record<string, unknown> = { ...values };
    if (typeof values.name === "string") update.slug = await uniqueSlug(Collection, values.name, "collection", params.id);
    const collection = await Collection.findByIdAndUpdate(params.id, { $set: update }, { returnDocument: "after", runValidators: true });
    if (!collection) throw new ApiError("Collection not found.", 404);
    return ok(presentDoc(collection));
  },
  { duplicateMessage: "A collection with this name already exists." },
);

// Products in the collection stay in the shop; they just no longer belong to a collection.
export const DELETE = adminRoute<Params>("delete the collection", async ({ params }) => {
  const deleted = await Collection.findByIdAndDelete(params.id);
  if (!deleted) throw new ApiError("Collection not found.", 404);
  await Product.updateMany({ collectionId: params.id }, { $unset: { collectionId: "" } });
  return ok({ message: "Collection deleted." });
});
