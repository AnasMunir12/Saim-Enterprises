import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PageChrome } from "@/components/layout/PageChrome";
import { ProductView } from "@/components/product/ProductView";
import { isSoldOut } from "@/lib/products";
import { getLiveProductBySlug, getRelatedProducts, getSiteOrigin } from "@/lib/storefront";

// Stock changes with every confirmed order, so this page is rendered per request, never cached.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const absolute = (origin: string, url: string) => {
  if (!url || url.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

const clip = (value: string, max: number) => {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getLiveProductBySlug(slug);
  if (!found) return { title: "Product not found | Saim Enterprises", robots: { index: false } };

  const { product, seoTitle, seoDescription } = found;
  const origin = await getSiteOrigin();
  const title = `${seoTitle || product.name} | Saim Enterprises`;
  const description = clip(seoDescription || product.detail || product.description || `${product.name} by Saim Enterprises, handcrafted in Lahore.`, 160);
  const image = absolute(origin, product.image);

  return {
    title,
    description,
    alternates: { canonical: `${origin}/product/${product.slug}` },
    openGraph: { title, description, url: `${origin}/product/${product.slug}`, siteName: "Saim Enterprises", type: "website", images: image ? [{ url: image, alt: product.name }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const found = await getLiveProductBySlug(slug);
  if (!found) notFound();

  const { product } = found;
  const [related, origin] = await Promise.all([getRelatedProducts(product), getSiteOrigin()]);
  const url = `${origin}/product/${product.slug}`;
  const images = (product.images?.length ? product.images : [product.image]).map((image) => absolute(origin, image)).filter((image): image is string => Boolean(image));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: clip(product.description || product.detail || product.name, 500),
      image: images.length ? images : undefined,
      sku: product.sku || undefined,
      category: product.category,
      brand: { "@type": "Brand", name: "Saim Enterprises" },
      material: product.material || undefined,
      color: product.color || undefined,
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "PKR",
        price: product.price,
        itemCondition: "https://schema.org/NewCondition",
        availability: isSoldOut(product) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        { "@type": "ListItem", position: 2, name: "Catalog", item: `${origin}/catalog` },
        ...(product.categorySlug ? [{ "@type": "ListItem", position: 3, name: product.category, item: `${origin}/catalog?category=${product.categorySlug}` }] : []),
        { "@type": "ListItem", position: product.categorySlug ? 4 : 3, name: product.name, item: url },
      ],
    },
  ];

  return (
    <PageChrome>
      {jsonLd.map((entry, index) => <JsonLd key={index} data={entry} />)}
      <ProductView product={product} related={related.products} relatedSameCategory={related.sameCategory} />
    </PageChrome>
  );
}
