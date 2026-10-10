import { randomUUID } from "node:crypto";

import { ApiError } from "@/lib/api";
import { resolveHomepageSections, builtinByKey, isCustomKey, sectionId, CUSTOM_KEY_PREFIX, type ItemField, type ItemsConfig, type SavedSection, type SectionItem } from "@/lib/homepage-sections";
import { parseItems, type Spec } from "@/lib/validate";
import { HomepageSection } from "@/models/HomepageSection";

export const SECTION_SPEC: Spec = {
  title: { type: "text", label: "Heading", max: 120 },
  subtitle: { type: "text", label: "Small label", max: 80 },
  description: { type: "text", label: "Text", max: 600, multiline: true },
  image: { type: "image", label: "Image" },
  buttonText: { type: "text", label: "Button text", max: 40 },
  buttonLink: { type: "link", label: "Button link" },
  enabled: { type: "boolean", label: "Visible" },
};

const ITEM_FIELD_SPECS = {
  title: { type: "text", label: "Title", max: 80 },
  text: { type: "text", label: "Text", max: 240 },
  image: { type: "image", label: "Photo" },
} satisfies Record<ItemField, Spec[string]>;

/** Validates the list of cards, bullet points or photos for a section: only its own fields are kept, the first is required. */
export function parseSectionItems(config: ItemsConfig, raw: unknown): SectionItem[] {
  const spec: Spec = Object.fromEntries(
    config.fields.map((field, index) => [field, { ...ITEM_FIELD_SPECS[field], label: config.fieldLabels[field] ?? ITEM_FIELD_SPECS[field].label, required: index === 0 }]),
  );
  return parseItems(raw, spec, { max: config.max, itemLabel: config.itemLabel }).map((values) => ({ title: "", text: "", image: "", ...values }) as SectionItem);
}

/** Current merged layout (built-ins plus custom blocks), sorted for display. */
export async function readResolvedSections() {
  const saved = await HomepageSection.find().lean<SavedSection[]>();
  return resolveHomepageSections(saved);
}

export async function readResolvedSection(key: string) {
  return (await readResolvedSections()).find((section) => section.key === key) ?? null;
}

export const newCustomKey = () => `${CUSTOM_KEY_PREFIX}${randomUUID().slice(0, 8)}`;

/** Resolves a section id from the URL to a key the owner may edit: a built-in, or an existing custom block. */
export async function editableKey(id: string) {
  const key = id.replace(/^section-/, "");
  if (builtinByKey(key)) return key;
  if (isCustomKey(key) && (await HomepageSection.exists({ key }))) return key;
  throw new ApiError("Homepage section not found.", 404);
}

/** Saves a built-in section the first time it is changed; later edits update the same record. */
export async function upsertSection(key: string, values: Record<string, unknown>) {
  await HomepageSection.findOneAndUpdate(
    { key },
    { $set: values, $setOnInsert: { _id: sectionId(key), key } },
    { upsert: true, runValidators: true },
  );
}
