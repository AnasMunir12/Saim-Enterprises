"use client";

import { Star } from "lucide-react";
import { CrudPage, standardDelete } from "@/components/admin/CrudPage";
import { CheckboxField, FieldRow, SelectField, TextAreaField, TextField } from "@/components/admin/FormFields";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Badge } from "@/components/admin/ui";

type Testimonial = { id: string; name: string; role?: string; quote: string; image?: string; rating?: number; active: boolean };
type Form = { name: string; role: string; quote: string; image: string; rating: string; active: boolean };

const emptyForm: Form = { name: "", role: "", quote: "", image: "", rating: "5", active: true };
const ratings = [...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? "" : "s"}` })), { value: "", label: "No rating (hide stars)" }];

export default function TestimonialsPage() {
  return (
    <CrudPage<Testimonial, Form>
      singular="testimonial"
      plural="testimonials"
      endpoint="/api/testimonials"
      emptyForm={emptyForm}
      toForm={(item) => ({ name: item.name, role: item.role ?? "", quote: item.quote, image: item.image ?? "", rating: item.rating ? String(item.rating) : "", active: item.active })}
      toPayload={(form) => ({ ...form, rating: form.rating ? Number(form.rating) : null })}
      validate={(form) => (!form.name.trim() ? "Name is required." : !form.quote.trim() ? "The quote is required." : null)}
      reorderable
      activeKey="active"
      listTitle="Customer testimonials"
      listIntro="The first three active testimonials, in this order, appear in the Kind words section of the homepage."
      deleteConfig={(item) => standardDelete("testimonial", item.name)}
      renderForm={({ form, set }) => (
        <>
          <FieldRow>
            <TextField label="Name" required value={form.name} onChange={(name) => set({ name })} maxLength={80} />
            <TextField label="Role or location" value={form.role} onChange={(role) => set({ role })} maxLength={100} placeholder="Lahore" />
          </FieldRow>
          <TextAreaField label="Quote" required value={form.quote} onChange={(quote) => set({ quote })} rows={4} maxLength={600} />
          <SelectField label="Rating" value={form.rating} onChange={(rating) => set({ rating })} options={ratings} />
          <ImageUpload value={form.image} onChange={(image) => set({ image })} label="Photo (optional)" />
          <CheckboxField label="Show on the storefront" checked={form.active} onChange={(active) => set({ active })} />
        </>
      )}
      renderRow={(item) => ({
        image: item.image,
        title: item.name,
        subtitle: `“${item.quote}”`,
        badges: (
          <>
            {item.rating ? <Badge tone="amber"><Star size={10} className="mr-1" aria-hidden="true" />{item.rating}/5</Badge> : null}
            {item.role ? <Badge>{item.role}</Badge> : null}
          </>
        ),
      })}
    />
  );
}
