import Link from "next/link";
import type { ReactNode } from "react";
import { PageChrome } from "@/components/layout/PageChrome";
import { PageHero } from "@/components/ui/PageHero";

// Static information page: hero, intro, the page text and a contact footer. `after` is for full-width sections below the article.
export function PolicyPage({ eyebrow, title, intro, children, after }: { eyebrow: string; title: ReactNode; intro: string; children?: ReactNode; after?: ReactNode }) {
  return (
    <PageChrome>
      <PageHero eyebrow={eyebrow} title={title} />
      <article className="policy">
        {intro ? <p className="policy__intro">{intro}</p> : null}
        {children}
        <p className="policy__contact">Questions? <Link href="/contact">Send the studio a message</Link> or <Link href="/faq">read the FAQs</Link>.</p>
      </article>
      {after}
    </PageChrome>
  );
}
