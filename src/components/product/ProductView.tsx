import { ShieldCheck, Truck, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Price } from "@/components/ui/Price";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPrice, type Product } from "@/lib/products";

function Specs({ product }: { product: Product }) {
  return (
    <dl className="specs">
      {product.sku ? <div><dt>SKU</dt><dd>{product.sku}</dd></div> : null}
      <div><dt>Category</dt><dd>{product.category}</dd></div>
      {product.material ? <div><dt>Material</dt><dd>{product.material}</dd></div> : null}
      {product.dimensions ? <div><dt>Dimensions</dt><dd>{product.dimensions}</dd></div> : null}
      {product.color ? <div><dt>Colour</dt><dd>{product.color}</dd></div> : null}
      {product.customizable ? <div><dt>Custom work</dt><dd>Available. <Link className="text-link" href="/contact">Tell us your size and finish.</Link></dd></div> : null}
    </dl>
  );
}

function Assurance({ product }: { product: Product }) {
  const freeShip = product.price >= FREE_SHIPPING_THRESHOLD;
  return (
    <ul className="pdp__assurance">
      <li>
        <Truck size={18} aria-hidden="true" />
        <span>{freeShip ? "This piece ships free." : `Free delivery on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`} <Link href="/shipping">Shipping details</Link></span>
      </li>
      <li>
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Handmade with care in our Lahore studio. <Link href="/returns">Returns and exchange</Link></span>
      </li>
      <li>
        <UserRoundCheck size={18} aria-hidden="true" />
        <span>Place your order with a free account, then follow it on the <Link href="/track">Track order</Link> page.</span>
      </li>
    </ul>
  );
}

// Server-rendered shell; only the gallery and buy box are interactive.
export function ProductView({ product, related, relatedSameCategory }: { product: Product; related: Product[]; relatedSameCategory: boolean }) {
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/catalog">Catalog</Link></li>
          {product.categorySlug ? <li><Link href={`/catalog?category=${product.categorySlug}`}>{product.category}</Link></li> : null}
          <li aria-current="page"><span>{product.name}</span></li>
        </ol>
      </nav>

      <section className="pdp">
        <ProductGallery product={product} />

        <div className="pdp__info">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <Price product={product} size="lg" />
          {product.detail ? <p className="pdp__summary">{product.detail}</p> : null}
          <BuyBox product={product} />
          <Assurance product={product} />
          <Specs product={product} />
        </div>
      </section>

      {product.description && product.description !== product.detail ? (
        <section className="pdp-story">
          <h2>About this piece</h2>
          <p>{product.description}</p>
        </section>
      ) : null}

      {related.length ? (
        <section className="section section--tint">
          <SectionHeading
            eyebrow={relatedSameCategory ? `More from ${product.category}` : "You may also like"}
            title="More to keep."
            action={product.categorySlug ? <ArrowLink href={`/catalog?category=${product.categorySlug}`}>View all {product.category}</ArrowLink> : undefined}
          />
          <ProductGrid products={related} />
        </section>
      ) : null}
    </>
  );
}
