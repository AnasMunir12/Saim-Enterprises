import { discountPercent, formatPrice, type Product } from "@/lib/products";

// Price with a struck-through compare-at price, and a "Save N%" tag in the large size, only when the markdown is real.
export function Price({ product, size = "md" }: { product: Pick<Product, "price" | "compareAtPrice">; size?: "md" | "lg" }) {
  const percent = discountPercent(product);
  return (
    <span className={`price price--${size}${percent ? " price--sale" : ""}`}>
      <strong className="price__now">{formatPrice(product.price)}</strong>
      {percent > 0 && product.compareAtPrice ? (
        <>
          <s className="price__was"><span className="sr-only">Was </span>{formatPrice(product.compareAtPrice)}</s>
          {size === "lg" ? <span className="price__save">Save {percent}%</span> : null}
        </>
      ) : null}
    </span>
  );
}
