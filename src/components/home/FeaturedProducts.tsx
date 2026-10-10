"use client";

import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useCatalog } from "@/components/useCatalog";
import { NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";
import { soldOutLast } from "@/lib/products";

export function FeaturedProducts({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const { products, status, reload } = useCatalog();
  const featured = soldOutLast(products.filter((product) => product.featured)).slice(0, 4);
  // Until something is marked as featured, show the newest pieces instead of an empty block.
  const fallback = featured.length === 0;
  const shown = fallback ? soldOutLast(products).slice(0, 4) : featured;

  // With nothing to show and nothing loading, the section disappears rather than advertising emptiness.
  if (status === "ready" && shown.length === 0) return null;

  return (
    <section className="section section--tint" id="shop" aria-labelledby="featured-heading">
      <SectionHeading
        id="featured-heading"
        eyebrow={copy.subtitle || (fallback && status === "ready" ? "New arrivals" : "The edit")}
        title={copy.title || (fallback && status === "ready" ? "Just made." : "Pieces to keep.")}
        action={<ArrowLink href={copy.buttonLink || "/catalog"} icon="up-right">{copy.buttonText || "View all pieces"}</ArrowLink>}
      />
      {status === "loading" ? (
        <ProductGridSkeleton count={4} />
      ) : status === "error" ? (
        <EmptyState role="alert" title="We could not load the pieces just now." actions={<Button onClick={reload}>Try again</Button>} />
      ) : (
        <ProductGrid products={shown} />
      )}
    </section>
  );
}
