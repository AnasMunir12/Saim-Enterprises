"use client";

import { CheckboxField, FieldRow, SelectField, TextField } from "@/components/admin/FormFields";
import { ListEditor } from "@/components/admin/ListEditor";
import { TRUST_ICONS, type TrustIcon } from "@/lib/content-lists";

export default function TrustStripContentPage() {
  return (
    <ListEditor
      listKey="trust-strip"
      title="Trust strip"
      description="The short reassurance points under the homepage banner (delivery, returns and so on). Up to four, shown in this order."
      renderItem={(item, patch) => (
        <>
          <FieldRow>
            <SelectField label="Icon" value={item.icon} onChange={(icon) => patch({ icon: icon as TrustIcon })} options={[...TRUST_ICONS]} />
            <TextField label="Title" required value={item.title} onChange={(title) => patch({ title })} maxLength={40} />
          </FieldRow>
          <TextField label="Short text" value={item.text} onChange={(text) => patch({ text })} maxLength={80} />
          <TextField label="Link" value={item.link} onChange={(link) => patch({ link })} hint="Optional. A page such as /shipping, or a full link starting with https://" />
          <CheckboxField label="Show on the homepage" checked={item.active} onChange={(active) => patch({ active })} />
        </>
      )}
    />
  );
}
