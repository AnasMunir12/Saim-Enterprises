import { ArrowRight, Sparkles } from "lucide-react";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ButtonLink } from "@/components/ui/Button";
import { NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

// Dark banner inviting visitors to start a custom piece. Questions go through the contact form.
export function CustomDesignSection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  return (
    <section className="custom-banner" id="custom">
      <div className="custom-banner__copy">
        <p className="eyebrow">{copy.subtitle || "Made for you"}</p>
        {copy.title ? <h2>{copy.title}</h2> : <h2>Your idea, <em>made tangible.</em></h2>}
        <p>{copy.description || "From custom laser-cut wood pieces to CNC-crafted décor and engraved accents, we design one-of-a-kind pieces that reflect your taste, story and space."}</p>
        <div className="custom-banner__actions">
          <ButtonLink href={copy.buttonLink || "/contact"} variant="on-dark" size="lg">
            {copy.buttonText || "Start your custom piece"} <ArrowRight size={16} aria-hidden="true" />
          </ButtonLink>
          <ArrowLink href="/faq" light>How custom orders work</ArrowLink>
        </div>
      </div>

      <div className="custom-banner__stamp" aria-hidden="true">
        <Sparkles size={22} />
        <span>Made to order<br />with care</span>
      </div>
    </section>
  );
}
