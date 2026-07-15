'use client';

import { useActionState } from 'react';
import { confirmDobAction, type DobState } from '@/app/r/[token]/actions';
import { CLINIC } from '@/lib/clinic';
import { Button } from '@/components/ui/button';
import { DobField, TextField } from '@/components/ui/field';

const initialState: DobState = {};

export function DobGate({ token, expiresAt }: { token: string; expiresAt: string }) {
  const [state, formAction, pending] = useActionState(confirmDobAction, initialState);
  const expiryLabel = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="rounded-[var(--radius-card)] border border-line bg-paper p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-soft text-sm font-semibold text-forest">
          {CLINIC.providerName.replace('Dr. ', '').slice(0, 2).toUpperCase()}
        </div>
        <h1 className="mt-5 font-display text-2xl leading-snug text-ink">
          {CLINIC.providerName} shared your lab results with you.
        </h1>
        <p className="mt-2 text-sm text-muted">
          To keep your health information private, confirm your last name and date of birth to open
          them.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <TextField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            placeholder="Your last name"
          />
          <DobField error={state.error} />
          <Button type="submit" className="mt-1 w-full" disabled={pending}>
            {pending ? 'Opening...' : 'View my results'}
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted">
          Your results are private: only someone with your last name and date of birth can open this
          link. It expires {expiryLabel}.
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Trouble opening this? Call {CLINIC.name} at {CLINIC.phone}.
      </p>
    </div>
  );
}
