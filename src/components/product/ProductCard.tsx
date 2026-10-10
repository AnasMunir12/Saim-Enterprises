"use client";

import Link from "next/link";
import { ProductBadges } from "@/components/product/ProductBadges";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useStore } from "@/components/StoreProvider";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { StoreImage } from "@/components/ui/StoreImage";
import { isSoldOut, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const soldOut = isSoldOut(product);
  const href = `/product/${product.slug}`;
  const hoverImage = product.images?.[1];

  return (
    <article className={`pcard${soldOut ? " is-sold-out" : ""}`}>
      <div className="pcard__media">
        {/* The product name below is the accessible link; this one only widens the click area. */}
        <Link className="pcard__link" href={href} tabIndex={-1} aria-hidden="true">
          <StoreImage src={product.image} alt="" />
          {hoverImage && !soldOut ? <StoreImage className="pcard__alt" src={hoverImage} alt="" /> : null}
        </Link>
        <ProductBadges product={product} className="pcard__badges" />
        <WishlistButton id={product.id} name={product.name} className="pcard__wish" />
      </div>
      <div className="pcard__body">
        <p className="pcard__cat">{product.category}</p>
        <h3 className="pcard__name"><Link href={href}>{product.name}</Link></h3>
        <div className="pcard__foot">
          <Price product={product} />
          <Button variant="outline" block disabled={soldOut} onClick={() => addToCart(product)} aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to bag`}>
            {soldOut ? "Sold out" : "Add to bag"}
          </Button>
        </div>
      </div>
    </article>
  );
}
