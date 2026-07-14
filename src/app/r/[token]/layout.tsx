import type { ReactNode } from "react";
import { CLINIC } from "@/lib/clinic";
import { Disclaimer } from "@/components/ui/disclaimer";

/**
 * Shared chrome for every patient view. The disclaimer lives here so no patient
 * page can render without it (FR-12).
 */
export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 text-sm">
          <span className="font-medium text-ink">
            {CLINIC.name} <span className="text-muted">· Lab results</span>
          </span>
          <span className="text-muted">Shared by {CLINIC.providerName}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Disclaimer />
        </div>
      </footer>
    </div>
  );
}
