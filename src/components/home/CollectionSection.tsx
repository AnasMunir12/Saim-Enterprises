"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonLine } from "@/components/ui/Skeleton";
import { StoreImage } from "@/components/ui/StoreImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useCatalog } from "@/components/useCatalog";
import { NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

export function CollectionSection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const { collections, collectionStatus, reload } = useCatalog();
  if (collectionStatus === "ready" && collections.length === 0) return null;

  return (
    <section className="section" id="shop-by-collection" aria-labelledby="shop-by-collection-heading">
      <SectionHeading
        id="shop-by-collection-heading"
        eyebrow={copy.subtitle || "Shop by collection"}
        title={copy.title || "Made for the"}
        accent={copy.title ? undefined : "way you live."}
        lead={copy.description || "Explore considered edits of lighting and décor, thoughtfully brought together for your home."}
        action={<ArrowLink href={copy.buttonLink || "/catalog"} icon="up-right">{copy.buttonText || "View all collections"}</ArrowLink>}
      />

      {collectionStatus === "loading" ? (
        <div className="tiles" aria-busy="true" aria-label="Loading collections">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="tile tile--loading" key={index} aria-hidden="true">
              <Skeleton className="tile__media" />
              <div className="tile__body"><SkeletonLine /><SkeletonLine wide /><SkeletonLine /></div>
            </div>
          ))}
        </div>
      ) : collectionStatus === "error" ? (
        <EmptyState role="alert" title="We could not load collections just now." actions={<Button onClick={reload}>Try again</Button>} />
      ) : (
        <div className="tiles">
          {collections.map((collection) => (
            <Link href={`/catalog?collection=${encodeURIComponent(collection.slug)}`} className="tile" key={collection.id}>
              <div className="tile__media"><StoreImage src={collection.image} alt={collection.name} /></div>
              <div className="tile__body">
                <span className="tile__label">Collection</span>
                <h3>{collection.name}</h3>
                {collection.description ? <p className="tile__desc">{collection.description}</p> : null}
                <span className="tile__arrow">
                  <span>Explore collection</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
