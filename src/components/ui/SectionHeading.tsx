export function SectionHeading({ eyebrow, title, accent }: { eyebrow: string; title: string; accent?: string }) {
  return <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title} {accent && <em>{accent}</em>}</h2></div>;
}
