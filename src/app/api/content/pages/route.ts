import { adminRoute, ok } from "@/lib/api";
import { readSitePages } from "@/lib/site-content";

export const dynamic = "force-dynamic";

// The five information pages with their current wording (the built-in text for pages never edited).
export const GET = adminRoute("load the pages", async () => ok(await readSitePages()));
