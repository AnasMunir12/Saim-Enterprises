// Client-safe description of the homepage. The storefront renders the sections below in the order and with the
// wording stored in the database; a section that was never saved falls back to the built-in order and text.

export type SectionField = "subtitle" | "title" | "description" | "image" | "button";

export const HOMEPAGE_CATEGORY_LIMIT = 4;

/** One entry of a section's repeating list: a value card, a story bullet point or a gallery photo. */
export type SectionItem = { title: string; text: string; image: string };
export type ItemField = keyof SectionItem;

export type ItemsConfig = {
  /** Heading of the list in the dashboard form, for example "Cards". */
  label: string;
  /** Singular name used in labels and messages, for example "Card". */
  itemLabel: string;
  max: number;
  /** The entry fields the owner edits, in order. The first one is required. */
  fields: ItemField[];
  fieldLabels: Partial<Record<ItemField, string>>;
  /** The original entries; shown while the owner has not saved a list of their own. */
  defaults: SectionItem[];
};

const item = (values: Partial<SectionItem>): SectionItem => ({ title: "", text: "", image: "", ...values });

const GALLERY_ALT = "Warmly lit interior with handcrafted décor";

const VALUE_CARDS: ItemsConfig = {
  label: "Cards",
  itemLabel: "Card",
  max: 8,
  fields: ["title", "text"],
  fieldLabels: { title: "Card title", text: "Card text" },
  defaults: [
    item({ title: "Premium craftsmanship", text: "Thoughtful materials, precise finishes, and detail that shows in every line." }),
    item({ title: "Custom made to order", text: "We shape pieces around your idea, your home, and your way of living." }),
    item({ title: "CNC and laser precision", text: "Clean cuts, measured symmetry, and a finish designed to last beautifully." }),
    item({ title: "Made for modern spaces", text: "Functional décor and ambient light designed to feel warm, elevated, and personal." }),
  ],
};

const STORY_POINTS: ItemsConfig = {
  label: "Bullet points",
  itemLabel: "Bullet point",
  max: 6,
  fields: ["text"],
  fieldLabels: { text: "Text" },
  defaults: ["Premium wood, selected for grain", "Laser cutting and CNC precision", "Hand finishing in our Lahore studio"].map((text) => item({ text })),
};

const GALLERY_PHOTOS: ItemsConfig = {
  label: "Photos",
  itemLabel: "Gallery photo",
  max: 8,
  fields: ["image", "text"],
  fieldLabels: { image: "Photo", text: "Description for screen readers" },
  defaults: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=85",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=85",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=85",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=85",
  ].map((image) => item({ image, text: GALLERY_ALT })),
};

export type BuiltinSection = {
  key: string;
  label: string;
  /** Plain-language description of what the visitor sees. */
  summary: string;
  /** Which wording fields the owner may override. An empty list means the section can only be shown, hidden or moved. */
  fields: SectionField[];
  /** Section-specific labels for the generic fields. */
  labels?: Partial<Record<SectionField, string>>;
  /** Optional order for a newly added built-in without shifting existing default section order. */
  defaultOrder?: number;
  /** A repeating list the owner can edit (cards, bullet points, photos). */
  items?: ItemsConfig;
};

export const BUILTIN_SECTIONS: BuiltinSection[] = [
  { key: "hero", label: "Hero slider", summary: "The large banner at the top. Slides are managed under Hero slides.", fields: [] },
  { key: "trust-strip", label: "Trust strip", summary: "Free delivery, returns, packaging and made-to-order points under the banner. Edit them under Site content > Trust strip.", fields: [] },
  { key: "collections", label: "Shop by category", summary: "Up to four active categories selected on the Categories page.", fields: ["subtitle", "title", "description"] },
  { key: "featured-products", label: "Featured products", summary: "Products selected in the Products dashboard.", fields: ["subtitle", "title", "description", "button"] },
  { key: "sale", label: "Offers", summary: "Appears automatically while any product has a compare-at price.", fields: ["subtitle", "title"], labels: { subtitle: "Small label (replaces \"Save up to N%\")" } },
  { key: "editorial", label: "Story block", summary: "Photo with a short brand story and its bullet points.", fields: ["subtitle", "title", "description", "image", "button"], items: STORY_POINTS },
  { key: "custom-design", label: "Custom pieces banner", summary: "Dark banner inviting visitors to start a custom piece.", fields: ["subtitle", "title", "description", "button"] },
  { key: "testimonials", label: "Testimonials", summary: "Up to three active testimonials. Manage them under Testimonials.", fields: ["subtitle"] },
  { key: "values", label: "Why choose us", summary: "Value cards about craftsmanship.", fields: ["subtitle", "title"], items: VALUE_CARDS },
  { key: "newsletter", label: "Gallery and newsletter", summary: "Inspiration photos and the email sign-up.", fields: ["title"], items: GALLERY_PHOTOS },
  { key: "shop-by-collection", label: "Shop by collection", summary: "Image tiles for every active collection, in the order set in collection management.", fields: ["subtitle", "title", "description", "button"], labels: { button: "Link text (View all collections)" }, defaultOrder: 35 },
];

export const CUSTOM_KEY_PREFIX = "block-";
export const CUSTOM_SECTION_FIELDS: SectionField[] = ["subtitle", "title", "description", "image", "button"];

export const isCustomKey = (key: string) => key.startsWith(CUSTOM_KEY_PREFIX);
export const sectionId = (key: string) => `section-${key}`;
export const keyFromSectionId = (id: string) => id.replace(/^section-/, "");
export const builtinByKey = (key: string) => BUILTIN_SECTIONS.find((section) => section.key === key);

export type SavedSection = {
  _id?: string;
  id?: string;
  key: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  categoryIds?: string[];
  items?: SectionItem[];
  enabled?: boolean;
  order?: number;
};

export type ResolvedSection = {
  id: string;
  key: string;
  builtin: boolean;
  /** Name the owner sees in the dashboard. */
  label: string;
  summary: string;
  fields: SectionField[];
  fieldLabels: Partial<Record<SectionField, string>>;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  categoryIds: string[] | null;
  /** The owner's own list, or empty to use `itemsConfig.defaults`. */
  items: SectionItem[];
  /** Present for sections with a repeating list. */
  itemsConfig: ItemsConfig | null;
  enabled: boolean;
  order: number;
  /** False while the section only exists as a built-in default (nothing saved yet). */
  saved: boolean;
};

/** Wording overrides handed to a storefront section. Empty strings mean "use the built-in text". */
export type HomeSectionCopy = Pick<ResolvedSection, "title" | "subtitle" | "description" | "image" | "buttonText" | "buttonLink" | "categoryIds" | "items">;

export const NO_COPY: HomeSectionCopy = { title: "", subtitle: "", description: "", image: "", buttonText: "", buttonLink: "", categoryIds: null, items: [] };

/** The entries a storefront section shows: the owner's list, or the original entries while none is saved. */
export function itemsFor(copy: HomeSectionCopy, key: string): SectionItem[] {
  return copy.items.length ? copy.items : (builtinByKey(key)?.items?.defaults ?? []);
}

/** Merges stored sections with the built-in list: every built-in is present, custom blocks are added, all sorted. */
export function resolveHomepageSections(saved: SavedSection[]): ResolvedSection[] {
  const byKey = new Map(saved.map((section) => [section.key, section]));

  const builtins = BUILTIN_SECTIONS.map((definition, index): ResolvedSection => {
    const stored = byKey.get(definition.key);
    return {
      id: sectionId(definition.key),
      key: definition.key,
      builtin: true,
      label: definition.label,
      summary: definition.summary,
      fields: definition.fields,
      fieldLabels: definition.labels ?? {},
      title: stored?.title ?? "",
      subtitle: stored?.subtitle ?? "",
      description: stored?.description ?? "",
      image: stored?.image ?? "",
      buttonText: stored?.buttonText ?? "",
      buttonLink: stored?.buttonLink ?? "",
      categoryIds: Array.isArray(stored?.categoryIds) ? stored.categoryIds.filter((id): id is string => typeof id === "string") : null,
      items: stored?.items ?? [],
      itemsConfig: definition.items ?? null,
      enabled: stored ? stored.enabled !== false : true,
      order: typeof stored?.order === "number" && stored.order > 0 ? stored.order : definition.defaultOrder ?? (index + 1) * 10,
      saved: Boolean(stored),
    };
  });

  const customs = saved
    .filter((section) => isCustomKey(section.key) && !builtinByKey(section.key))
    .map((section, index): ResolvedSection => ({
      id: sectionId(section.key),
      key: section.key,
      builtin: false,
      label: section.title || "Content block",
      summary: "A content block you added: picture, heading, text and a button.",
      fields: CUSTOM_SECTION_FIELDS,
      fieldLabels: {},
      title: section.title ?? "",
      subtitle: section.subtitle ?? "",
      description: section.description ?? "",
      image: section.image ?? "",
      buttonText: section.buttonText ?? "",
      buttonLink: section.buttonLink ?? "",
      categoryIds: null,
      items: [],
      itemsConfig: null,
      enabled: section.enabled !== false,
      order: typeof section.order === "number" && section.order > 0 ? section.order : 1000 + index,
      saved: true,
    }));

  return [...builtins, ...customs].sort((a, b) => a.order - b.order);
}
