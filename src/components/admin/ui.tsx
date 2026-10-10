"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export const inputCls =
  "w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:opacity-60";
export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium !text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60";
export const dangerBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium !text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60";
export const smallBtn =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50";
export const smallDangerBtn =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50";
export const cardCls = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className={`${cardCls} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
      <div>
        {eyebrow ? <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-stone-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

const tones = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  stone: "bg-stone-200 text-stone-600",
  blue: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
} as const;

export function Badge({ tone = "stone", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${tones[tone]}`}>{children}</span>;
}

export function Alert({ tone = "error", children, onRetry, onDismiss }: { tone?: "error" | "success" | "info"; children: ReactNode; onRetry?: () => void; onDismiss?: () => void }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {tone === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
      <div className="flex-1">{children}</div>
      {onRetry ? <button type="button" onClick={onRetry} className="font-medium underline">Retry</button> : null}
      {onDismiss ? <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0"><X size={14} /></button> : null}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-stone-500">
      <LoaderCircle className="animate-spin" size={18} /> {label}...
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <p className="text-base font-medium text-stone-800">{title}</p>
      {text ? <p className="max-w-sm text-sm text-stone-500">{text}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 id="confirm-title" className="text-lg font-semibold tracking-tight">{title}</h3>
        <div id="confirm-message" className="mt-2 text-sm text-stone-600">{message}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className={secondaryBtn}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className={destructive ? dangerBtn : primaryBtn}>
            {busy ? <LoaderCircle className="animate-spin" size={14} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Right-hand slide-over panel used for create/edit forms and detail views.
export function SidePanel({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-stone-900/40" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close panel" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="border-t border-stone-200 bg-stone-50 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-4 text-sm text-stone-600">
      <button type="button" className={smallBtn} disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span>Page {page} of {pages}</span>
      <button type="button" className={smallBtn} disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-stone-700">{label}</label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-stone-400">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
