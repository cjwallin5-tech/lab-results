'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Copies the patient's full share URL to the clipboard so the provider can hand
 * it over directly (text, their own email) without waiting on automated delivery.
 * The path is resolved against the current origin at click time.
 */
export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context); the link stays visible to copy by hand.
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={copy}>
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  );
}
