import { describe, expect, it } from 'vitest';
import { sendQuestion, sendShareLink, sentCount } from './index';

/**
 * The offline recorder proves a message was queued without sending or storing anything.
 * `sent[]` is process-local module state that accumulates across cases, so these assert
 * deltas, not absolute counts.
 */

describe('email seam (offline recorder)', () => {
  it('records a share-link send and counts it by kind', async () => {
    const before = sentCount('share-link');
    await sendShareLink();
    expect(sentCount('share-link')).toBe(before + 1);
  });

  it('counts each kind independently', async () => {
    const shareBefore = sentCount('share-link');
    const questionBefore = sentCount('question');
    await sendQuestion();
    expect(sentCount('question')).toBe(questionBefore + 1);
    expect(sentCount('share-link')).toBe(shareBefore);
  });
});
