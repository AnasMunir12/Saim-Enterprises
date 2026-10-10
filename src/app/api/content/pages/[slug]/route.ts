import { adminRoute, ApiError, ok, readJsonObject } from "@/lib/api";
import { readSitePage, resetSitePage, saveSitePage } from "@/lib/site-content";
import { PAGE_SPEC } from "@/lib/site-content-input";
import { isSitePageSlug } from "@/lib/site-pages";
import { parseFields } from "@/lib/validate";

export const dynamic = "force-dynamic";

type Params = { slug: string };

function pageSlug(slug: string) {
  if (!isSitePageSlug(slug)) throw new ApiError("Page not found.", 404);
  return slug;
}

export const PUT = adminRoute<Params>("save the page", async ({ request, params }) => {
  const slug = pageSlug(params.slug);
  await saveSitePage(slug, parseFields(await readJsonObject(request), PAGE_SPEC));
  return ok(await readSitePage(slug));
});

// Forgets the edited wording so the original page shows again.
export const DELETE = adminRoute<Params>("restore the page", async ({ params }) => {
  const slug = pageSlug(params.slug);
  await resetSitePage(slug);
  return ok(await readSitePage(slug));
});
