"use client";

import { Camera } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StoreImage } from "@/components/ui/StoreImage";
import { itemsFor, NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

export function InspirationGallery({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const { settings } = useStore();
  const instagram = settings?.socialLinks.find((link) => /instagram\.com/i.test(link.url))?.url;

  return (
    <section className="section" aria-labelledby="gallery-heading">
      <SectionHeading
        id="gallery-heading"
        eyebrow="Follow the feeling"
        title="Inspiration for your space."
        action={instagram ? <ArrowLink href={instagram} external icon="none"><Camera size={15} aria-hidden="true" /> Follow us on Instagram</ArrowLink> : undefined}
      />
      <div className="gallery">
        {itemsFor(copy, "newsletter").map((photo, index) => <StoreImage key={index} src={photo.image} alt={photo.text} />)}
      </div>
    </section>
  );
}
