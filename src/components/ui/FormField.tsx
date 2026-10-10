"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

type Shared = { label: string; hint?: ReactNode; error?: string; aside?: ReactNode };

function Shell({ id, label, required, hint, error, aside, children }: Shared & { id: string; required?: boolean; children: ReactNode }) {
  return (
    <div className={`field${error ? " field--invalid" : ""}`}>
      <div className="field__label">
        <label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label>
        {aside}
      </div>
      {children}
      {hint ? <p className="field__hint" id={`${id}-hint`}>{hint}</p> : null}
      {error ? <p className="field__error" id={`${id}-error`} role="alert">{error}</p> : null}
    </div>
  );
}

const describedBy = (id: string, hint: ReactNode, error?: string) => [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

/** A labelled text input with optional hint, inline error and a right-aligned aside (e.g. "Forgot password?"). */
export function TextField({ label, hint, error, aside, ...input }: Shared & Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  const id = useId();
  return (
    <Shell id={id} label={label} required={input.required} hint={hint} error={error} aside={aside}>
      <input {...input} id={id} className="field__control" aria-describedby={describedBy(id, hint, error)} aria-invalid={error ? true : undefined} />
    </Shell>
  );
}

export function TextArea({ label, hint, error, aside, ...area }: Shared & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  const id = useId();
  return (
    <Shell id={id} label={label} required={area.required} hint={hint} error={error} aside={aside}>
      <textarea {...area} id={id} className="field__control" aria-describedby={describedBy(id, hint, error)} aria-invalid={error ? true : undefined} />
    </Shell>
  );
}

/** Hidden bot trap: people never see or fill it, scripts often do. */
export function HoneypotField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="field--trap" aria-hidden="true">
      <label>
        Website
        <input name="website" value={value} onChange={(event) => onChange(event.target.value)} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
