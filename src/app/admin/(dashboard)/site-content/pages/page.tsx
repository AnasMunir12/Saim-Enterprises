"use client";

import { CrudPage } from "@/components/admin/CrudPage";
import { TextAreaField } from "@/components/admin/FormFields";
import { Badge } from "@/components/admin/ui";
import { MARKUP_HELP } from "@/lib/text-markup";
import type { ResolvedPage } from "@/lib/site-pages";

type Form = { title: string; intro: string; body: string };

export default function PagesContentPage() {
  return (
    <CrudPage<ResolvedPage, Form>
      singular="page"
      plural="pages"
      endpoint="/api/content/pages"
      emptyForm={{ title: "", intro: "", body: "" }}
      toForm={(page) => ({ title: page.title, intro: page.intro, body: page.body })}
      validate={(form) => (form.title.trim() ? null : "The title is required.")}
      canCreate={false}
      formTitle={(editing) => (editing ? `Edit: ${editing.label}` : "Edit a page")}
      formIntro={(editing) => (editing ? `Shown at ${editing.path}. The text below is what the page says now, so you can change it instead of retyping it.` : null)}
      listTitle="Information pages"
      listIntro="Choose a page to change its title, introduction and text."
      deleteConfig={(page) =>
        page.saved
          ? {
              label: "Restore default",
              title: "Restore the original page?",
              message: <>Your wording for <strong>{page.label}</strong> is removed and the original text is shown again.</>,
              confirmLabel: "Restore default",
              done: `${page.label} restored to its original text.`,
              destructive: false,
            }
          : null
      }
      renderForm={({ form, set }) => (
        <>
          <TextAreaField label="Title" required value={form.title} onChange={(title) => set({ title })} rows={2} maxLength={120} hint="Put *asterisks* around words to show them in italics. A new line starts a new line in the heading." />
          <TextAreaField label="Introduction" value={form.intro} onChange={(intro) => set({ intro })} rows={3} maxLength={600} hint="The larger paragraph under the heading." />
          <TextAreaField label="Page text" value={form.body} onChange={(body) => set({ body })} rows={18} maxLength={20000} hint={MARKUP_HELP} />
        </>
      )}
      renderRow={(page) => ({
        image: null,
        title: page.label,
        subtitle: page.path,
        badges: page.saved ? <Badge tone="blue">Custom text</Badge> : null,
      })}
    />
  );
}
