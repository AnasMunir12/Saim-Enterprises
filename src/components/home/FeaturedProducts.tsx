import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { products } from "@/lib/products";
export function FeaturedProducts() { return <section className="section-pad featured-section" id="shop"><div className="section-row"><SectionHeading eyebrow="The edit" title="Pieces to keep." /><Link className="text-link" href="/catalog">View all pieces <span>↗</span></Link></div><ProductGrid products={products.filter((product) => product.featured).slice(0, 4)} /></section>; }
