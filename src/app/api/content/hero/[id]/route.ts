import { adminRoute, ApiError, ok, presentDoc, readJsonObject } from "@/lib/api";
import { HERO_SPEC, withHeroDefaults } from "@/lib/hero-input";
import { parseFields } from "@/lib/validate";
import { HeroSlide } from "@/models/HeroSlide";

export const dynamic = "force-dynamic";

type Params = { id: string };

export const PUT = adminRoute<Params>("update the hero slide", async ({ request, params }) => {
  const values = withHeroDefaults(parseFields(await readJsonObject(request), HERO_SPEC, { partial: true }));
  const slide = await HeroSlide.findByIdAndUpdate(params.id, { $set: values }, { returnDocument: "after", runValidators: true });
  if (!slide) throw new ApiError("Slide not found.", 404);
  return ok(presentDoc(slide));
});

export const DELETE = adminRoute<Params>("delete the hero slide", async ({ params }) => {
  const deleted = await HeroSlide.findByIdAndDelete(params.id);
  if (!deleted) throw new ApiError("Slide not found.", 404);
  return ok({ message: "Slide deleted." });
});
