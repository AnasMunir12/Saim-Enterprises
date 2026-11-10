import type { Metadata } from "next";
import { CheckoutPage } from "@/components/cart/CheckoutPage";
import { PageChrome } from "@/components/layout/PageChrome";

export const metadata: Metadata = {
  title: "Place your order | Saim Enterprises",
  description: "Complete your order with our quick, secure guest checkout.",
  robots: { index: false },
};

export default function CheckoutRoute() {
  return (
    <PageChrome>
      <CheckoutPage />
    </PageChrome>
  );
}
