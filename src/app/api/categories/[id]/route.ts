import { adminRoute, ApiError, ok, presentDoc, readJsonObject } from "@/lib/api";
import { CATEGORY_SPEC } from "@/lib/catalog-input";
import { uniqueSlug } from "@/lib/crud";
import { parseFields } from "@/lib/validate";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

type Params = { id: string };

export const PUT = adminRoute<Params>(
  "update the category",
  async ({ request, params }) => {
    const values = parseFields(await readJsonObject(request), CATEGORY_SPEC, { partial: true });
    const update: Record<string, unknown> = { ...values };
    if (typeof values.name === "string") update.slug = await uniqueSlug(Category, values.name, "category", params.id);
    const category = await Category.findByIdAndUpdate(params.id, { $set: update }, { returnDocument: "after", runValidators: true });
    if (!category) throw new ApiError("Category not found.", 404);
    return ok(presentDoc(category));
  },
  { duplicateMessage: "A category with this name already exists." },
);

export const DELETE = adminRoute<Params>("delete the category", async ({ params }) => {
  const inUse = await Product.countDocuments({ categoryId: params.id });
  if (inUse > 0) throw new ApiError(`This category still has ${inUse} product${inUse === 1 ? "" : "s"}. Move or delete them first.`, 409);
  const deleted = await Category.findByIdAndDelete(params.id);
  if (!deleted) throw new ApiError("Category not found.", 404);
  return ok({ message: "Category deleted." });
});
