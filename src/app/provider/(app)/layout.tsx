import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireProvider } from '@/lib/auth/session';
import { signOutAction } from '@/app/provider/actions';

/** Gates every authenticated provider page and provides the app chrome. */
export default async function ProviderAppLayout({ children }: { children: ReactNode }) {
  await requireProvider();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#provider-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded focus:bg-forest focus:px-4 focus:py-2 focus:text-cream"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/provider" className="flex items-baseline gap-2">
            <span className="font-display text-lg text-ink">Lab Result Explainer</span>
            <span className="text-xs text-muted">Provider workspace</span>
          </Link>
          <form action={signOutAction}>
            <button
              className="text-sm text-muted transition-colors hover:text-forest"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main id="provider-main" className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
