"use client";

import { Plus } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { smallBtn } from "@/components/admin/ui";

/** A short list of extra pictures (for a product gallery). Each slot uploads, replaces or removes its own image. */
export function GalleryField({ label, values, onChange, max }: { label: string; values: string[]; onChange: (values: string[]) => void; max: number }) {
  const setAt = (index: number, value: string) => onChange(value ? values.map((item, i) => (i === index ? value : item)) : values.filter((_, i) => i !== index));
  return (
    <div className="space-y-3">
      {values.map((value, index) => (
        <ImageUpload key={`${index}-${value}`} value={value} onChange={(next) => setAt(index, next)} label={`${label} ${index + 1}`} />
      ))}
      {values.length < max ? (
        <button type="button" className={smallBtn} onClick={() => onChange([...values, ""])} disabled={values.includes("")}>
          <Plus size={12} /> Add {values.length === 0 ? "a" : "another"} {label.toLowerCase()}
        </button>
      ) : null}
    </div>
  );
}
