/** A prominent alert shown at the top of the results when any result is critical (FR-07). */
export function CriticalAlert({ clinicName, phone }: { clinicName: string; phone: string }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-card)] border border-critical/40 bg-critical-soft p-5"
    >
      <h2 className="font-display text-lg text-critical">
        One or more results need prompt attention
      </h2>
      <p className="mt-1 text-sm text-ink/80">
        Please contact your care team soon. If this is urgent or you feel unwell, call {clinicName}{" "}
        at {phone} or seek emergency care.
      </p>
    </div>
  );
}
