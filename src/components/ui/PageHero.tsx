import type { ReactNode } from "react";

// Compact page header used by every inner page.
export function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: ReactNode; lead?: string }) {
  return (
    <section className="page-hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {lead ? <p className="lead">{lead}</p> : null}
    </section>
  );
}
