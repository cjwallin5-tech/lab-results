-- 0003_share_link_unique.sql — enforce one share link per report at the database.
--
-- Paste this whole file into the Supabase SQL Editor and run it, after 0002. Safe to
-- run and re-run: one explicit transaction, idempotent statements.
--
-- Why: the app's createShareLink is check-then-insert, so two concurrent sends (a
-- double-click races two server actions) could both pass the "no existing link" check
-- and insert two rows for one report. Reads use .maybeSingle(), which errors on more
-- than one row — a duplicate would make the report page unloadable. This makes the
-- one-live-link-per-report invariant (SPEC FR-11) a database guarantee; the app treats
-- a unique violation as "lost the race" and returns the surviving row.

begin;

-- Dedupe defensively before constraining: keep the newest link per report (latest
-- expires_at; id as the deterministic tie-break) so the migration applies cleanly on a
-- database that already carries duplicates.
delete from public.share_links a
using public.share_links b
where a.report_id = b.report_id
  and a.id <> b.id
  and (a.expires_at < b.expires_at
       or (a.expires_at = b.expires_at and a.id < b.id));

-- The unique index supersedes the plain lookup index from 0001.
drop index if exists public.share_links_report_id_idx;

create unique index if not exists share_links_report_id_key
  on public.share_links (report_id);

commit;
