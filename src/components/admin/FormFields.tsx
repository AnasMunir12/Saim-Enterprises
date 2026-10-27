"use client";

import { useId, type ReactNode } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Field, inputCls } from "@/components/admin/ui";

// Labelled form controls with consistent spacing, hints and error text. Each one wires the label to its input.

type Common = { label: string; hint?: string; error?: string; required?: boolean };

export function TextField({ label, hint, error, required, value, onChange, placeholder, type = "text", maxLength, disabled, autoComplete }: Common & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel" | "password" | "number";
  maxLength?: number;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <Field label={required ? `${label} *` : label} hint={hint} error={error} htmlFor={id}>
      {type === "password" ? (
        <PasswordInput id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} disabled={disabled} autoComplete={autoComplete} aria-required={required} className={inputCls} />
      ) : (
        <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} disabled={disabled} autoComplete={autoComplete} aria-required={required} className={inputCls} />
      )}
    </Field>
  );
}

export function TextAreaField({ label, hint, error, required, value, onChange, placeholder, rows = 3, maxLength }: Common & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <Field label={required ? `${label} *` : label} hint={hint} error={error} htmlFor={id}>
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} maxLength={maxLength} aria-required={required} className={inputCls} />
    </Field>
  );
}

export function SelectField({ label, hint, error, value, onChange, options }: Common & {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={inputCls}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  );
}

export function CheckboxField({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        {label}
      </label>
      {hint ? <p className="mt-1 pl-6 text-xs text-stone-400">{hint}</p> : null}
    </div>
  );
}

/** Controls side by side when the form is wide enough, stacked otherwise. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-4">{children}</div>;
}
