import { Badge } from "@/components/ui/Badge";
import { discountPercent, isLowStock, isSoldOut, type Product } from "@/lib/products";

// One status badge set for a product: sold out wins, then sale, then low stock, then the owner's own badge text.
export function ProductBadges({ product, className, hideLowStock }: { product: Product; className: string; hideLowStock?: boolean }) {
  const soldOut = isSoldOut(product);
  const percent = discountPercent(product);
  const low = !hideLowStock && isLowStock(product);
  return (
    <div className={className}>
      {soldOut ? <Badge tone="soldout">Sold out</Badge> : null}
      {!soldOut && percent > 0 ? <Badge tone="sale">{percent}% off</Badge> : null}
      {!soldOut && low ? <Badge tone="low">Only {product.stock} left</Badge> : null}
      {!soldOut && !percent && !low && product.badge ? <Badge>{product.badge}</Badge> : null}
    </div>
  );
}
