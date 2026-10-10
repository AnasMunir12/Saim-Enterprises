import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton, SkeletonLine } from "@/components/ui/Skeleton";
import type { Product } from "@/lib/products";

export function ProductGrid({ products }: { products: Product[] }) {
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, index) => (
        <div className="pcard" key={index} aria-hidden="true">
          <Skeleton className="pcard__media" />
          <div className="pcard__body"><SkeletonLine wide /><SkeletonLine /></div>
        </div>
      ))}
    </div>
  );
}
