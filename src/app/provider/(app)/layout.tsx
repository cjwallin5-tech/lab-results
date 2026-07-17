import Link from "next/link";
import type { ReactNode } from "react";
import { requireProvider } from "@/lib/auth/session";
import { signOutAction } from "@/app/provider/actions";

/** Gates every authenticated provider page and provides the app chrome. */
export default async function ProviderAppLayout({ children }: { children: ReactNode }) {
  await requireProvider();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-paper">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/provider" className="flex items-baseline gap-2">
            <span className="font-display text-lg text-ink">Lab Result Explainer</span>
            <span className="hidden text-xs text-muted sm:inline">Provider workspace</span>
          </Link>
          <form action={signOutAction}>
            <button
              className="shrink-0 whitespace-nowrap text-sm text-muted transition-colors hover:text-forest"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</div>
    </div>
  );
}
