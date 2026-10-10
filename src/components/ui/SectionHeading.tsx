import type { ReactNode } from "react";

// Eyebrow + serif heading (with an optional italic accent) and an optional action link on the right.
export function SectionHeading({ eyebrow, title, accent, id, lead, action }: { eyebrow?: string; title: string; accent?: string; id?: string; lead?: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={id}>{title}{accent ? <> <em>{accent}</em></> : null}</h2>
        {lead ? <p className="section-head__lead">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}
