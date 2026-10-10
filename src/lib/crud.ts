import type { Model } from "mongoose";

import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/site-data";

// Small helpers shared by the content CRUD routes (categories, collections, hero slides, testimonials, homepage).

// The content models all use string ids and share these few operations; the document shape does not matter here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = Model<any>;

/**
 * Slug for `name`, guaranteed unique among `model`'s documents (the document `excludeId` is ignored, so renaming
 * a record to its own current name is fine). Throws a readable 409 when another record already uses it.
 */
export async function uniqueSlug(model: AnyModel, name: string, kind: string, excludeId?: string) {
  const slug = slugify(name);
  if (!slug) throw new ApiError(`The ${kind} name needs at least one letter or number.`);
  const clash = await model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
  if (clash) throw new ApiError(`A ${kind} with this name already exists.`, 409);
  return slug;
}

/** Order value that puts a new record after all existing ones. */
export async function nextOrder(model: AnyModel, field: string) {
  const top = await model.findOne({}).sort({ [field]: -1 }).select(field).lean<Record<string, number>>();
  return (top?.[field] ?? 0) + 1;
}

/** Persists a new ordering: the id at position N gets `field = N + 1`. Unknown ids are ignored. */
export async function applyOrder(model: AnyModel, ids: unknown, field: string) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 || ids.some((id) => typeof id !== "string")) {
    throw new ApiError("A list of ids is required.");
  }
  const list = ids as string[];
  if (new Set(list).size !== list.length) throw new ApiError("The list contains duplicates.");
  await model.bulkWrite(list.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { [field]: index + 1 } } } })));
}
