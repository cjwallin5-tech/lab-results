import Link from "next/link";

/** The dark-green call-to-action band at the foot of the patient results page. */
export function CtaBand({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-forest-deep px-8 py-7 text-cream sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        <p className="mt-1 text-sm text-cream/70">{subtitle}</p>
      </div>
      <Link
        href={actionHref}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-cream px-5 py-2.5 text-sm font-medium text-forest-deep transition-colors hover:bg-paper"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
