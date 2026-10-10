import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { RichText, RichTitle } from "@/components/layout/RichText";
import { getSitePage } from "@/lib/site-content";
import type { SitePageSlug } from "@/lib/site-pages";

/** Metadata for an information page: the original wording, or the owner's title and intro once edited. */
export async function sitePageMetadata(slug: SitePageSlug): Promise<Metadata> {
  const page = await getSitePage(slug);
  return { title: page.metaTitle, description: page.metaDescription };
}

/** An information page (About, Shipping, Returns, Privacy, Terms) with the wording edited under Site content > Pages. */
export async function SitePage({ slug, after }: { slug: SitePageSlug; after?: ReactNode }) {
  const page = await getSitePage(slug);
  return (
    <PolicyPage eyebrow={page.eyebrow} title={<RichTitle text={page.title} />} intro={page.intro} after={after}>
      <RichText source={page.body} />
    </PolicyPage>
  );
}
