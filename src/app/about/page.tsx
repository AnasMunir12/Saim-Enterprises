import { CustomDesignSection } from "@/components/home/CustomDesignSection";
import { EditorialSection } from "@/components/home/EditorialSection";
import { SitePage, sitePageMetadata } from "@/components/layout/SitePage";

// The wording is edited in the admin dashboard (Site content > Pages), so this page is rendered per request.
export const dynamic = "force-dynamic";

export const generateMetadata = () => sitePageMetadata("about");

export default function AboutPage() {
  return <SitePage slug="about" after={<><EditorialSection /><CustomDesignSection /></>} />;
}
