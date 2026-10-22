"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Skeleton, SkeletonLine } from "@/components/ui/Skeleton";
import { StoreImage } from "@/components/ui/StoreImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

type Tile = { key: string; name: string; image: string; description?: string; href: string; label: string };
type Collection = { id: string; slug?: string; name: string; image?: string; description?: string; active?: boolean };
type Category = { id: string; slug: string; name: string; image?: string; description?: string; active?: boolean };

async function getList<T>(url: string): Promise<T[]> {
  const response = await fetch(url, { cache: "no-store" });
  return response.ok ? ((await response.json()) as T[]) : [];
}

// Shop-by-collection tiles. Collections come first; if the shop has none, the categories are used instead.
// Each tile deep-links into the catalog with the matching filter applied.
export function CategorySection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const [tiles, setTiles] = useState<Tile[] | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [collections, categories] = await Promise.all([
          getList<Collection>("/api/collections").catch(() => []),
          getList<Category>("/api/categories").catch(() => []),
        ]);
        const fromCollections: Tile[] = collections
          .filter((item) => item.active !== false && item.slug)
          .map((item) => ({ key: item.id, name: item.name, image: item.image ?? "", description: item.description, href: `/catalog?collection=${item.slug}`, label: "Collection" }));
        const fromCategories: Tile[] = categories
          .filter((item) => item.active !== false)
          .map((item) => ({ key: item.id, name: item.name, image: item.image ?? "", description: item.description, href: `/catalog?category=${item.slug}`, label: "Category" }));
        if (mounted) setTiles(fromCollections.length ? fromCollections : fromCategories);
      } catch {
        if (mounted) setTiles([]);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (tiles && tiles.length === 0) return null;

  const shown = (tiles ?? []).slice(0, 8);

  return (
    <section className="section" id="collections" aria-labelledby="collections-heading">
      <SectionHeading
        id="collections-heading"
        eyebrow={copy.subtitle || "Explore the collection"}
        title={copy.title || "Curated for"}
        accent={copy.title ? undefined : "thoughtful interiors."}
        lead={copy.description || "Signature lighting, handcrafted décor, and personalised accents designed for modern homes that value warmth, texture and character."}
        action={<ArrowLink href={copy.buttonLink || "/catalog"} icon="up-right">{copy.buttonText || "View all pieces"}</ArrowLink>}
      />

      <div className="tiles" aria-busy={tiles === null}>
        {shown.map((item) => (
          <Link href={item.href} className="tile" key={item.key}>
            <div className="tile__media">
              <StoreImage src={item.image} alt={item.name} />
            </div>
            <div className="tile__body">
              <span className="tile__label">{item.label}</span>
              <h3>{item.name}</h3>
              {item.description ? <p className="tile__desc">{item.description}</p> : null}
              <span className="tile__arrow">
                <span>Explore {item.label.toLowerCase()}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
        {tiles === null ? Array.from({ length: 3 }, (_, index) => (
          <div className="tile tile--loading" key={index} aria-hidden="true">
            <Skeleton className="tile__media" />
            <div className="tile__body">
              <SkeletonLine />
              <SkeletonLine wide />
              <SkeletonLine />
            </div>
          </div>
        )) : null}
      </div>
    </section>
  );
}
