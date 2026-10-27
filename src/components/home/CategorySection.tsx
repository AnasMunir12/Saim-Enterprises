"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useCatalog } from "@/components/useCatalog";
import { CategoryGrid, CategoryGridSkeleton } from "@/components/catalog/CategoryGrid";
import { HOMEPAGE_CATEGORY_LIMIT, NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

export function CategorySection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const { categories, categoryStatus, reload } = useCatalog();
  const shown = copy.categoryIds === null
    ? categories.slice(0, HOMEPAGE_CATEGORY_LIMIT)
    : copy.categoryIds
      .map((id) => categories.find((category) => category.id === id))
      .filter((category): category is (typeof categories)[number] => Boolean(category))
      .slice(0, HOMEPAGE_CATEGORY_LIMIT);
  if (categoryStatus === "ready" && shown.length === 0) return null;

  return (
    <section className="section" id="collections" aria-labelledby="collections-heading">
      <SectionHeading
        id="collections-heading"
        eyebrow={copy.subtitle || "Browse the collection"}
        title={copy.title || "Shop by Category"}
        lead={copy.description || "Discover every kind of piece, thoughtfully made for your home."}
      />

      {categoryStatus === "loading" ? (
        <CategoryGridSkeleton count={3} />
      ) : categoryStatus === "error" ? (
        <EmptyState role="alert" title="We could not load categories just now." actions={<Button onClick={reload}>Try again</Button>} />
      ) : (
        <CategoryGrid categories={shown} />
      )}
      {shown.length > 0 ? (
        <div className="category-section__footer">
          <Link href="/categories" className="category-section__all-link">
            <span>View All Categories</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
