"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { smallBtn, smallDangerBtn } from "@/components/admin/ui";

type Props<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  /** Singular name of one entry: "Card" gives "Card 1", "Add card". */
  itemLabel: string;
  max: number;
  /** A fresh entry for the Add button. */
  blank: T;
  /** The fields of one entry. `patch` changes some of its values. */
  renderItem: (item: T, patch: (values: Partial<T>) => void, index: number) => ReactNode;
};

/** A short ordered list of entries the owner can add to, edit, move up or down and remove. Used for cards, photos and FAQ-style lists. */
export function RepeaterField<T extends object>({ items, onChange, itemLabel, max, blank, renderItem }: Props<T>) {
  const patchAt = (index: number) => (values: Partial<T>) => onChange(items.map((item, i) => (i === index ? { ...item, ...values } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const move = (index: number, by: -1 | 1) => {
    const next = [...items];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.length ? (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="rounded-xl border border-stone-200 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-stone-700">{itemLabel} {index + 1}</span>
                <div className="flex gap-2">
                  <button type="button" className={smallBtn} disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} up`}><ArrowUp size={14} /></button>
                  <button type="button" className={smallBtn} disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} down`}><ArrowDown size={14} /></button>
                  <button type="button" className={smallDangerBtn} onClick={() => remove(index)} aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="space-y-4">{renderItem(item, patchAt(index), index)}</div>
            </li>
          ))}
        </ol>
      ) : null}
      <button type="button" className={smallBtn} disabled={items.length >= max} onClick={() => onChange([...items, { ...blank }])}>
        <Plus size={12} /> Add {itemLabel.toLowerCase()}
      </button>
      {items.length >= max ? <p className="text-xs text-stone-400">You can add up to {max}.</p> : null}
    </div>
  );
}
