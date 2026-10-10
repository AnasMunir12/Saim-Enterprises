import { ApiError } from "@/lib/api";
import { cleanText } from "@/lib/contact-message";

// Declarative request-body validation for admin routes. A spec describes each accepted field; anything not
// in the spec is ignored (so a client can never set fields the route did not ask for).

export type FieldSpec =
  | { type: "text"; label: string; max: number; required?: boolean; multiline?: boolean }
  | { type: "link"; label: string; max?: number; required?: boolean }
  | { type: "image"; label: string; required?: boolean }
  | { type: "boolean"; label: string }
  | { type: "choice"; label: string; options: readonly string[]; required?: boolean }
  | { type: "number"; label: string; min: number; max: number; integer?: boolean; required?: boolean };

export type Spec = Record<string, FieldSpec>;

const SAFE_LINK = /^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)$/i;
const SAFE_IMAGE = /^(\/uploads\/[A-Za-z0-9._-]+|\/(?!\/)[^\s]+|https?:\/\/[^\s]+)$/i;

/**
 * Validates `payload` against `spec`. With `partial`, only fields present in the payload are checked and returned
 * (used by PUT/PATCH); otherwise required fields must be present. Throws ApiError(400) with a readable message.
 */
export function parseFields(payload: Record<string, unknown>, spec: Spec, options: { partial?: boolean } = {}): Record<string, string | boolean | number> {
  const out: Record<string, string | boolean | number> = {};

  for (const [key, field] of Object.entries(spec)) {
    const present = key in payload && payload[key] !== undefined;
    if (!present) {
      if (!options.partial && "required" in field && field.required) throw new ApiError(`${field.label} is required.`);
      continue;
    }
    const raw = payload[key];

    switch (field.type) {
      case "boolean": {
        if (typeof raw !== "boolean") throw new ApiError(`${field.label} must be true or false.`);
        out[key] = raw;
        break;
      }
      case "choice": {
        if (typeof raw !== "string" || !field.options.includes(raw)) throw new ApiError(`${field.label} must be one of the listed choices.`);
        out[key] = raw;
        break;
      }
      case "number": {
        const value = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
        if (!Number.isFinite(value)) {
          if (field.required) throw new ApiError(`${field.label} must be a number.`);
          break;
        }
        if (field.integer && !Number.isInteger(value)) throw new ApiError(`${field.label} must be a whole number.`);
        if (value < field.min || value > field.max) throw new ApiError(`${field.label} must be between ${field.min} and ${field.max}.`);
        out[key] = value;
        break;
      }
      default: {
        if (raw === null) {
          if (field.type === "text" && field.required) throw new ApiError(`${field.label} is required.`);
          out[key] = "";
          break;
        }
        if (typeof raw !== "string") throw new ApiError(`${field.label} must be text.`);
        const value = field.type === "text" ? cleanText(raw, field.multiline === true) : raw.trim();
        const required = "required" in field && field.required;
        if (!value) {
          if (required) throw new ApiError(`${field.label} is required.`);
          out[key] = "";
          break;
        }
        const max = field.type === "text" ? field.max : field.type === "link" ? (field.max ?? 300) : 2000;
        if (value.length > max) throw new ApiError(`${field.label} must be ${max} characters or fewer.`);
        if (field.type === "link" && !SAFE_LINK.test(value)) throw new ApiError(`${field.label} must be a page like /catalog or a full link starting with https://.`);
        if (field.type === "image" && !SAFE_IMAGE.test(value)) throw new ApiError(`${field.label} must be an uploaded image or a link starting with https://.`);
        out[key] = value;
      }
    }
  }
  return out;
}

/**
 * Validates a list of objects (a repeater in the admin UI) against `spec`, naming the failing entry in the message,
 * for example "Card 2: Title is required.". Entries keep their order.
 */
export function parseItems(raw: unknown, spec: Spec, options: { max: number; itemLabel: string }) {
  if (!Array.isArray(raw)) throw new ApiError("A list of items is required.");
  if (raw.length > options.max) throw new ApiError(`You can add at most ${options.max} ${options.itemLabel.toLowerCase()} entries.`);
  return raw.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new ApiError(`${options.itemLabel} ${index + 1} is not valid.`);
    try {
      return parseFields(entry as Record<string, unknown>, spec);
    } catch (error) {
      throw error instanceof ApiError ? new ApiError(`${options.itemLabel} ${index + 1}: ${error.message}`, error.status) : error;
    }
  });
}
