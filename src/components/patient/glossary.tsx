import type { Classification } from "@/lib/model/types";

interface Term {
  label: string;
  definition: string;
  applies: (c: Classification) => boolean;
}

const TERMS: Term[] = [
  {
    label: "In range",
    definition: "Your result falls within the typical range for this test.",
    applies: (c) => c.kind === "placed" && c.position === "in" && !c.critical,
  },
  {
    label: "A little low or high",
    definition:
      "Your result is a little outside the typical range. This is common and often not a concern; your provider can explain what it means for you.",
    applies: (c) => c.kind === "placed" && c.position !== "in" && !c.critical,
  },
  {
    label: "Needs prompt attention",
    definition:
      "A result the lab or your provider flagged as needing a timely conversation. Use the contact option on this page.",
    applies: (c) => c.kind === "placed" && c.critical,
  },
  {
    label: "Please double-check",
    definition:
      "A value that looks unusual and will be re-checked with your provider before it is read as a result.",
    applies: (c) => c.kind === "implausible",
  },
  {
    label: "Not covered yet",
    definition: "A test we do not have a plain-language explanation for yet.",
    applies: (c) => c.kind === "not-covered",
  },
];

/**
 * A collapsible explanation of the status labels used on the page, limited to the
 * labels that actually appear in this patient's results.
 */
export function Glossary({ classifications }: { classifications: Classification[] }) {
  const terms = TERMS.filter((term) => classifications.some(term.applies));
  if (terms.length === 0) return null;

  return (
    <details className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
      <summary className="cursor-pointer text-sm font-medium text-ink">
        What these labels mean
      </summary>
      <dl className="mt-4 flex flex-col gap-3">
        {terms.map((term) => (
          <div key={term.label}>
            <dt className="text-sm font-medium text-ink">{term.label}</dt>
            <dd className="text-sm text-muted">{term.definition}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
