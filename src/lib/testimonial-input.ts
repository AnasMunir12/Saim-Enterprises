import type { Spec } from "@/lib/validate";

export const TESTIMONIAL_SPEC: Spec = {
  name: { type: "text", label: "Name", max: 80, required: true },
  role: { type: "text", label: "Role or location", max: 100 },
  quote: { type: "text", label: "Quote", max: 600, multiline: true, required: true },
  image: { type: "image", label: "Photo" },
  rating: { type: "number", label: "Rating", min: 1, max: 5, integer: true },
  active: { type: "boolean", label: "Active" },
};
