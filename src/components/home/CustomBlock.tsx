import { ArrowLink } from "@/components/ui/ArrowLink";
import { StoreImage } from "@/components/ui/StoreImage";
import type { HomeSectionCopy } from "@/lib/homepage-sections";

// A content block added by the owner in the admin dashboard. It reuses the story layout.
export function CustomBlock({ copy }: { copy: HomeSectionCopy }) {
  return (
    <section className={`story${copy.image ? "" : " story--solo"}`} aria-label={copy.title}>
      {copy.image ? (
        <div className="story__media">
          <StoreImage src={copy.image} alt={copy.title} />
        </div>
      ) : null}
      <div className="story__copy">
        {copy.subtitle ? <p className="eyebrow">{copy.subtitle}</p> : null}
        <h2>{copy.title}</h2>
        {copy.description ? <p>{copy.description}</p> : null}
        {copy.buttonText && copy.buttonLink ? <ArrowLink href={copy.buttonLink}>{copy.buttonText}</ArrowLink> : null}
      </div>
    </section>
  );
}
