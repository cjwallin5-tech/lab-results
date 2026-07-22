-- 0002_outreach_and_row_ordinal.sql — Phase 3 data-layer swap prerequisites.
--
-- Paste this whole file into the Supabase SQL Editor and run it, after 0001_init.sql.
-- Safe to run and re-run: one explicit transaction (a failure rolls everything back)
-- and every statement is idempotent (a re-run converges instead of erroring). Both
-- changes are additive; result_rows is empty at first apply, so no backfill.
--
-- Two changes the app's data-access layer now depends on:
--   1. outreach — a new table for the provider's direct-contact log (FR-07).
--   2. result_rows.ordinal — a per-row sort key so the Supabase read returns rows in
--      the same order the mock did (the order the provider verified against the PDF).

begin;

-- ---------------------------------------------------------------------------
-- outreach — OutreachEntry (many per report; keyed report_id + analyte_id)
-- ---------------------------------------------------------------------------
-- Maps 1:1 onto OutreachEntry in src/lib/types/index.ts: a provider's record that they
-- contacted the patient about a critical result. Documentation only — it never lifts the
-- hold, drafts, or sends. Columns are snake_case; the camelCase mapping lives in the app's
-- data-access layer. The note is provider-entered and never written to logs (safety rule 5).
-- Its own table, not a column on reports, the same way result_rows and explanations are
-- separate stores. RLS matches 0001: authenticated provider only, no anonymous access.

create table if not exists public.outreach (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports (id) on delete cascade,
  analyte_id text not null,     -- the critical result contacted about (dictionary slug)
  method     text not null check (method in ('phone', 'other')),
  note       text not null,     -- provider-entered; never logged (safety rule 5)
  at         timestamptz not null default now()
);

create index if not exists outreach_report_id_idx on public.outreach (report_id);

alter table public.outreach enable row level security;

drop policy if exists "authenticated full access" on public.outreach;
create policy "authenticated full access" on public.outreach
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- result_rows.ordinal — stable display order
-- ---------------------------------------------------------------------------
-- Rows are shown in the order the provider verified them against the PDF (top to
-- bottom); the app renders result_rows by array position. A SELECT has no inherent
-- order (the uuid pk is random and a batch insert shares one timestamp), so the data
-- layer writes an explicit ordinal on save and orders by it on read.

alter table public.result_rows
  add column if not exists ordinal integer not null default 0;

commit;
