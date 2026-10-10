import { adminRoute, ok, readJsonObject } from "@/lib/api";
import { applyOrder } from "@/lib/crud";
import { Testimonial } from "@/models/Testimonial";

export const dynamic = "force-dynamic";

// Body: { ids: string[] } in the desired display order.
export const POST = adminRoute("reorder the testimonials", async ({ request }) => {
  await applyOrder(Testimonial, (await readJsonObject(request)).ids, "order");
  return ok({ message: "Order saved." });
});
