"use client";

import { CrudPage, standardDelete } from "@/components/admin/CrudPage";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/FormFields";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Badge } from "@/components/admin/ui";
import type { CollectionRecord } from "@/lib/site-data";

type Form = { name: string; description: string; image: string; active: boolean };
const emptyForm: Form = { name: "", description: "", image: "", active: true };

export default function CollectionsPage() {
  return (
    <CrudPage<CollectionRecord, Form>
      singular="collection"
      plural="collections"
      endpoint="/api/collections"
      emptyForm={emptyForm}
      toForm={(collection) => ({ name: collection.name, description: collection.description ?? "", image: collection.image ?? "", active: collection.active })}
      validate={(form) => (!form.name.trim() ? "Collection name is required." : null)}
      reorderable
      activeKey="active"
      listTitle="Collections"
      listIntro="Active collections become the image tiles in Shop by collection on the homepage, in this order. Assign products to a collection when editing the product."
      emptyText="Create a collection to group products for the homepage tiles."
      deleteConfig={(collection) => standardDelete("collection", collection.name, "Its products stay in the shop; they just no longer belong to a collection.")}
      renderForm={({ form, set }) => (
        <>
          <TextField label="Collection name" required value={form.name} onChange={(name) => set({ name })} maxLength={80} />
          <TextAreaField label="Description" value={form.description} onChange={(description) => set({ description })} rows={3} maxLength={400} />
          <ImageUpload value={form.image} onChange={(image) => set({ image })} label="Collection image" />
          <CheckboxField label="Show on the storefront" checked={form.active} onChange={(active) => set({ active })} />
        </>
      )}
      renderRow={(collection) => ({
        image: collection.image,
        title: collection.name,
        subtitle: `/${collection.slug}`,
        badges: collection.active ? null : <Badge>Hidden</Badge>,
      })}
    />
  );
}
