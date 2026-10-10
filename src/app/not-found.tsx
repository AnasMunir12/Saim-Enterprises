import { PageChrome } from "@/components/layout/PageChrome";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";

export const metadata = { title: "Page not found | Saim Enterprises", robots: { index: false } };

export default function NotFound() {
  return (
    <PageChrome>
      <PageHero eyebrow="Error 404" title={<>We could not find <em>that page.</em></>} lead="The piece or page you are looking for may have been moved, sold out for good, or never existed." />
      <section className="section">
        <div className="empty-state__actions" style={{ justifyContent: "flex-start" }}>
          <ButtonLink href="/catalog" size="lg">Browse the catalog</ButtonLink>
          <ArrowLink href="/">Back to the homepage</ArrowLink>
        </div>
      </section>
    </PageChrome>
  );
}
