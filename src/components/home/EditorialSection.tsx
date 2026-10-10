import { Check } from "lucide-react";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { StoreImage } from "@/components/ui/StoreImage";
import { itemsFor, NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=90";

// Photo beside a short brand story. Also used on the About page.
export function EditorialSection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  return (
    <section className="story">
      <div className="story__media">
        <StoreImage src={copy.image || DEFAULT_IMAGE} alt="Warm, tactile interior with handcrafted details" />
      </div>
      <div className="story__copy">
        <p className="eyebrow">{copy.subtitle || "Crafted with light & precision"}</p>
        {copy.title ? <h2>{copy.title}</h2> : <h2>Good things take <em>their time.</em></h2>}
        <p>{copy.description || "Every Saim piece begins with a material we love, a shape worth living with, and a pair of careful hands."}</p>
        <ul className="story__list">
          {itemsFor(copy, "editorial").map((point, index) => <li key={index}><Check size={16} aria-hidden="true" />{point.text}</li>)}
        </ul>
        <ArrowLink href={copy.buttonLink || "/about"}>{copy.buttonText || "Meet the makers"}</ArrowLink>
      </div>
    </section>
  );
}
