import type { AnalyteEntry } from '@/lib/types';

/**
 * A small stand-in analyte dictionary so the web page can resolve display names
 * and MedlinePlus links while developing. The real, full dictionary is the Logic
 * track's (src/lib/analytes); replace this lookup with theirs when it lands.
 */
const ENTRIES: Pick<AnalyteEntry, 'id' | 'displayName' | 'medlineplusUrl'>[] = [
  {
    id: 'glucose',
    displayName: 'Fasting glucose',
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/blood-glucose-test/',
  },
  {
    id: 'total-cholesterol',
    displayName: 'Total cholesterol',
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/cholesterol-levels/',
  },
  {
    id: 'ldl-cholesterol',
    displayName: 'LDL cholesterol',
    medlineplusUrl: 'https://medlineplus.gov/ldlthebadcholesterol.html',
  },
  {
    id: 'hdl-cholesterol',
    displayName: 'HDL cholesterol',
    medlineplusUrl: 'https://medlineplus.gov/hdlthegoodcholesterol.html',
  },
  {
    id: 'triglycerides',
    displayName: 'Triglycerides',
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/triglycerides-test/',
  },
  {
    id: 'hemoglobin',
    displayName: 'Hemoglobin',
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/hemoglobin-test/',
  },
  {
    id: 'potassium',
    displayName: 'Potassium',
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/potassium-blood-test/',
  },
  {
    id: 'sodium',
    displayName: 'Sodium',
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/sodium-blood-test/',
  },
  {
    id: 'creatinine',
    displayName: 'Creatinine',
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/creatinine-test/',
  },
  {
    id: 'tsh',
    displayName: 'TSH',
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/',
  },
  {
    id: 'vitamin-d',
    displayName: 'Vitamin D, 25-hydroxy',
    medlineplusUrl: 'https://medlineplus.gov/lab-tests/vitamin-d-test/',
  },
];

const BY_ID = new Map(ENTRIES.map((entry) => [entry.id, entry]));

export function analyteDisplayName(analyteId: string | undefined, fallback: string): string {
  if (analyteId === undefined) return fallback;
  return BY_ID.get(analyteId)?.displayName ?? fallback;
}

export function analyteMedlineplusUrl(analyteId: string | undefined): string | undefined {
  if (analyteId === undefined) return undefined;
  return BY_ID.get(analyteId)?.medlineplusUrl;
}
