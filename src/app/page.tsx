import { HomeSections } from "@/components/home/HomeSections";
import { getHomepageSections } from "@/lib/homepage";
import { getActiveListItems } from "@/lib/site-content";

// Section order, visibility and wording are edited in the admin dashboard, so this page is rendered per request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [sections, trustItems] = await Promise.all([getHomepageSections(), getActiveListItems("trust-strip")]);
  return <HomeSections sections={sections} trustItems={trustItems} />;
}
