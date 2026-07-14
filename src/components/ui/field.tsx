import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

const inputClasses = cn(
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink",
  "placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20",
);

/** A labelled text input for provider and patient forms. */
export function TextField({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <input className={inputClasses} {...props} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** The segmented month / day / year date-of-birth field used on the share gate. */
export function DobField({ error }: { error?: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        Date of birth
      </legend>
      <div className="flex gap-3">
        <input
          name="month"
          inputMode="numeric"
          aria-label="Month"
          placeholder="MM"
          maxLength={2}
          className={cn(inputClasses, "w-16 text-center")}
        />
        <input
          name="day"
          inputMode="numeric"
          aria-label="Day"
          placeholder="DD"
          maxLength={2}
          className={cn(inputClasses, "w-16 text-center")}
        />
        <input
          name="year"
          inputMode="numeric"
          aria-label="Year"
          placeholder="YYYY"
          maxLength={4}
          className={cn(inputClasses, "w-24 text-center")}
        />
      </div>
      {error && <p className="mt-2 text-sm text-critical">{error}</p>}
    </fieldset>
  );
}
