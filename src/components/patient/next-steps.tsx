import { CLINIC } from '@/lib/clinic';

/**
 * Orientation for the patient after they read their results. Deliberately no
 * medical advice: framing only (FR-14), pointing back to the provider and clinic.
 */
export function NextSteps() {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
      <h2 className="font-display text-xl text-ink">What to do next</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-ink/80">
        <li>
          These results are here to help you understand your health, not to diagnose anything.
        </li>
        <li>Keep them for your records and bring any questions to your next visit.</li>
        <li>
          Want to talk something through sooner? Call {CLINIC.name} at {CLINIC.phone}.
        </li>
      </ul>
    </section>
  );
}
