"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RepeaterField } from "@/components/admin/RepeaterField";
import { Alert, ConfirmDialog, PageHeader, Spinner, cardCls, primaryBtn, secondaryBtn } from "@/components/admin/ui";
import { useNotice } from "@/components/admin/useAdminResource";
import { adminFetch } from "@/lib/admin-fetch";
import { CONTENT_LISTS, type ContentListItems, type ContentListKey, type ResolvedList } from "@/lib/content-lists";

type Props<K extends ContentListKey> = {
  listKey: K;
  title: string;
  description: string;
  /** The fields of one entry. `patch` changes some of its values. */
  renderItem: (item: ContentListItems[K], patch: (values: Partial<ContentListItems[K]>) => void) => ReactNode;
};

/**
 * Editor for one ordered list of site content (trust strip, FAQ). The whole list is loaded, edited here, and saved in one go.
 * A list the owner never saved shows the original entries; "Restore default" brings them back.
 */
export function ListEditor<K extends ContentListKey>({ listKey, title, description, renderItem }: Props<K>) {
  const { itemLabel, max, blank } = CONTENT_LISTS[listKey];
  const endpoint = `/api/content/lists/${listKey}`;
  const [items, setItems] = useState<ContentListItems[K][]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [formError, setFormError] = useState("");
  const { notice, clear, success, fail } = useNotice();

  const apply = useCallback((list: ResolvedList<K>) => {
    setItems(list.items);
    setSaved(list.saved);
  }, []);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      apply(await adminFetch<ResolvedList<K>>(endpoint, { cache: "no-store" }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load this list.");
    } finally {
      setLoading(false);
    }
  }, [apply, endpoint]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      apply(await adminFetch<ResolvedList<K>>(endpoint, { method: "PUT", body: JSON.stringify({ items }) }));
      success("Saved. The storefront now shows this list.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save the list.");
    } finally {
      setSaving(false);
    }
  }

  async function restore() {
    setRestoring(true);
    try {
      apply(await adminFetch<ResolvedList<K>>(endpoint, { method: "DELETE" }));
      setFormError("");
      success("The original list is back.");
    } catch (error) {
      fail(error, "Could not restore the original list.");
    } finally {
      setRestoring(false);
      setConfirmRestore(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Site content" title={title} description={description} />
      {notice ? <Alert tone={notice.tone} onDismiss={clear}>{notice.text}</Alert> : null}

      <form className={cardCls} onSubmit={(event) => { event.preventDefault(); void save(); }} aria-label={title}>
        {loading ? (
          <Spinner label="Loading" />
        ) : loadError ? (
          <Alert onRetry={() => void load()}>{loadError}</Alert>
        ) : (
          <div className="space-y-4">
            {formError ? <Alert onDismiss={() => setFormError("")}>{formError}</Alert> : null}
            {saved ? null : <p className="text-sm text-stone-500">These are the standard entries the site shows now. Change them and save to make the list your own.</p>}
            <RepeaterField items={items} onChange={setItems} itemLabel={itemLabel} max={max} blank={blank} renderItem={renderItem} />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className={primaryBtn}>{saving ? "Saving..." : "Save changes"}</button>
              {saved ? <button type="button" className={secondaryBtn} onClick={() => setConfirmRestore(true)}>Restore default</button> : null}
            </div>
          </div>
        )}
      </form>

      <ConfirmDialog
        open={confirmRestore}
        busy={restoring}
        title="Restore the original list?"
        message="Your edits to this list are removed and the original entries are shown on the storefront again."
        confirmLabel="Restore default"
        onConfirm={() => void restore()}
        onCancel={() => setConfirmRestore(false)}
      />
    </div>
  );
}
