"use client";

import { CrudPage, standardDelete } from "@/components/admin/CrudPage";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/FormFields";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Badge } from "@/components/admin/ui";
import { HomepageCategorySelection } from "@/components/admin/HomepageCategorySelection";
import type { CategoryRecord } from "@/lib/site-data";

type Form = { name: string; description: string; image: string; active: boolean };
const emptyForm: Form = { name: "", description: "", image: "", active: true };

export default function CategoriesPage() {
  const notifyCategoryChange = () => window.dispatchEvent(new Event("category-records-changed"));

  return (
    <div className="space-y-6">
      <CrudPage<CategoryRecord, Form>
        singular="category"
        plural="categories"
        endpoint="/api/categories"
        emptyForm={emptyForm}
        toForm={(category) => ({ name: category.name, description: category.description ?? "", image: category.image ?? "", active: category.active })}
        validate={(form) => (!form.name.trim() ? "Category name is required." : null)}
        activeKey="active"
        onChange={notifyCategoryChange}
        listTitle="Categories"
        listIntro="Every product belongs to one category. Active categories appear in the catalog and All Categories page; choose homepage categories below."
        emptyText="Create your first category to start adding products."
        deleteConfig={(category) => standardDelete("category", category.name, "Categories that still contain products cannot be deleted.")}
        renderForm={({ form, set }) => (
          <>
            <TextField label="Category name" required value={form.name} onChange={(name) => set({ name })} maxLength={80} />
            <TextAreaField label="Description" value={form.description} onChange={(description) => set({ description })} rows={3} maxLength={400} />
            <ImageUpload value={form.image} onChange={(image) => set({ image })} label="Category image" />
            <CheckboxField label="Show on the storefront" checked={form.active} onChange={(active) => set({ active })} />
          </>
        )}
        renderRow={(category) => ({
          image: category.image,
          title: category.name,
          subtitle: `/${category.slug}`,
          badges: category.active ? null : <Badge>Hidden</Badge>,
        })}
      />
      <HomepageCategorySelection />
    </div>
  );
}
