const TERMS: [string, string][] = [
  ["In range", "Your result falls within the typical range for this test."],
  [
    "A little low or high",
    "Your result is a little outside the typical range. This is common and often not a concern; your provider can explain what it means for you.",
  ],
  [
    "Needs prompt attention",
    "A result the lab or your provider flagged as needing a timely conversation. Use the contact option on this page.",
  ],
  [
    "Please double-check",
    "A value that looks unusual and will be re-checked with your provider before it is read as a result.",
  ],
  ["Not covered yet", "A test we do not have a plain-language explanation for yet."],
];

/** A collapsible explanation of the status labels used on the page. */
export function Glossary() {
  return (
    <details className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
      <summary className="cursor-pointer text-sm font-medium text-ink">
        What these labels mean
      </summary>
      <dl className="mt-4 flex flex-col gap-3">
        {TERMS.map(([term, definition]) => (
          <div key={term}>
            <dt className="text-sm font-medium text-ink">{term}</dt>
            <dd className="text-sm text-muted">{definition}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
