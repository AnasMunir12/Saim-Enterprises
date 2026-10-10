import type { Spec } from "@/lib/validate";

// Accepted fields for the catalog organisers (categories and collections).
const BASE: Spec = {
  name: { type: "text", label: "Name", max: 80, required: true },
  description: { type: "text", label: "Description", max: 400, multiline: true },
  image: { type: "image", label: "Image" },
  active: { type: "boolean", label: "Active" },
};

export const CATEGORY_SPEC: Spec = BASE;
export const COLLECTION_SPEC: Spec = { ...BASE, featured: { type: "boolean", label: "Featured" } };
