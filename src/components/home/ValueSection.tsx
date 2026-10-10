import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { itemsFor, NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

export function ValueSection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  return (
    <section className="section" aria-labelledby="value-section-heading">
      <SectionHeading
        id="value-section-heading"
        eyebrow={copy.subtitle || "Crafted with purpose"}
        title={copy.title || "Designed to"}
        accent={copy.title ? undefined : "transform your space."}
        action={<ArrowLink href="/about">Meet the studio</ArrowLink>}
      />
      <div className="value-grid">
        {itemsFor(copy, "values").map((point, index) => (
          <article key={index} className="value-card">
            <span className="value-card__num">0{index + 1}</span>
            <h3>{point.title}</h3>
            <p>{point.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
