import type { Explanation, ResultRow } from '@/lib/types';
import { MOCK_EXPLANATIONS, MOCK_ROWS } from './mock';

/**
 * When a freshly uploaded mock report is "read" and "drafted", it borrows a
 * representative rows-and-explanation set so the provider flow can be walked end
 * to end on mock data. These are fixed templates, independent of the seed data,
 * so a report can be reset and re-walked. The real rows come from the Logic
 * track's extraction and the real text from the Content track's drafting.
 */

const TEMPLATE_ROWS: Omit<ResultRow, 'id' | 'reportId'>[] = [
  {
    rawName: 'Total Cholesterol',
    analyteId: 'total-cholesterol',
    value: '198',
    unit: 'mg/dL',
    refHigh: 199,
    labFlags: [],
    lowConfidenceFields: [],
    classification: { kind: 'range', band: 'in', critical: false },
  },
  {
    rawName: 'LDL Cholesterol',
    analyteId: 'ldl-cholesterol',
    value: '134',
    unit: 'mg/dL',
    refHigh: 99,
    labFlags: ['H'],
    lowConfidenceFields: ['value'],
    classification: { kind: 'range', band: 'above', critical: false },
  },
  {
    rawName: 'HDL Cholesterol',
    analyteId: 'hdl-cholesterol',
    value: '58',
    unit: 'mg/dL',
    refLow: 40,
    labFlags: [],
    lowConfidenceFields: [],
    classification: { kind: 'range', band: 'in', critical: false },
  },
  {
    rawName: 'Iron',
    value: '65',
    unit: 'mcg/dL',
    refLow: 50,
    refHigh: 170,
    labFlags: [],
    lowConfidenceFields: [],
    classification: { kind: 'not-covered' },
  },
];

const TEMPLATE_EXPLANATION: Pick<Explanation, 'overallText' | 'perTest' | 'sources'> = {
  overallText:
    'Most of your results are in the typical range. Your LDL cholesterol is a little above the typical range, which is common and often improves with changes to food and activity.',
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
  ],
  sources: [
    {
      analyteId: 'ldl-cholesterol',
      title: 'LDL: The Bad Cholesterol (MedlinePlus)',
      url: 'https://medlineplus.gov/ldlthebadcholesterol.html',
    },
  ],
};

export function ensureExtractedRows(reportId: string): void {
  if ((MOCK_ROWS[reportId] ?? []).length > 0) return;
  MOCK_ROWS[reportId] = TEMPLATE_ROWS.map((row, index) => ({
    ...row,
    id: `${reportId}-${index}`,
    reportId,
  }));
}

export function ensureDraftExplanation(reportId: string): void {
  if (MOCK_EXPLANATIONS[reportId] !== undefined) return;
  MOCK_EXPLANATIONS[reportId] = {
    id: `exp-${reportId}`,
    reportId,
    status: 'draft',
    approvedAt: undefined,
    ...TEMPLATE_EXPLANATION,
  };
}
