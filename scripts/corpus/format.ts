import type { LabLayout, RefRange } from './scenarios';

/**
 * Shared reference-range formatting, so a layout template and the draft answer
 * key never disagree about what the range cell says. Each lab writes the same
 * canonical range differently:
 *   two-sided  Quest "65-99"      LabCorp "65 - 99"
 *   low-only   Quest "> OR = 60"  LabCorp ">60"
 *   high-only  Quest "< OR = 39"  LabCorp "<39"
 *   none       (no range printed)
 */
export function formatRawRange(layout: LabLayout, range: RefRange): string | undefined {
  switch (range.kind) {
    case 'none':
      return undefined;
    case 'two-sided':
      return layout === 'quest' ? `${range.low}-${range.high}` : `${range.low} - ${range.high}`;
    case 'low-only':
      return layout === 'quest' ? `> OR = ${range.low}` : `>${range.low}`;
    case 'high-only':
      return layout === 'quest' ? `< OR = ${range.high}` : `<${range.high}`;
  }
}

/** The bounds a row's range contributes to the answer key (refLow / refHigh). */
export function rangeBounds(range: RefRange): { refLow?: string; refHigh?: string } {
  switch (range.kind) {
    case 'none':
      return {};
    case 'two-sided':
      return { refLow: range.low, refHigh: range.high };
    case 'low-only':
      return { refLow: range.low };
    case 'high-only':
      return { refHigh: range.high };
  }
}
