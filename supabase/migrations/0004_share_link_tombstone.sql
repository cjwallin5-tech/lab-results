-- 0004_share_link_tombstone.sql — keep superseded share links as tombstones.
--
-- Paste this whole file into the Supabase SQL Editor and run it, after 0003. Safe to
-- run and re-run: one explicit transaction, idempotent statements.
--
-- Why: re-sending after expiry used to DELETE the expired link, so a patient clicking
-- the old emailed URL got a bare 404. Keeping the row (marked superseded) lets the
-- token lookup still find it, and the patient page's existing expired branch renders
-- ExpiredNotice with the clinic phone instead (FR-11). The 0003 full unique index would
-- forbid the tombstone sitting next to the fresh link, so it becomes a PARTIAL unique
-- index: the "exactly one live link per report" invariant now counts only rows that
-- have not been superseded.

begin;

alter table public.share_links
  add column if not exists superseded_at timestamptz;

drop index if exists public.share_links_report_id_key;

create unique index if not exists share_links_report_id_live_key
  on public.share_links (report_id)
  where superseded_at is null;

commit;
