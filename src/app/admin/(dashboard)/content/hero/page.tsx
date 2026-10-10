"use client";

import { CrudPage, standardDelete } from "@/components/admin/CrudPage";
import { CheckboxField, FieldRow, TextAreaField, TextField } from "@/components/admin/FormFields";
import { ImageUpload } from "@/components/admin/ImageUpload";

type Slide = {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  image: string;
  primaryButtonText?: string;
  primaryButtonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  active: boolean;
};
type Form = Omit<Slide, "id">;

const emptyForm: Form = {
  eyebrow: "",
  title: "",
  description: "",
  image: "",
  primaryButtonText: "Explore collection",
  primaryButtonUrl: "/catalog",
  secondaryButtonText: "Learn more",
  secondaryButtonUrl: "/contact",
  active: true,
};

export default function HeroContentPage() {
  return (
    <CrudPage<Slide, Form>
      singular="slide"
      plural="slides"
      endpoint="/api/content/hero"
      emptyForm={emptyForm}
      toForm={(slide) => ({ ...emptyForm, ...slide })}
      validate={(form) => (!form.title.trim() ? "Slide title is required." : !form.image ? "Upload a hero image." : null)}
      reorderable
      activeKey="active"
      listTitle="Hero slides"
      listIntro="The big banner at the top of the homepage. Active slides play in this order; with none, a plain welcome banner is shown."
      emptyText="Add a slide to control the large banner at the top of the homepage."
      deleteConfig={(slide) => standardDelete("slide", slide.title, "It disappears from the homepage.")}
      renderForm={({ form, set }) => (
        <>
          <TextField label="Eyebrow" value={form.eyebrow ?? ""} onChange={(eyebrow) => set({ eyebrow })} maxLength={80} hint="Small line above the title." />
          <TextField label="Title" required value={form.title} onChange={(title) => set({ title })} maxLength={150} />
          <TextAreaField label="Description" value={form.description ?? ""} onChange={(description) => set({ description })} rows={3} maxLength={400} />
          <ImageUpload value={form.image} onChange={(image) => set({ image })} label="Hero image *" />
          <FieldRow>
            <TextField label="Primary button text" value={form.primaryButtonText ?? ""} onChange={(primaryButtonText) => set({ primaryButtonText })} maxLength={40} />
            <TextField label="Primary button link" value={form.primaryButtonUrl ?? ""} onChange={(primaryButtonUrl) => set({ primaryButtonUrl })} hint="For example /catalog" />
          </FieldRow>
          <FieldRow>
            <TextField label="Secondary link text" value={form.secondaryButtonText ?? ""} onChange={(secondaryButtonText) => set({ secondaryButtonText })} maxLength={40} />
            <TextField label="Secondary link" value={form.secondaryButtonUrl ?? ""} onChange={(secondaryButtonUrl) => set({ secondaryButtonUrl })} hint="For example /contact" />
          </FieldRow>
          <CheckboxField label="Show on the homepage" checked={form.active} onChange={(active) => set({ active })} />
        </>
      )}
      renderRow={(slide) => ({ image: slide.image, title: slide.title, subtitle: slide.eyebrow })}
    />
  );
}
