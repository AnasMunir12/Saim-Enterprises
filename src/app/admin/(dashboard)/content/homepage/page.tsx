"use client";

import { CrudPage, standardDelete } from "@/components/admin/CrudPage";
import { CheckboxField, FieldRow, TextAreaField, TextField } from "@/components/admin/FormFields";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RepeaterField } from "@/components/admin/RepeaterField";
import { Badge } from "@/components/admin/ui";
import { CUSTOM_SECTION_FIELDS, type ItemsConfig, type ResolvedSection, type SectionField, type SectionItem } from "@/lib/homepage-sections";

type Form = { title: string; subtitle: string; description: string; image: string; buttonText: string; buttonLink: string; items: SectionItem[]; enabled: boolean };
const emptyForm: Form = { title: "", subtitle: "", description: "", image: "", buttonText: "", buttonLink: "", items: [], enabled: true };

const BLANK_ITEM: SectionItem = { title: "", text: "", image: "" };

/** Cards, bullet points or photos of a section. Shows the standard entries until the owner saves their own. */
function ItemsEditor({ config, items, onChange }: { config: ItemsConfig; items: SectionItem[]; onChange: (items: SectionItem[]) => void }) {
  const labels = config.fieldLabels;
  return (
    <fieldset className="space-y-3 rounded-xl border border-stone-200 p-4">
      <legend className="px-1 text-sm font-medium text-stone-700">{config.label}</legend>
      <p className="text-xs text-stone-500">Up to {config.max}. Remove every entry and save to go back to the standard ones.</p>
      <RepeaterField
        items={items}
        onChange={onChange}
        itemLabel={config.itemLabel}
        max={config.max}
        blank={BLANK_ITEM}
        renderItem={(item, patch) => (
          <>
            {config.fields.includes("image") ? <ImageUpload value={item.image} onChange={(image) => patch({ image })} label={labels.image ?? "Image"} /> : null}
            {config.fields.includes("title") ? <TextField label={labels.title ?? "Title"} required={config.fields[0] === "title"} value={item.title} onChange={(title) => patch({ title })} maxLength={80} /> : null}
            {config.fields.includes("text") ? <TextField label={labels.text ?? "Text"} required={config.fields[0] === "text"} value={item.text} onChange={(text) => patch({ text })} maxLength={240} /> : null}
          </>
        )}
      />
    </fieldset>
  );
}

const BLANK_HINT = "Leave empty to keep the standard wording.";

export default function HomepageContentPage() {
  return (
    <CrudPage<ResolvedSection, Form>
      singular="section"
      plural="homepage sections"
      endpoint="/api/content/homepage"
      emptyForm={emptyForm}
      toForm={(section) => ({
        title: section.title,
        subtitle: section.subtitle,
        description: section.description,
        image: section.image,
        buttonText: section.buttonText,
        buttonLink: section.buttonLink,
        items: section.items.length ? section.items : (section.itemsConfig?.defaults ?? []),
        enabled: section.enabled,
      })}
      toPayload={({ items, ...form }, editing) => (editing?.itemsConfig ? { ...form, items } : form)}
      validate={(form, editing) => {
        if ((!editing || !editing.builtin) && !form.title.trim()) return "Heading is required.";
        if (Boolean(form.buttonText.trim()) !== Boolean(form.buttonLink.trim())) return "A button needs both its text and its link (or leave both empty).";
        return null;
      }}
      reorderable
      activeKey="enabled"
      activeLabels={["Visible", "Hidden"]}
      canCreate
      formTitle={(editing) => (editing ? `Edit: ${editing.label}` : "Add a content block")}
      formIntro={(editing) => (editing ? editing.summary : "A free-form block with a picture, heading, text and a button. It is added at the bottom; move it up to place it.")}
      listTitle="Homepage sections"
      listIntro="Top to bottom is the order visitors see. Hide a section to remove it from the homepage, or use the arrows to move it."
      deleteConfig={(section) => {
        if (!section.builtin) return standardDelete("content block", section.label, "It disappears from the homepage.");
        if (!section.saved) return null;
        return {
          label: "Restore default",
          title: "Restore the default wording?",
          message: <>Your custom wording{section.itemsConfig ? ` and ${section.itemsConfig.label.toLowerCase()}` : ""} for <strong>{section.label}</strong> is removed and the standard text is shown again. Its position and visibility stay as they are.</>,
          confirmLabel: "Restore default",
          done: `${section.label} restored to its default wording.`,
          destructive: false,
        };
      }}
      renderForm={({ form, set, editing }) => {
        const fields = new Set<SectionField>(editing ? editing.fields : CUSTOM_SECTION_FIELDS);
        const labels = editing?.fieldLabels ?? {};
        const custom = !editing || !editing.builtin;
        const hint = custom ? undefined : BLANK_HINT;
        return (
          <>
            {fields.size === 0 ? <p className="rounded-xl bg-stone-50 p-3 text-sm text-stone-600">This section has no wording to edit here. You can still hide it or change its position.</p> : null}
            {fields.has("subtitle") ? <TextField label={labels.subtitle ?? "Small label above the heading"} value={form.subtitle} onChange={(subtitle) => set({ subtitle })} maxLength={80} hint={hint} /> : null}
            {fields.has("title") ? <TextField label={labels.title ?? "Heading"} required={custom} value={form.title} onChange={(title) => set({ title })} maxLength={120} hint={hint} /> : null}
            {fields.has("description") ? <TextAreaField label={labels.description ?? "Text"} value={form.description} onChange={(description) => set({ description })} rows={4} maxLength={600} hint={hint} /> : null}
            {fields.has("image") ? <ImageUpload value={form.image} onChange={(image) => set({ image })} label={custom ? "Image (optional)" : "Image (empty keeps the standard photo)"} /> : null}
            {fields.has("button") ? (
              <FieldRow>
                <TextField label={labels.button ?? "Button text"} value={form.buttonText} onChange={(buttonText) => set({ buttonText })} maxLength={40} hint={hint} />
                <TextField label="Button link" value={form.buttonLink} onChange={(buttonLink) => set({ buttonLink })} hint="For example /catalog" />
              </FieldRow>
            ) : null}
            {editing?.itemsConfig ? <ItemsEditor config={editing.itemsConfig} items={form.items} onChange={(items) => set({ items })} /> : null}
            <CheckboxField label="Show on the homepage" checked={form.enabled} onChange={(enabled) => set({ enabled })} />
          </>
        );
      }}
      renderRow={(section) => ({
        image: section.builtin ? null : section.image,
        title: section.label,
        subtitle: section.summary,
        badges: (
          <>
            {section.builtin ? null : <Badge tone="violet">Content block</Badge>}
            {section.builtin && section.saved && (section.title || section.subtitle || section.description || section.image || section.buttonText || section.items.length) ? <Badge tone="blue">Custom wording</Badge> : null}
          </>
        ),
      })}
    />
  );
}
