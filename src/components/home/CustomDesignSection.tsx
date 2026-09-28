import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { WHATSAPP_LINK } from "@/lib/constants";

export function CustomDesignSection() {
  return (
    <section className="custom-section" id="custom">
      <div className="custom-copy">
        <p className="eyebrow">Made for you</p>
        <h2>
          Your idea,
          <br />
          <em>made tangible.</em>
        </h2>
        <p>
          From custom laser-cut wood pieces to CNC-crafted décor and engraved accents, we design one-of-a-kind pieces
          that reflect your taste, story, and space.
        </p>
        <div className="custom-actions">
          <Link className="button button-light" href="/contact">
            Start your custom piece
            <ArrowRight size={16} />
          </Link>
          <a className="text-link light-link" href={WHATSAPP_LINK}>
            Talk to the studio
            <ArrowRight size={16} />
          </a>
        </div>
      </div>

      <div className="custom-stamp" aria-label="Custom design service">
        <Sparkles size={22} />
        <span>
          Made to order
          <br />
          with care
        </span>
      </div>
    </section>
  );
}
