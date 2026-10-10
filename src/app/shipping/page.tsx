import { SitePage, sitePageMetadata } from "@/components/layout/SitePage";

// The wording is edited in the admin dashboard (Site content > Pages), so this page is rendered per request.
export const dynamic = "force-dynamic";

export const generateMetadata = () => sitePageMetadata("shipping");

export default function ShippingPage() {
  return <SitePage slug="shipping" />;
}
