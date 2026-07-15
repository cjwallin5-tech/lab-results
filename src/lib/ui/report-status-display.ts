import type { ReportStatus } from '@/lib/types';
import type { Tone } from './classification-display';

/** Provider-facing label and tone for a report's workflow status. */
export function reportStatusDisplay(status: ReportStatus): { label: string; tone: Tone } {
  switch (status) {
    case 'uploaded':
      return { label: 'Uploaded', tone: 'neutral' };
    case 'extracted':
      return { label: 'Ready to verify', tone: 'neutral' };
    case 'verified':
      return { label: 'Verified', tone: 'neutral' };
    case 'held':
      return { label: 'Held: critical result', tone: 'critical' };
    case 'drafted':
      return { label: 'Draft ready to review', tone: 'high' };
    case 'approved':
      return { label: 'Approved', tone: 'in' };
    case 'sent':
      return { label: 'Sent to patient', tone: 'in' };
  }
}

export const PROVIDER_STEPS = ['Upload', 'Verify', 'Review draft', 'Approve', 'Send'];

export function stepIndexForStatus(status: ReportStatus): number {
  switch (status) {
    case 'uploaded':
    case 'extracted':
      return 1;
    case 'verified':
    case 'held':
    case 'drafted':
      return 2;
    case 'approved':
      return 3;
    case 'sent':
      return 4;
  }
}
