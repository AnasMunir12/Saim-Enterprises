"use client";

import { CheckboxField, TextAreaField, TextField } from "@/components/admin/FormFields";
import { ListEditor } from "@/components/admin/ListEditor";

export default function FaqContentPage() {
  return (
    <ListEditor
      listKey="faq"
      title="FAQ"
      description="The questions and answers on the FAQs page, shown in this order. Hidden questions stay here but visitors do not see them."
      renderItem={(item, patch) => (
        <>
          <TextField label="Question" required value={item.question} onChange={(question) => patch({ question })} maxLength={200} />
          <TextAreaField label="Answer" required value={item.answer} onChange={(answer) => patch({ answer })} rows={4} maxLength={1500} />
          <CheckboxField label="Show on the FAQs page" checked={item.active} onChange={(active) => patch({ active })} />
        </>
      )}
    />
  );
}
