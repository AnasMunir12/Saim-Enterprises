"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Alert, ConfirmDialog, EmptyState, Spinner, cardCls, primaryBtn, secondaryBtn, smallBtn, smallDangerBtn } from "@/components/admin/ui";
import { useAdminResource, useNotice } from "@/components/admin/useAdminResource";

export type RowView = {
  /** Thumbnail URL; an empty value shows a grey placeholder, `null` shows no thumbnail at all. */
  image?: string | null;
  title: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
};

export type DeleteConfig = {
  /** Button text on the row, for example "Delete" or "Restore default". */
  label: string;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  /** Notice shown after it succeeded. */
  done: string;
  destructive?: boolean;
};

type Props<T extends { id: string }, F> = {
  /** Lower-case names used in messages: "testimonial", "testimonials". */
  singular: string;
  plural: string;
  endpoint: string;
  /** Use when the list is read from a different URL than the item routes. */
  listEndpoint?: string;
  emptyForm: F;
  toForm: (item: T) => F;
  /** Turns the form into the request body. Defaults to sending the form as it is. */
  toPayload?: (form: F, editing: T | null) => Record<string, unknown>;
  /** Return a message to block saving, or null when the form is fine. */
  validate?: (form: F, editing: T | null) => string | null;
  renderForm: (api: { form: F; set: (patch: Partial<F>) => void; editing: T | null }) => ReactNode;
  renderRow: (item: T) => RowView;
  /** Name of a boolean property on the item that shows as a one-click Active / Hidden switch. */
  activeKey?: keyof T & string;
  activeLabels?: [string, string];
  reorderable?: boolean;
  /** Return null to hide the delete button for an item. */
  deleteConfig?: (item: T) => DeleteConfig | null;
  /** When false, the form only appears while editing an existing item. */
  canCreate?: boolean;
  formTitle?: (editing: T | null) => string;
  formIntro?: (editing: T | null) => ReactNode;
  listTitle?: string;
  listIntro?: ReactNode;
  emptyTitle?: string;
  emptyText?: string;
};

const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * A complete create / edit / delete / reorder screen for one kind of record. Pages describe their fields and rows;
 * loading, saving, confirmation, error handling and reordering are the same everywhere.
 */
export function CrudPage<T extends { id: string }, F extends object>({
  singular, plural, endpoint, listEndpoint, emptyForm, toForm, toPayload, validate, renderForm, renderRow, activeKey, activeLabels = ["Active", "Hidden"],
  reorderable, deleteConfig, canCreate = true, formTitle, formIntro, listTitle, listIntro, emptyTitle, emptyText,
}: Props<T, F>) {
  const resource = useAdminResource<T>(endpoint, { listEndpoint });
  const { notice, clear, success, fail } = useNotice();
  const [form, setForm] = useState<F>(emptyForm);
  const [editing, setEditing] = useState<T | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<{ item: T; config: DeleteConfig } | null>(null);
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (patch: Partial<F>) => setForm((current) => ({ ...current, ...patch }));

  function reset() {
    setForm(emptyForm);
    setEditing(null);
    setFormError("");
  }

  function startEdit(item: T) {
    setEditing(item);
    setForm(toForm(item));
    setFormError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function save() {
    const problem = validate?.(form, editing) ?? null;
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const body = toPayload ? toPayload(form, editing) : (form as Record<string, unknown>);
      if (editing) await resource.update(editing.id, body);
      else await resource.create(body);
      success(`${cap(singular)} ${editing ? "saved" : "added"}.`);
      reset();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : `Could not save the ${singular}.`);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await resource.remove(deleting.item.id);
      success(deleting.config.done);
      if (editing?.id === deleting.item.id) reset();
    } catch (error) {
      fail(error, `Could not delete the ${singular}.`);
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }

  async function toggleActive(item: T) {
    if (!activeKey) return;
    setWorking(item.id);
    try {
      await resource.update(item.id, { [activeKey]: !item[activeKey] });
    } catch (error) {
      fail(error, `Could not update the ${singular}.`);
    } finally {
      setWorking(null);
    }
  }

  async function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= resource.items.length) return;
    const next = [...resource.items];
    [next[index], next[target]] = [next[target], next[index]];
    resource.setItems(next);
    setWorking(next[target].id);
    try {
      await resource.reorder(next.map((item) => item.id));
    } catch (error) {
      fail(error, "Could not save the new order.");
      await resource.reload();
    } finally {
      setWorking(null);
    }
  }

  const showForm = canCreate || editing !== null;

  return (
    <div className="space-y-6">
      {notice ? <Alert tone={notice.tone} onDismiss={clear}>{notice.text}</Alert> : null}
      <div className={`grid gap-6 ${showForm ? "xl:grid-cols-[0.9fr_1.4fr]" : ""}`}>
        {showForm ? (
          <form ref={formRef} className={`${cardCls} self-start`} onSubmit={(event) => { event.preventDefault(); void save(); }} aria-label={`${cap(singular)} form`}>
            <h2 className="text-xl font-semibold tracking-tight">{formTitle ? formTitle(editing) : `${editing ? "Edit" : "Add"} ${singular}`}</h2>
            {formIntro?.(editing) ? <div className="mt-2 text-sm text-stone-500">{formIntro(editing)}</div> : null}
            <div className="mt-4 space-y-4">
              {formError ? <Alert>{formError}</Alert> : null}
              {renderForm({ form, set, editing })}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className={primaryBtn}>{saving ? "Saving..." : editing ? "Save changes" : `Add ${singular}`}</button>
                {editing ? <button type="button" onClick={reset} className={secondaryBtn}>Cancel</button> : null}
              </div>
            </div>
          </form>
        ) : null}

        <div className={cardCls}>
          {listTitle ? <h2 className="text-xl font-semibold tracking-tight">{listTitle}</h2> : null}
          {listIntro ? <div className="mt-1 text-sm text-stone-500">{listIntro}</div> : null}
          {resource.loading ? (
            <Spinner label={`Loading ${plural}`} />
          ) : resource.error ? (
            <div className="mt-4"><Alert onRetry={() => void resource.reload()}>{resource.error}</Alert></div>
          ) : resource.items.length === 0 ? (
            <EmptyState title={emptyTitle ?? `No ${plural} yet`} text={emptyText ?? `Use the form to add your first ${singular}.`} />
          ) : (
            <ul className={`${listTitle ? "mt-4" : ""} space-y-3`} aria-label={cap(plural)}>
              {resource.items.map((item, index) => {
                const row = renderRow(item);
                const config = deleteConfig ? deleteConfig(item) : null;
                const on = activeKey ? Boolean(item[activeKey]) : true;
                const disabled = working === item.id;
                return (
                  <li key={item.id} className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${editing?.id === item.id ? "border-stone-900" : "border-stone-200"}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin uploads come from arbitrary hosts */}
                      {row.image === null ? null : row.image ? <img src={row.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" /> : <div className="h-14 w-14 shrink-0 rounded-lg bg-stone-200" aria-hidden="true" />}
                      <div className="min-w-0">
                        <div className="line-clamp-2 break-words font-medium">{row.title}</div>
                        {row.subtitle ? <div className="line-clamp-2 break-words text-sm text-stone-500">{row.subtitle}</div> : null}
                        {row.badges ? <div className="mt-1 flex flex-wrap gap-1">{row.badges}</div> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {reorderable ? (
                        <>
                          <button type="button" className={smallBtn} disabled={disabled || index === 0} onClick={() => void move(index, -1)} aria-label={`Move ${row.title} up`}><ArrowUp size={14} /></button>
                          <button type="button" className={smallBtn} disabled={disabled || index === resource.items.length - 1} onClick={() => void move(index, 1)} aria-label={`Move ${row.title} down`}><ArrowDown size={14} /></button>
                        </>
                      ) : null}
                      {activeKey ? (
                        <button
                          type="button"
                          disabled={disabled}
                          aria-pressed={on}
                          onClick={() => void toggleActive(item)}
                          aria-label={`${on ? activeLabels[0] : activeLabels[1]}: ${row.title}. Click to ${on ? "hide" : "show"}`}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${on ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-700"}`}
                        >
                          {on ? activeLabels[0] : activeLabels[1]}
                        </button>
                      ) : null}
                      <button type="button" onClick={() => startEdit(item)} className={smallBtn} aria-label={`Edit ${row.title}`}>Edit</button>
                      {config ? <button type="button" onClick={() => setDeleting({ item, config })} className={smallDangerBtn} aria-label={`${config.label} ${row.title}`}>{config.label}</button> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        destructive={deleting?.config.destructive ?? true}
        busy={busy}
        title={deleting?.config.title ?? ""}
        message={deleting?.config.message}
        confirmLabel={deleting?.config.confirmLabel ?? "Delete"}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

/** Standard delete configuration, with an optional extra sentence about side effects. */
export function standardDelete(singular: string, name: string, extra?: ReactNode): DeleteConfig {
  return {
    label: "Delete",
    title: `Delete this ${singular}?`,
    message: <>This permanently removes <strong>{name}</strong>. {extra}</>,
    confirmLabel: "Delete",
    done: `${cap(singular)} deleted.`,
  };
}
