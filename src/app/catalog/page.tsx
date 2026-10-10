import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/CatalogView";
import { PageChrome } from "@/components/layout/PageChrome";
import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Catalog | Saim Enterprises",
  description: "Browse handcrafted lighting, décor and custom pieces from Saim Enterprises. Search, filter by category and price, and see what is in stock.",
};

export default function CatalogPage() {
  return (
    <PageChrome>
      <PageHero eyebrow="The complete collection" title={<>Handmade pieces, <em>ready to ship.</em></>} lead="Lighting, décor and furniture made in our Lahore studio. Browse freely and sign in when you are ready to order." />
      <Suspense fallback={<section className="section"><ProductGridSkeleton /></section>}>
        <CatalogView />
      </Suspense>
    </PageChrome>
  );
}
