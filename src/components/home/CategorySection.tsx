"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";

type CollectionItem = {
  id?: string;
  name: string;
  image: string;
  description?: string;
  active?: boolean;
};

export function CategorySection() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadCollections() {
      try {
        const response = await fetch("/api/collections");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as CollectionItem[];
        const activeCollections = (data ?? []).filter((item) => item.active !== false);

        if (mounted) {
          setCollections(activeCollections);
        }
      } catch {
        if (mounted) setCollections([]);
      }
    }

    void loadCollections();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="section-pad category-section" id="collections">
      <div className="category-intro">
        <SectionHeading eyebrow="Explore the collection" title="Curated for" accent="thoughtful interiors." />
        <p>
          Signature lighting, handcrafted décor, and personalized accents designed for modern homes that value warmth,
          texture, and character.
        </p>
        <Link className="text-link" href="/catalog">
          View all collections
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="category-grid">
        {collections.slice(0, 6).map((item, index) => (
          <Link
            href="/catalog"
            className={`category-card ${index === 0 || index === 3 ? "wide" : ""}`}
            key={item.name}
          >
            <img src={item.image} alt={item.name} />
            <div className="category-overlay" />
            <div className="category-meta">
              <div>
                <span className="category-label">Collection</span>
                <h3>{item.name}</h3>
              </div>
              <ArrowUpRight size={18} />
            </div>
            <p className="category-description">{item.description}</p>
          </Link>
        ))}
        {!collections.length ? <p className="empty-state">No collections found.</p> : null}
      </div>
    </section>
  );
}
