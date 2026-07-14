-- 0001_init.sql — Phase 0 schema for the Lab Result Explainer.
--
-- Paste this whole file into the Supabase SQL Editor and run it. Safe to run and
-- re-run: the file is one explicit transaction (a failure rolls everything back —
-- no half-applied schema) and every statement is idempotent (a re-run converges
-- instead of erroring with "already exists").
--
-- One environment-dependent exception: hosted Supabase has been progressively
-- restricting DDL on the storage schema (storage.objects ownership changed in
-- late 2025), so the storage policies at the bottom run in a guarded block — if
-- the role lacks privileges they raise a WARNING with instructions instead of
-- failing the migration. Until they exist the bucket is private deny-all, which
-- fails safe: nobody but the secret-key client can touch it.
--
-- Maps 1:1 onto the shared types in src/lib/types/index.ts (the contract — SPEC.md
-- §Data model): Report (patient fields embedded), ResultRow, Explanation, ShareLink.
-- Columns are snake_case; the camelCase mapping lives in the app's data-access layer
-- (Phase 1). No analytes table — the analyte dictionary is code (src/lib/analytes/).
--
-- RLS baseline (Phase 0): authenticated provider only, no anonymous access. The
-- DOB-gated patient/share-link read policy is Phase 3. Synthetic data only in v1
-- (FR-15), but built as if it were real PHI.

begin;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- reports — Report + embedded PatientInfo
-- ---------------------------------------------------------------------------

create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  patient_name  text not null,
  patient_email text not null,
  patient_dob   date not null,
  pdf_ref       text not null, -- storage path in the report-pdfs bucket
  status        text not null default 'uploaded'
    check (status in ('uploaded', 'extracted', 'verified', 'held', 'drafted', 'approved', 'sent')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- result_rows — ResultRow (one row per test on a report)
-- ---------------------------------------------------------------------------

create table if not exists public.result_rows (
  id                    uuid primary key default gen_random_uuid(),
  report_id             uuid not null references public.reports (id) on delete cascade,
  raw_name              text not null,
  analyte_id            text,     -- null = not matched to the dictionary ("not covered")
  value                 text not null, -- as printed on the PDF; may be "Negative", ">90"
  unit                  text,
  ref_low               numeric,
  ref_high              numeric,
  raw_range             text,
  lab_flags             text[] not null default '{}',
  low_confidence_fields text[] not null default '{}',
  classification        jsonb    -- null until the provider verifies (FR-05); shape owned by pure code
);

create index if not exists result_rows_report_id_idx on public.result_rows (report_id);

-- ---------------------------------------------------------------------------
-- explanations — Explanation (one per report)
-- ---------------------------------------------------------------------------

create table if not exists public.explanations (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid not null unique references public.reports (id) on delete cascade,
  overall_text text not null,
  per_test     jsonb not null default '[]', -- PerTestExplanation[]
  sources      jsonb not null default '[]', -- Source[] (MedlinePlus attribution, FR-09)
  status       text not null default 'draft'
    check (status in ('draft', 'approved')),
  approved_at  timestamptz
);

-- ---------------------------------------------------------------------------
-- share_links — ShareLink (token is never logged; safety rule 5)
-- ---------------------------------------------------------------------------

create table if not exists public.share_links (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports (id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null,
  opened_at  timestamptz
);

create index if not exists share_links_report_id_idx on public.share_links (report_id);

-- ---------------------------------------------------------------------------
-- RLS — authenticated provider only; no anon access (patient path is Phase 3)
-- ---------------------------------------------------------------------------

alter table public.reports      enable row level security;
alter table public.result_rows  enable row level security;
alter table public.explanations enable row level security;
alter table public.share_links  enable row level security;

drop policy if exists "authenticated full access" on public.reports;
create policy "authenticated full access" on public.reports
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on public.result_rows;
create policy "authenticated full access" on public.result_rows
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on public.explanations;
create policy "authenticated full access" on public.explanations
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on public.share_links;
create policy "authenticated full access" on public.share_links
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage — private bucket for uploaded lab PDFs (infra only; upload logic is Phase 1)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('report-pdfs', 'report-pdfs', false)
on conflict (id) do nothing;

-- Policies on storage.objects need table ownership, which hosted Supabase may not
-- grant this role (works in the SQL Editor as of mid-2026; fails over direct
-- connections). Guarded so a privilege error degrades to a WARNING instead of
-- failing the migration — the bucket stays private deny-all until the policies
-- exist, so the failure mode is more restrictive, never less.
do $$
begin
  drop policy if exists "authenticated read report pdfs" on storage.objects;
  create policy "authenticated read report pdfs" on storage.objects
    for select to authenticated using (bucket_id = 'report-pdfs');

  drop policy if exists "authenticated insert report pdfs" on storage.objects;
  create policy "authenticated insert report pdfs" on storage.objects
    for insert to authenticated with check (bucket_id = 'report-pdfs');

  drop policy if exists "authenticated update report pdfs" on storage.objects;
  create policy "authenticated update report pdfs" on storage.objects
    for update to authenticated
    using (bucket_id = 'report-pdfs') with check (bucket_id = 'report-pdfs');

  drop policy if exists "authenticated delete report pdfs" on storage.objects;
  create policy "authenticated delete report pdfs" on storage.objects
    for delete to authenticated using (bucket_id = 'report-pdfs');
exception
  when insufficient_privilege then
    raise warning 'Could not create policies on storage.objects (insufficient privileges). '
      'Everything else applied. The report-pdfs bucket is private deny-all until you add '
      'the four policies (select/insert/update/delete for authenticated, scoped to '
      'bucket_id = report-pdfs) via Dashboard -> Storage -> Policies.';
end;
$$;

commit;
