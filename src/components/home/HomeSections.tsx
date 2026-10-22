"use client";

import { Fragment, type ReactNode } from "react";
import { CategorySection } from "@/components/home/CategorySection";
import { CustomBlock } from "@/components/home/CustomBlock";
import { CustomDesignSection } from "@/components/home/CustomDesignSection";
import { EditorialSection } from "@/components/home/EditorialSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroSlider } from "@/components/home/HeroSlider";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { SaleSection } from "@/components/home/SaleSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { ValueSection } from "@/components/home/ValueSection";
import { PageChrome } from "@/components/layout/PageChrome";
import { TrustStrip } from "@/components/layout/TrustStrip";
import type { TrustItem } from "@/lib/content-lists";
import type { HomeSectionCopy, ResolvedSection } from "@/lib/homepage-sections";

type Extras = { trustItems: TrustItem[] };

// Built-in section key -> component. The key list lives in lib/homepage-sections.ts (BUILTIN_SECTIONS).
const BUILTIN: Record<string, (copy: HomeSectionCopy, extras: Extras) => ReactNode> = {
  hero: () => <HeroSlider />,
  "trust-strip": (_copy, { trustItems }) => <TrustStrip items={trustItems} />,
  collections: (copy) => <CategorySection copy={copy} />,
  "featured-products": (copy) => <FeaturedProducts copy={copy} />,
  sale: (copy) => <SaleSection copy={copy} />,
  editorial: (copy) => <EditorialSection copy={copy} />,
  "custom-design": (copy) => <CustomDesignSection copy={copy} />,
  testimonials: (copy) => <TestimonialsSection copy={copy} />,
  values: (copy) => <ValueSection copy={copy} />,
  newsletter: (copy) => <NewsletterSection copy={copy} />,
};

/** Renders the homepage in the order, visibility and wording chosen in the admin dashboard (Content > Homepage, Site content > Trust strip). */
export function HomeSections({ sections, trustItems }: { sections: ResolvedSection[]; trustItems: TrustItem[] }) {
  return (
    <PageChrome>
            <div className="home-sections">

      {sections
        .filter((section) => section.enabled)
        .map((section) => (
          <div
              key={section.key}
              className={`home-section home-section--${section.key}`}
            >
          <Fragment key={section.key}>{section.builtin ? BUILTIN[section.key]?.(section, { trustItems }) : <CustomBlock copy={section} />}</Fragment>
         </div>
        ))}
        </div>
    </PageChrome>
  );
}
