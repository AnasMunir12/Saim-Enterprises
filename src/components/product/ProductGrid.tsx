import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/products";

export function ProductGrid({ products }: { products: Product[] }) {
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
