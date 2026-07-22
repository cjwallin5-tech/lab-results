import { describe, expect, it } from 'vitest';
import { approveExplanation, getExplanation, saveExplanation } from './index';

/**
 * Approved Explanation records are frozen (CLAUDE.md / FR-10): the write layer
 * itself refuses to overwrite one, so no caller — present or future — can
 * replace approved text with an unapproved draft. The sanctioned re-draft route
 * is resetReport, which deletes the explanation (clearing approval) first.
 * Exercises the in-memory mock layer; the Supabase swap must keep this behavior
 * (this test pins the contract).
 */

const content = (text: string) => ({
  overallText: text,
  perTest: [{ analyteId: 'potassium', text }],
  sources: [],
});

describe('saveExplanation freeze guard', () => {
  it('allows overwriting a draft (a re-draft replaces it)', async () => {
    await saveExplanation('rpt-freeze-a', content('first draft'));
    await saveExplanation('rpt-freeze-a', content('second draft'));
    expect((await getExplanation('rpt-freeze-a'))?.overallText).toBe('second draft');
  });

  it('refuses to overwrite an approved explanation and leaves it intact', async () => {
    await saveExplanation('rpt-freeze-b', content('approved text'));
    await approveExplanation('rpt-freeze-b');

    await expect(saveExplanation('rpt-freeze-b', content('sneaky new draft'))).rejects.toThrow(
      /approved/i,
    );

    const kept = await getExplanation('rpt-freeze-b');
    expect(kept?.status).toBe('approved');
    expect(kept?.overallText).toBe('approved text');
  });
});
