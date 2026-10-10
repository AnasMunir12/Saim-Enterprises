import { adminRoute, ok, readJsonObject } from "@/lib/api";
import { applyOrder } from "@/lib/crud";
import { HeroSlide } from "@/models/HeroSlide";

export const dynamic = "force-dynamic";

// Body: { ids: string[] } in the desired display order.
export const POST = adminRoute("reorder the hero slides", async ({ request }) => {
  await applyOrder(HeroSlide, (await readJsonObject(request)).ids, "order");
  return ok({ message: "Order saved." });
});
