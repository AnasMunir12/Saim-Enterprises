import { HomeSections } from "@/components/home/HomeSections";
import { getHomepageSections } from "@/lib/homepage";
import { getActiveListItems } from "@/lib/site-content";
import { getBrandHero } from "@/lib/get-brand-hero";

// Section order, visibility and wording are edited in the admin dashboard, so this page is rendered per request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [sections, trustItems, brandHero] = await Promise.all([getHomepageSections(), getActiveListItems("trust-strip"), getBrandHero()]);
  return (
    <>
  
      <HomeSections sections={sections} trustItems={trustItems} />
    </>
  );
}
