import type { Spec } from "@/lib/validate";

export const HERO_SPEC: Spec = {
  eyebrow: { type: "text", label: "Eyebrow", max: 80 },
  title: { type: "text", label: "Title", max: 150, required: true },
  description: { type: "text", label: "Description", max: 400, multiline: true },
  image: { type: "image", label: "Hero image", required: true },
  primaryButtonText: { type: "text", label: "Primary button text", max: 40 },
  primaryButtonUrl: { type: "link", label: "Primary button link" },
  secondaryButtonText: { type: "text", label: "Secondary button text", max: 40 },
  secondaryButtonUrl: { type: "link", label: "Secondary button link" },
  active: { type: "boolean", label: "Active" },
};

const DEFAULTS = {
  primaryButtonText: "Explore collection",
  primaryButtonUrl: "/catalog",
  secondaryButtonText: "Learn more",
  secondaryButtonUrl: "/contact",
} as const;

/** A cleared button label or link falls back to the standard one, so the slide never shows an empty button. */
export function withHeroDefaults<T extends Record<string, unknown>>(values: T): T {
  const out: Record<string, unknown> = { ...values };
  for (const [key, fallback] of Object.entries(DEFAULTS)) {
    if (key in out && !out[key]) out[key] = fallback;
  }
  return out as T;
}
