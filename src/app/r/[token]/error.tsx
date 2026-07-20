'use client';

import { CLINIC } from '@/lib/clinic';

export default function PatientError() {
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <h1 className="font-display text-2xl text-ink">We could not open this page</h1>
      <p className="mt-2 text-sm text-muted">
        Please try the link again. If it still does not open, call {CLINIC.name} at {CLINIC.phone}{' '}
        and they can help.
      </p>
    </div>
  );
}
