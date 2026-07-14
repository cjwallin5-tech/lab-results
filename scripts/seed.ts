/**
 * Seed script — demo provider auth user + 3 synthetic reports. Safe to re-run:
 * the provider create tolerates "already exists" and reports upsert on fixed ids.
 *
 * Run with `npm run seed` (loads .env.local via --env-file; fails loudly if missing).
 *
 * Synthetic data only (FR-15): obviously fake names, example.com emails, fake DOBs.
 * Built as if it were real PHI anyway — the summary below prints no DOBs (safety rule 5).
 *
 * This is a plain Node script, not Next.js runtime, so it can't import
 * src/lib/supabase/server.ts (guarded by 'server-only'); it builds its own
 * admin client with the same env names.
 */

import { createClient } from '@supabase/supabase-js';
import { requireEnv } from '../src/lib/supabase/env';

const DEMO_PROVIDER_EMAIL = 'provider@demo.example';
const DEMO_PROVIDER_PASSWORD = 'demo-provider-password'; // synthetic demo account only (FR-01)

/** Fixed ids so re-runs upsert the same rows instead of piling up duplicates. */
const SEED_REPORTS = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    patient_name: 'Pat Placeholder',
    patient_email: 'pat.placeholder@example.com',
    patient_dob: '1985-01-15',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    patient_name: 'Sam Sample',
    patient_email: 'sam.sample@example.com',
    patient_dob: '1992-06-30',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    patient_name: 'Tess Testcase',
    patient_email: 'tess.testcase@example.com',
    patient_dob: '1978-11-02',
  },
];

async function main() {
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv('SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error: userError } = await supabase.auth.admin.createUser({
    email: DEMO_PROVIDER_EMAIL,
    password: DEMO_PROVIDER_PASSWORD,
    email_confirm: true,
  });
  if (userError && userError.code !== 'email_exists') {
    throw new Error(`Failed to create demo provider: ${userError.message}`);
  }
  console.log(
    userError
      ? `Demo provider already exists: ${DEMO_PROVIDER_EMAIL}`
      : `Created demo provider: ${DEMO_PROVIDER_EMAIL}`,
  );

  const rows = SEED_REPORTS.map((report) => ({
    ...report,
    // Placeholder path in the report-pdfs bucket — no object exists yet; Phase 1's
    // upload flow writes real files. Status stays 'uploaded': nothing extracted.
    pdf_ref: `seed/${report.id}.pdf`,
    status: 'uploaded',
  }));

  const { data, error: reportError } = await supabase
    .from('reports')
    .upsert(rows, { onConflict: 'id' })
    .select('id, patient_name');
  if (reportError) {
    throw new Error(`Failed to upsert seed reports: ${reportError.message}`);
  }

  console.log(`Upserted ${data.length} synthetic reports:`);
  for (const report of data) {
    console.log(`  ${report.id}  ${report.patient_name}`);
  }
  console.log(`\nDemo login: ${DEMO_PROVIDER_EMAIL} / ${DEMO_PROVIDER_PASSWORD}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
