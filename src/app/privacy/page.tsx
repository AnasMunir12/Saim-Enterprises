import { SitePage, sitePageMetadata } from "@/components/layout/SitePage";

// The wording is edited in the admin dashboard (Site content > Pages), so this page is rendered per request.
export const dynamic = "force-dynamic";

export const generateMetadata = () => sitePageMetadata("privacy");

export default function PrivacyPage() {
  return <SitePage slug="privacy" />;
}
