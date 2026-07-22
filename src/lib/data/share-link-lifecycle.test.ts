import { describe, expect, it } from 'vitest';
import { createShareLink, getShareLinkByToken, markShareLinkOpened } from './index';
import { MOCK_SHARE_LINKS } from './mock';

/**
 * Share-link lifecycle on the mock driver (DATA_OFFLINE=1 in vitest): a re-send after
 * expiry regenerates the link, and the first open wins. The Supabase driver mirrors both
 * and is proven live by check-data. Uses report ids not in the seed to avoid touching
 * demo state.
 */

describe('createShareLink', () => {
  it('reuses a live (unexpired) link for the same report', async () => {
    const first = await createShareLink('rpt-lifecycle-reuse');
    const second = await createShareLink('rpt-lifecycle-reuse');
    expect(second.token).toBe(first.token);
  });

  it('regenerates an expired link so a re-send yields a fresh, unexpired one', async () => {
    const reportId = 'rpt-lifecycle-expired';
    MOCK_SHARE_LINKS.push({
      id: 'sl-expired',
      reportId,
      token: 'expired-token',
      expiresAt: '2000-01-01T00:00:00.000Z', // long past
      openedAt: undefined,
    });

    const fresh = await createShareLink(reportId);
    expect(fresh.token).not.toBe('expired-token');
    expect(new Date(fresh.expiresAt).getTime()).toBeGreaterThan(Date.now());
    // Still one link per report: the expired one was removed, not left alongside.
    expect(MOCK_SHARE_LINKS.filter((link) => link.reportId === reportId)).toHaveLength(1);
  });
});

describe('markShareLinkOpened', () => {
  it('stamps openedAt on first open and never overwrites it', async () => {
    const link = await createShareLink('rpt-lifecycle-open');

    await markShareLinkOpened(link.token);
    const firstOpen = (await getShareLinkByToken(link.token))?.openedAt;
    expect(firstOpen).toBeDefined();

    await markShareLinkOpened(link.token);
    const secondOpen = (await getShareLinkByToken(link.token))?.openedAt;
    expect(secondOpen).toBe(firstOpen);
  });
});
