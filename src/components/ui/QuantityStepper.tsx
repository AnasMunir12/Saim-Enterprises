import { Minus, Plus } from "lucide-react";

export function QuantityStepper({ value, min = 1, max, onChange, label }: { value: number; min?: number; max: number; onChange: (next: number) => void; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Decrease quantity of ${label}`}><Minus size={14} aria-hidden="true" /></button>
      <output aria-live="polite" aria-label={`Quantity ${value}`}>{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Increase quantity of ${label}`}><Plus size={14} aria-hidden="true" /></button>
    </div>
  );
}
