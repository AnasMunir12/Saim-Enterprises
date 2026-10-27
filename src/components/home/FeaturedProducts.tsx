"use client";

import { ArrowRight } from "lucide-react";
import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useCatalog } from "@/components/useCatalog";
import { FeaturedProductsCarousel } from "@/components/home/FeaturedProductsCarousel";
import { NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";
import { MAX_FEATURED_PRODUCTS, soldOutLast } from "@/lib/products";

export function FeaturedProducts({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const { products, status, reload } = useCatalog();
  const shown = soldOutLast(products.filter((product) => product.featured).slice(0, MAX_FEATURED_PRODUCTS));

  // No products are invented or substituted when the admin has not selected any.
  if (status === "ready" && shown.length === 0) return null;

  return (
    <section className="section section--tint" id="shop" aria-labelledby="featured-heading">
      <SectionHeading
        id="featured-heading"
        eyebrow={copy.subtitle || "The edit"}
        title={copy.title || "Pieces to keep."}
        lead={copy.description || undefined}
        action={<ArrowLink href={copy.buttonLink || "/catalog"} icon="up-right">{copy.buttonText || "View all pieces"}</ArrowLink>}
      />
      {status === "loading" ? (
        <ProductGridSkeleton count={3} />
      ) : status === "error" ? (
        <EmptyState role="alert" title="We could not load the pieces just now." actions={<Button onClick={reload}>Try again</Button>} />
      ) : (
        <FeaturedProductsCarousel products={shown} />
      )}
      <div className="featured-products__all">
        <ButtonLink href="/catalog" variant="outline">
          VIEW ALL PRODUCTS <ArrowRight size={16} aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
