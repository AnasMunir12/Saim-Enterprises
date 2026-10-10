import { adminRoute, ok, readJsonObject } from "@/lib/api";
import { applyOrder } from "@/lib/crud";
import { Collection } from "@/models/Collection";

export const dynamic = "force-dynamic";

// Body: { ids: string[] } in the desired display order.
export const POST = adminRoute("reorder the collections", async ({ request }) => {
  await applyOrder(Collection, (await readJsonObject(request)).ids, "sortOrder");
  return ok({ message: "Order saved." });
});
