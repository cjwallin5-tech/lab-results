import { sentCount } from '@/lib/email';

/**
 * E2E-only hook: how many messages the offline email seam has queued this
 * process. The suite asserts that a send actually reached the seam rather than
 * that a screen merely succeeded.
 *
 * Invisible (404) unless E2E_TEST_HOOKS=1, which only playwright.config sets.
 * The response is two integers — no address, token, body, or report can reach
 * it, because the seam records none (safety rule 5).
 */

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  if (process.env.E2E_TEST_HOOKS !== '1') {
    return new Response('Not found', { status: 404 });
  }

  return Response.json({
    shareLink: sentCount('share-link'),
    question: sentCount('question'),
  });
}
