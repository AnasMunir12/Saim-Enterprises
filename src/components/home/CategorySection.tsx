import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";

const categories = [
  ["Hanging & ceiling lights", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=85"],
  ["Wall décor & panels", "https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=800&q=85"],
  ["Custom & signature designs", "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=800&q=85"],
];
export function CategorySection() { return <section className="section-pad category-section"><SectionHeading eyebrow="Find your feeling" title="Made to live" accent="beautifully." /><div className="category-grid">{categories.map(([name, image]) => <Link href="/catalog" className="category-card" key={name}><img src={image} alt={name} /><span>{name}<ArrowUpRight size={17} /></span></Link>)}</div></section>; }
