'use client';

import { useActionState } from 'react';
import { uploadReportAction, type FormState } from '@/app/provider/actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';

const initialState: FormState = {};

export function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadReportAction, initialState);

  return (
    <form action={formAction} className="mt-8 flex max-w-xl flex-col gap-4">
      <TextField label="Patient name" name="name" placeholder="Maria Alvarez" defaultValue="" />
      <TextField
        label="Patient email"
        name="email"
        type="email"
        placeholder="patient@example.test"
        defaultValue=""
      />
      <TextField label="Patient date of birth" name="dob" type="date" defaultValue="" />

      <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-paper/60 px-4 py-6 text-center text-sm text-muted">
        PDF upload arrives with Supabase Storage. For now the report starts here and its results are
        read on the next screen.
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-critical">
          {state.error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating...' : 'Create report'}
        </Button>
      </div>
    </form>
  );
}
