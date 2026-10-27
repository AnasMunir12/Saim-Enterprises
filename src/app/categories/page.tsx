import type { Metadata } from "next";
import { AllCategoriesContent } from "@/components/catalog/AllCategoriesContent";
import { PageChrome } from "@/components/layout/PageChrome";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Explore All Categories | Saim Enterprises",
  description: "Browse all active Saim Enterprises categories, from handcrafted décor to statement lighting and personalised home accents.",
};

export default function CategoriesPage() {
  return (
    <PageChrome>
      <PageHero
        eyebrow="Find your next favourite"
        title={<>Explore All <em>Categories</em></>}
        lead="Browse every active category and discover pieces made to bring warmth and character to your home."
      />
      <section className="section" aria-label="All product categories">
        <AllCategoriesContent />
      </section>
    </PageChrome>
  );
}
