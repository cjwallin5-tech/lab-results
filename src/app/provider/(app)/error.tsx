"use client";

import { Button } from "@/components/ui/button";

export default function ProviderError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-paper px-6 py-14 text-center">
      <h1 className="font-display text-2xl text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        This report could not be loaded. Try again, or go back to your reports.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
