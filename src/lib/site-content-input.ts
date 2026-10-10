import { CONTENT_LISTS, TRUST_ICONS, type ContentListItems, type ContentListKey } from "@/lib/content-lists";
import { parseItems, type Spec } from "@/lib/validate";

// Validation for the editable site content (Site content in the dashboard).

const ITEM_SPECS: { [K in ContentListKey]: Spec } = {
  "trust-strip": {
    icon: { type: "choice", label: "Icon", options: TRUST_ICONS.map((icon) => icon.value), required: true },
    title: { type: "text", label: "Title", max: 40, required: true },
    text: { type: "text", label: "Short text", max: 80 },
    link: { type: "link", label: "Link" },
    active: { type: "boolean", label: "Show" },
  },
  faq: {
    question: { type: "text", label: "Question", max: 200, required: true },
    answer: { type: "text", label: "Answer", max: 1500, multiline: true, required: true },
    active: { type: "boolean", label: "Show" },
  },
};

/** The whole list as the owner arranged it. Omitted optional fields take the blank value, so a stored item is always complete. */
export function parseListItems<K extends ContentListKey>(key: K, raw: unknown): ContentListItems[K][] {
  const { itemLabel, max, blank } = CONTENT_LISTS[key];
  return parseItems(raw, ITEM_SPECS[key], { max, itemLabel }).map((values) => ({ ...blank, ...values }) as ContentListItems[K]);
}

export const PAGE_SPEC: Spec = {
  title: { type: "text", label: "Title", max: 120, multiline: true, required: true },
  intro: { type: "text", label: "Intro", max: 600, multiline: true },
  body: { type: "text", label: "Page text", max: 20000, multiline: true },
};
