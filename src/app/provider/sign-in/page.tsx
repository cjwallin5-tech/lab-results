"use client";

import { useActionState } from "react";
import { signInAction, type FormState } from "@/app/provider/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

const initialState: FormState = {};

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-[var(--radius-card)] border border-line bg-paper p-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest">
            Lab Result Explainer
          </p>
          <h1 className="mt-3 font-display text-2xl text-ink">Provider sign in</h1>
          <p className="mt-2 text-sm text-muted">
            One demo account in this version. All data is synthetic.
          </p>
        </div>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue="dr.anderson@demo.clinic"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            defaultValue="demo-password-2026"
          />
          {state.error && <p className="text-sm text-critical">{state.error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Demo credentials are pre-filled. This tool runs on synthetic data only.
      </p>
    </main>
  );
}
