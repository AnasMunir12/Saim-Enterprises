import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { valuePoints } from "@/lib/homeData";

export function ValueSection() {
  return (
    <section className="section-pad value-section" aria-labelledby="value-section-heading">
      <div className="section-row value-header">
        <SectionHeading
          eyebrow="Crafted with purpose"
          title="Designed to"
          accent="transform your space."
        />
        <Link className="text-link" href="/about">
          Meet the studio
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="value-grid">
        {valuePoints.map((point, index) => (
          <article key={point.title} className="value-card">
            <span className="value-number">0{index + 1}</span>
            <h3>{point.title}</h3>
            <p>{point.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
