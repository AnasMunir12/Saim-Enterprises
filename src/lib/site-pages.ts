// Client-safe. The five information pages whose title, intro and body the owner edits under Site content > Pages.
// Their defaults are the original wording of each page, so nothing changes until the owner edits one.
// Title and body use the tiny markup described in lib/text-markup.ts.
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/lib/products";
import { plainTitle } from "@/lib/text-markup";

export type PageContent = { title: string; intro: string; body: string };

type PageDefinition = {
  /** Name the owner sees in the dashboard. */
  label: string;
  path: string;
  /** Small label above the heading; fixed. */
  eyebrow: string;
  /** Browser-tab title and search description while the page has not been edited. */
  metaTitle: string;
  metaDescription: string;
  defaults: PageContent;
};

export const SITE_PAGES = {
  about: {
    label: "About us",
    path: "/about",
    eyebrow: "The Saim point of view",
    metaTitle: "About us | Saim Enterprises",
    metaDescription: "Saim Enterprises makes handcrafted home décor, lighting and personalised pieces in Lahore using wood, light and acrylic.",
    defaults: {
      title: "Made slowly. *Made with feeling.*",
      intro: "Saim Enterprises creates handcrafted home décor, lighting and personalised pieces from our studio in Lahore. We work with wood, light, acrylic and carefully chosen finishing details to make objects that feel at home in your home.",
      body: ["## Home is in the details.", "Our work is rooted in useful beauty: pieces made to be lived with, gifted with meaning and kept for a long time."].join("\n\n"),
    },
  },
  shipping: {
    label: "Shipping",
    path: "/shipping",
    eyebrow: "Help",
    metaTitle: "Shipping | Saim Enterprises",
    metaDescription: "Delivery areas, timing, free delivery threshold and packaging for Saim Enterprises orders.",
    defaults: {
      title: "Shipping &\n*delivery.*",
      intro: "How your handcrafted order travels from our Lahore studio to your door.",
      body: [
        "## Where we deliver",
        "We ship across Pakistan.",
        "## Delivery charges",
        `Delivery is free on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}. For smaller orders, the delivery charge is confirmed by our team when we contact you about your order.`,
        "## How long it takes",
        "Ready pieces that are in stock are usually dispatched within a few working days of confirmation.",
        "Custom and made-to-order pieces take longer, and we will give you a timeline before you pay.",
        "## Packaging",
        "Every piece is wrapped and boxed to arrive intact. Fragile items such as lighting get extra protection.",
        "## Tracking your order",
        "After you place an order you can follow it any time on the Track order page while signed in. We update the status as soon as we confirm, ship and deliver it.",
        "## Damaged on arrival",
        "Please check your parcel when it arrives. If anything is damaged, message us within 48 hours with photos and we will make it right.",
      ].join("\n\n"),
    },
  },
  returns: {
    label: "Returns & exchange",
    path: "/returns",
    eyebrow: "Help",
    metaTitle: "Returns & exchange | Saim Enterprises",
    metaDescription: "How returns, exchanges and refunds work for Saim Enterprises orders.",
    defaults: {
      title: "Returns &\n*exchange.*",
      intro: "We want you to love what you bring home. If something is not right, here is how we will sort it out.",
      body: [
        "## Ready-made pieces",
        "If a ready-made piece arrives damaged, defective or not as described, we will repair, replace or refund it. Please message us within 7 days of delivery with photos.",
        "Items should be unused and in their original packaging for a change-of-mind exchange.",
        "## Custom and personalised pieces",
        "Because custom pieces are made for you, they cannot be returned unless they arrive damaged or differ from the design we agreed with you.",
        "## How to start",
        "Send us a message through the contact page with your order reference and photos. We will reply with the next steps.",
        ["- Quote your order reference from the Track order page.", "- Send clear photos of the item and its packaging.", "- We confirm whether it is a repair, exchange or refund."].join("\n"),
        "## Refunds",
        "Approved refunds are returned using the same method you paid with, usually within 7 to 10 working days.",
      ].join("\n\n"),
    },
  },
  privacy: {
    label: "Privacy policy",
    path: "/privacy",
    eyebrow: "Legal",
    metaTitle: "Privacy policy | Saim Enterprises",
    metaDescription: "What personal information Saim Enterprises collects and how it is used.",
    defaults: {
      title: "Privacy\n*policy.*",
      intro: "This explains what we collect when you use our website, why we collect it and the choices you have.",
      body: [
        "## What we collect",
        [
          "We collect only what we need to run the shop:",
          "- Account details: your name, email address and a securely hashed password, or your Google profile name and email if you sign in with Google.",
          "- Order details: your phone number, delivery address, notes and the items you order.",
          "- Newsletter: your email address, if you subscribe.",
          "- Your bag and preferences are kept in your own browser.",
        ].join("\n"),
        "## How we use it",
        "We use your information to confirm and deliver orders, contact you about them, answer your messages and, if you subscribe, send occasional news. We do not sell your personal information.",
        "## Who sees it",
        "Our team, and the delivery and hosting providers who need it to do their job.",
        "## Your choices",
        "You can ask us to correct or delete your account or unsubscribe at any time by contacting us.",
        "## Cookies",
        "We use a sign-in cookie to keep you logged in. We do not run advertising trackers.",
      ].join("\n\n"),
    },
  },
  terms: {
    label: "Terms of service",
    path: "/terms",
    eyebrow: "Legal",
    metaTitle: "Terms of service | Saim Enterprises",
    metaDescription: "The terms that apply when you order from Saim Enterprises.",
    defaults: {
      title: "Terms of\n*service.*",
      intro: "The basic terms that apply when you browse and order from Saim Enterprises. Please have these reviewed before relying on them.",
      body: [
        "## Orders",
        "Placing an order is a request to buy. An order is accepted only when we confirm it to you, and we may decline or cancel an order, for example if an item is no longer available.",
        "Stock shown on the website is checked when you order, but items are reserved only once your order is confirmed.",
        "## Prices and payment",
        "Prices are in Pakistani rupees (PKR). We confirm the final amount, delivery charge and payment method with you before dispatch.",
        "## Handmade variation",
        "Our pieces are crafted by hand and from natural materials, so small variations in colour, grain and finish are normal and part of their character.",
        "## Delivery, returns and exchange",
        "Delivery and returns are covered on the Shipping and Returns pages, which form part of these terms.",
        "## Your account",
        "Please keep your sign-in details private. You are responsible for activity on your account.",
        "## Changes",
        "We may update these terms from time to time. The version on this page applies to orders placed after it is published.",
      ].join("\n\n"),
    },
  },
} satisfies Record<string, PageDefinition>;

export type SitePageSlug = keyof typeof SITE_PAGES;

export const SITE_PAGE_SLUGS = Object.keys(SITE_PAGES) as SitePageSlug[];
export const isSitePageSlug = (slug: string): slug is SitePageSlug => Object.hasOwn(SITE_PAGES, slug);

/** A page as the dashboard and the storefront see it: the saved wording, or the original while nothing is saved. */
export type ResolvedPage = PageContent & {
  id: SitePageSlug;
  label: string;
  path: string;
  eyebrow: string;
  /** False while the page still shows its original wording. */
  saved: boolean;
  metaTitle: string;
  metaDescription: string;
};

const META_DESCRIPTION_MAX = 160;

export function resolveSitePage(slug: SitePageSlug, saved: Partial<PageContent> | null): ResolvedPage {
  const { defaults, label, path, eyebrow, metaTitle, metaDescription } = SITE_PAGES[slug];
  if (!saved) return { id: slug, label, path, eyebrow, saved: false, metaTitle, metaDescription, ...defaults };

  const content = { title: saved.title ?? defaults.title, intro: saved.intro ?? "", body: saved.body ?? "" };
  return {
    id: slug,
    label,
    path,
    eyebrow,
    saved: true,
    // An edited page names itself in the browser tab and in search results.
    metaTitle: `${plainTitle(content.title)} | Saim Enterprises`,
    metaDescription: content.intro.length > META_DESCRIPTION_MAX ? `${content.intro.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…` : content.intro || metaDescription,
    ...content,
  };
}
