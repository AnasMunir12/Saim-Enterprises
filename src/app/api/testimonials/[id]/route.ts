import { adminRoute, ApiError, ok, presentDoc, readJsonObject } from "@/lib/api";
import { TESTIMONIAL_SPEC } from "@/lib/testimonial-input";
import { parseFields } from "@/lib/validate";
import { Testimonial } from "@/models/Testimonial";

export const dynamic = "force-dynamic";

type Params = { id: string };

export const PUT = adminRoute<Params>("update the testimonial", async ({ request, params }) => {
  const body = await readJsonObject(request);
  const values = parseFields(body, TESTIMONIAL_SPEC, { partial: true });
  // `rating: null` removes the stars from this testimonial.
  const update = body.rating === null ? { $set: values, $unset: { rating: "" } } : { $set: values };
  const testimonial = await Testimonial.findByIdAndUpdate(params.id, update, { returnDocument: "after", runValidators: true });
  if (!testimonial) throw new ApiError("Testimonial not found.", 404);
  return ok(presentDoc(testimonial));
});

export const DELETE = adminRoute<Params>("delete the testimonial", async ({ params }) => {
  const deleted = await Testimonial.findByIdAndDelete(params.id);
  if (!deleted) throw new ApiError("Testimonial not found.", 404);
  return ok({ message: "Testimonial deleted." });
});
