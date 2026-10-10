import { CONTENT_LISTS, type ContentListItems, type ContentListKey, type ResolvedList } from "@/lib/content-lists";
import { connectDB } from "@/lib/mongodb";
import { resolveSitePage, SITE_PAGE_SLUGS, type PageContent, type ResolvedPage, type SitePageSlug } from "@/lib/site-pages";
import { ContentList } from "@/models/ContentList";
import { SitePage } from "@/models/SitePage";

// Database access for the editable site content. Anything never saved resolves to its built-in default.

export async function readList<K extends ContentListKey>(key: K, options: { activeOnly?: boolean } = {}): Promise<ResolvedList<K>> {
  const stored = await ContentList.findById(key).lean<{ items: ContentListItems[K][] }>();
  const list: ResolvedList<K> = stored ? { items: stored.items, saved: true } : { items: CONTENT_LISTS[key].defaults, saved: false };
  return options.activeOnly ? { ...list, items: list.items.filter((item) => item.active) } : list;
}

export async function saveList<K extends ContentListKey>(key: K, items: ContentListItems[K][]) {
  await ContentList.findByIdAndUpdate(key, { $set: { items } }, { upsert: true, runValidators: true });
}

/** Forgets the saved list, so the built-in default shows again. */
export async function resetList(key: ContentListKey) {
  await ContentList.deleteOne({ _id: key });
}

/** Storefront read: only active items. A database failure shows the defaults, never an error page. */
export async function getActiveListItems<K extends ContentListKey>(key: K): Promise<ContentListItems[K][]> {
  try {
    await connectDB();
    return (await readList(key, { activeOnly: true })).items;
  } catch (error) {
    console.error(`Reading the ${key} list failed:`, error);
    return CONTENT_LISTS[key].defaults.filter((item) => item.active);
  }
}

type StoredPage = PageContent & { _id: string };

export async function readSitePages(): Promise<ResolvedPage[]> {
  const stored = await SitePage.find().lean<StoredPage[]>();
  const byId = new Map(stored.map((page) => [page._id, page]));
  return SITE_PAGE_SLUGS.map((slug) => resolveSitePage(slug, byId.get(slug) ?? null));
}

export async function readSitePage(slug: SitePageSlug): Promise<ResolvedPage> {
  return resolveSitePage(slug, await SitePage.findById(slug).lean<StoredPage>());
}

export async function saveSitePage(slug: SitePageSlug, values: Partial<PageContent>) {
  await SitePage.findByIdAndUpdate(slug, { $set: values }, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
}

/** Forgets the edited wording, so the original page shows again. */
export async function resetSitePage(slug: SitePageSlug) {
  await SitePage.deleteOne({ _id: slug });
}

/** Storefront read. A database failure shows the original wording, never an error page. */
export async function getSitePage(slug: SitePageSlug): Promise<ResolvedPage> {
  try {
    await connectDB();
    return await readSitePage(slug);
  } catch (error) {
    console.error(`Reading the ${slug} page failed:`, error);
    return resolveSitePage(slug, null);
  }
}
