import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Skeleton, SkeletonLine } from "@/components/ui/Skeleton";
import { StoreImage } from "@/components/ui/StoreImage";
import type { CatalogCategory } from "@/components/useCatalog";

export function CategoryGrid({ categories }: { categories: CatalogCategory[] }) {
  return (
    <div className="tiles tiles--categories">
      {categories.map((category) => (
        <Link href={`/catalog?category=${encodeURIComponent(category.slug)}`} className="tile" key={category.id}>
          <div className="tile__media"><StoreImage src={category.image} alt={category.name} /></div>
          <div className="tile__body">
            <span className="tile__label">Category</span>
            <h3>{category.name}</h3>
            {category.description ? <p className="tile__desc">{category.description}</p> : null}
            <span className="tile__arrow">
              <span>Explore category</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="tiles tiles--categories" aria-busy="true" aria-label="Loading categories">
      {Array.from({ length: count }, (_, index) => (
        <div className="tile tile--loading" key={index} aria-hidden="true">
          <Skeleton className="tile__media" />
          <div className="tile__body"><SkeletonLine /><SkeletonLine wide /><SkeletonLine /></div>
        </div>
      ))}
    </div>
  );
}
