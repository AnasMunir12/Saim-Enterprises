"use client";

import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useCatalog } from "@/components/useCatalog";
import { NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";
import { discountPercent, soldOutLast } from "@/lib/products";

// Rendered only while at least one live product carries a real compare-at price, so there is never a dead "Sale" banner.
export function SaleSection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const { products, status } = useCatalog();
  const onSale = soldOutLast(products.filter((product) => discountPercent(product) > 0).sort((a, b) => discountPercent(b) - discountPercent(a))).slice(0, 4);
  if (status !== "ready" || onSale.length === 0) return null;
  const best = discountPercent(onSale[0]);

  return (
    <section className="section" aria-labelledby="sale-heading">
      <SectionHeading
        id="sale-heading"
        eyebrow={copy.subtitle || `Save up to ${best}%`}
        title={copy.title || "Offers worth"}
        accent={copy.title ? undefined : "a look."}
        action={<ArrowLink href="/catalog?sale=1" icon="up-right">Shop all offers</ArrowLink>}
      />
      <ProductGrid products={onSale} />
    </section>
  );
}
