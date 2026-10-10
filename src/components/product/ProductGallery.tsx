"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ProductBadges } from "@/components/product/ProductBadges";
import { StoreImage } from "@/components/ui/StoreImage";
import { isSoldOut, type Product } from "@/lib/products";

export function ProductGallery({ product }: { product: Product }) {
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const [active, setActive] = useState(0);
  const go = (step: number) => setActive((current) => (current + step + images.length) % images.length);

  return (
    <div className="pdp__gallery">
      <div className={`pdp__stage${isSoldOut(product) ? " is-sold-out" : ""}`}>
        <StoreImage src={images[active]} alt={`${product.name}${images.length > 1 ? `, image ${active + 1} of ${images.length}` : ""}`} eager />
        <ProductBadges product={product} className="pdp__badges" hideLowStock />
        {images.length > 1 ? (
          <>
            <button type="button" className="icon-btn pdp__nav pdp__nav--prev" onClick={() => go(-1)} aria-label="Previous image"><ChevronLeft size={20} /></button>
            <button type="button" className="icon-btn pdp__nav pdp__nav--next" onClick={() => go(1)} aria-label="Next image"><ChevronRight size={20} /></button>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <ul className="pdp__thumbs" aria-label="Product images">
          {images.map((image, index) => (
            <li key={image}>
              <button type="button" className={`pdp__thumb${index === active ? " is-active" : ""}`} onClick={() => setActive(index)} aria-label={`Show image ${index + 1}`} aria-current={index === active}>
                <StoreImage src={image} alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
