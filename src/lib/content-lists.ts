// Client-safe. Ordered lists of short items the owner edits under Site content: the trust strip and the FAQ.
// Each list is stored whole (in the order shown). A list that was never saved shows its defaults, which are the
// original wording of the site, so nothing changes until the owner edits it.
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/lib/products";

export const TRUST_ICONS = [
  { value: "truck", label: "Delivery truck" },
  { value: "returns", label: "Returns arrows" },
  { value: "package", label: "Parcel" },
  { value: "ruler", label: "Ruler" },
  { value: "shield", label: "Shield" },
  { value: "heart", label: "Heart" },
  { value: "sparkles", label: "Sparkles" },
  { value: "clock", label: "Clock" },
] as const;

export type TrustIcon = (typeof TRUST_ICONS)[number]["value"];

export type TrustItem = { icon: TrustIcon; title: string; text: string; link: string; active: boolean };
export type FaqItem = { question: string; answer: string; active: boolean };

export type ContentListItems = { "trust-strip": TrustItem; faq: FaqItem };
export type ContentListKey = keyof ContentListItems;

type ListDefinition<T> = {
  /** Singular name used in messages: "Item 2: Title is required." */
  itemLabel: string;
  max: number;
  /** A fresh entry for the Add button. */
  blank: T;
  defaults: T[];
};

export const CONTENT_LISTS: { [K in ContentListKey]: ListDefinition<ContentListItems[K]> } = {
  "trust-strip": {
    itemLabel: "Point",
    max: 4,
    blank: { icon: "truck", title: "", text: "", link: "", active: true },
    defaults: [
      { icon: "truck", title: "Free delivery", text: `On orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`, link: "/shipping", active: true },
      { icon: "returns", title: "Returns and exchange", text: "See how it works", link: "/returns", active: true },
      { icon: "package", title: "Careful packaging", text: "Wrapped to arrive intact", link: "/shipping", active: true },
      { icon: "ruler", title: "Made to order", text: "Custom sizes and finishes", link: "/contact", active: true },
    ],
  },
  faq: {
    itemLabel: "Question",
    max: 40,
    blank: { question: "", answer: "", active: true },
    defaults: [
      { question: "How do I place an order?", answer: "Add pieces to your bag, sign in or create an account, and enter your phone number and delivery address. We contact you to confirm the order and arrange payment and delivery.", active: true },
      { question: "Why do I need an account to order?", answer: "Your account lets you follow your order on the Track order page and keeps your orders together.", active: true },
      { question: "What does Sold out mean?", answer: "The piece has no stock right now. Use the Ask about restock link on the product page and we can tell you if and when it will return.", active: true },
      { question: "Will my order be reserved when I place it?", answer: "Items are checked for availability when you place the order and reserved once we confirm it. If something sells out in between, we will contact you.", active: true },
      { question: "Can you make something custom?", answer: "Yes. We make custom laser-cut, CNC and engraved pieces to your size and finish. Tell us your idea on the contact page and we will reply by email.", active: true },
      { question: "How long will delivery take?", answer: "See the Shipping page. Timing for made-to-order pieces is confirmed with you before you pay.", active: true },
      { question: "Can I return or exchange something?", answer: "See the Returns and exchange page for the details of what we can repair, replace or refund.", active: true },
      { question: "How can I contact you?", answer: "Send a message on the contact page and we reply by email. You can also find our email and phone number on the contact page and in the footer.", active: true },
    ],
  },
};

export const isContentListKey = (key: string): key is ContentListKey => Object.hasOwn(CONTENT_LISTS, key);

/** A list as the dashboard and the storefront see it: the saved items, or the defaults while nothing is saved. */
export type ResolvedList<K extends ContentListKey = ContentListKey> = { items: ContentListItems[K][]; saved: boolean };
