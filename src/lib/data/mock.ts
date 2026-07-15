import type { Explanation, Report, ResultRow, ShareLink } from '@/lib/types';

/**
 * Synthetic data for developing the web page before the Supabase data-access
 * layer and the Logic/Content tracks land. Shaped exactly to the shared types.
 * Replace these reads (src/lib/data/index.ts) with Supabase queries later; the
 * screens do not change.
 */

export const MOCK_REPORTS: Report[] = [
  {
    id: 'rpt-alvarez',
    patient: { name: 'Maria Alvarez', email: 'maria.alvarez@example.test', dob: '1984-03-12' },
    pdfRef: 'alvarez-lipid-cbc',
    status: 'sent',
    createdAt: '2026-07-13T15:20:00.000Z',
    updatedAt: '2026-07-13T15:40:00.000Z',
  },
  {
    id: 'rpt-chen',
    patient: { name: 'David Chen', email: 'david.chen@example.test', dob: '1971-11-02' },
    pdfRef: 'chen-metabolic',
    status: 'held',
    createdAt: '2026-07-13T16:05:00.000Z',
    updatedAt: '2026-07-13T16:20:00.000Z',
  },
  {
    id: 'rpt-okoro',
    patient: { name: 'Grace Okoro', email: 'grace.okoro@example.test', dob: '1990-07-25' },
    pdfRef: 'okoro-thyroid-vitd',
    status: 'drafted',
    createdAt: '2026-07-13T16:48:00.000Z',
    updatedAt: '2026-07-13T17:00:00.000Z',
  },
  {
    id: 'rpt-reyes',
    patient: { name: 'Samuel Reyes', email: 'samuel.reyes@example.test', dob: '1988-05-09' },
    pdfRef: 'reyes-annual-cmp',
    status: 'uploaded',
    createdAt: '2026-07-13T17:30:00.000Z',
    updatedAt: '2026-07-13T17:30:00.000Z',
  },
];

function row(
  over: Partial<ResultRow> & Pick<ResultRow, 'id' | 'reportId' | 'rawName' | 'value'>,
): ResultRow {
  return { labFlags: [], lowConfidenceFields: [], ...over };
}

export const MOCK_ROWS: Record<string, ResultRow[]> = {
  'rpt-alvarez': [
    row({
      id: 'a1',
      reportId: 'rpt-alvarez',
      rawName: 'Total Cholesterol',
      analyteId: 'total-cholesterol',
      value: '198',
      unit: 'mg/dL',
      refHigh: 199,
      classification: { kind: 'range', band: 'in', critical: false },
    }),
    row({
      id: 'a2',
      reportId: 'rpt-alvarez',
      rawName: 'LDL Cholesterol',
      analyteId: 'ldl-cholesterol',
      value: '134',
      unit: 'mg/dL',
      refHigh: 99,
      labFlags: ['H'],
      classification: { kind: 'range', band: 'above', critical: false },
    }),
    row({
      id: 'a3',
      reportId: 'rpt-alvarez',
      rawName: 'HDL Cholesterol',
      analyteId: 'hdl-cholesterol',
      value: '58',
      unit: 'mg/dL',
      refLow: 40,
      classification: { kind: 'range', band: 'in', critical: false },
    }),
    row({
      id: 'a4',
      reportId: 'rpt-alvarez',
      rawName: 'Hemoglobin',
      analyteId: 'hemoglobin',
      value: '13.5',
      unit: 'g/dL',
      refLow: 12,
      refHigh: 15.5,
      classification: { kind: 'range', band: 'in', critical: false },
    }),
    row({
      id: 'a5',
      reportId: 'rpt-alvarez',
      rawName: 'Iron',
      value: '65',
      unit: 'mcg/dL',
      refLow: 50,
      refHigh: 170,
      classification: { kind: 'not-covered' },
    }),
  ],
  'rpt-chen': [
    row({
      id: 'c1',
      reportId: 'rpt-chen',
      rawName: 'Sodium',
      analyteId: 'sodium',
      value: '139',
      unit: 'mmol/L',
      refLow: 136,
      refHigh: 145,
      classification: { kind: 'range', band: 'in', critical: false },
    }),
    row({
      id: 'c2',
      reportId: 'rpt-chen',
      rawName: 'Potassium',
      analyteId: 'potassium',
      value: '6.8',
      unit: 'mmol/L',
      refLow: 3.5,
      refHigh: 5.1,
      labFlags: ['HH'],
      classification: { kind: 'range', band: 'above', critical: true },
    }),
    row({
      id: 'c3',
      reportId: 'rpt-chen',
      rawName: 'Creatinine',
      analyteId: 'creatinine',
      value: '1.1',
      unit: 'mg/dL',
      refLow: 0.7,
      refHigh: 1.3,
      classification: { kind: 'range', band: 'in', critical: false },
    }),
  ],
  'rpt-okoro': [
    row({
      id: 'o1',
      reportId: 'rpt-okoro',
      rawName: 'TSH',
      analyteId: 'tsh',
      value: '2.1',
      unit: 'mIU/L',
      refLow: 0.4,
      refHigh: 4,
      classification: { kind: 'range', band: 'in', critical: false },
    }),
    row({
      id: 'o2',
      reportId: 'rpt-okoro',
      rawName: 'Vitamin D, 25-Hydroxy',
      analyteId: 'vitamin-d',
      value: '18',
      unit: 'ng/mL',
      refLow: 30,
      refHigh: 100,
      labFlags: ['L'],
      classification: { kind: 'range', band: 'below', critical: false },
    }),
    row({
      id: 'o3',
      reportId: 'rpt-okoro',
      rawName: 'Ferritin',
      value: '40',
      unit: 'ng/mL',
      refLow: 15,
      refHigh: 150,
      classification: { kind: 'not-covered' },
    }),
  ],
  'rpt-reyes': [],
};

export const MOCK_EXPLANATIONS: Record<string, Explanation> = {
  'rpt-alvarez': {
    id: 'exp-alvarez',
    reportId: 'rpt-alvarez',
    overallText:
      'Most of your results are in the typical range. Your LDL cholesterol is a little above the typical range, which is common and often improves with changes to food and activity. It is not an emergency, and it is worth a conversation at your next visit.',
    perTest: [
      {
        analyteId: 'total-cholesterol',
        text: 'Your total cholesterol is within the typical range, just under the usual cutoff.',
      },
      {
        analyteId: 'ldl-cholesterol',
        text: 'Your LDL is a little above the typical range. This is very common and often responds to diet and activity changes.',
      },
      {
        analyteId: 'hdl-cholesterol',
        text: 'Your HDL is in a healthy spot. This is the kind that helps clear other cholesterol out of your blood.',
      },
      {
        analyteId: 'hemoglobin',
        text: 'Your hemoglobin is within the typical range. Hemoglobin carries oxygen around your body.',
      },
    ],
    sources: [
      {
        analyteId: 'total-cholesterol',
        title: 'Cholesterol Levels (MedlinePlus)',
        url: 'https://medlineplus.gov/lab-tests/cholesterol-levels/',
      },
      {
        analyteId: 'ldl-cholesterol',
        title: 'LDL: The Bad Cholesterol (MedlinePlus)',
        url: 'https://medlineplus.gov/ldlthebadcholesterol.html',
      },
      {
        analyteId: 'hemoglobin',
        title: 'Hemoglobin Test (MedlinePlus)',
        url: 'https://medlineplus.gov/lab-tests/hemoglobin-test/',
      },
    ],
    status: 'approved',
    approvedAt: '2026-07-13T15:35:00.000Z',
  },
  'rpt-okoro': {
    id: 'exp-okoro',
    reportId: 'rpt-okoro',
    overallText:
      'Your thyroid result is in the typical range. Your vitamin D is a little below the typical range, which is very common, especially in winter.',
    perTest: [
      { analyteId: 'tsh', text: 'Your TSH is within the typical range.' },
      {
        analyteId: 'vitamin-d',
        text: 'Your vitamin D is a little below the typical range. This is common and often improves with a daily supplement.',
      },
    ],
    sources: [
      {
        analyteId: 'tsh',
        title: 'TSH Test (MedlinePlus)',
        url: 'https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/',
      },
      {
        analyteId: 'vitamin-d',
        title: 'Vitamin D Test (MedlinePlus)',
        url: 'https://medlineplus.gov/lab-tests/vitamin-d-test/',
      },
    ],
    status: 'draft',
  },
};

export const MOCK_SHARE_LINKS: ShareLink[] = [
  {
    id: 'sl-alvarez',
    reportId: 'rpt-alvarez',
    token: 'demo-alvarez-token',
    expiresAt: '2026-10-13T00:00:00.000Z',
    openedAt: undefined,
  },
];
