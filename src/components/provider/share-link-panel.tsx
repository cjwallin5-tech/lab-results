"use client";

import { useState } from "react";
import { resendLinkAction } from "@/app/provider/actions";
import { SubmitButton } from "@/components/ui/submit-button";

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function ShareLinkPanel({
  reportId,
  path,
  expiresAt,
  openedAt,
}: {
  reportId: string;
  path: string;
  expiresAt: string;
  openedAt: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1.5 font-mono text-xs text-forest">
          {path}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest-soft"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <p className="text-xs text-muted">
        {openedAt !== null ? (
          <span className="text-forest">Opened by the patient</span>
        ) : (
          "Not opened yet"
        )}
        {" · "}
        Expires in {daysUntil(expiresAt)} days
      </p>

      <form action={resendLinkAction}>
        <input type="hidden" name="reportId" value={reportId} />
        <SubmitButton size="sm" variant="secondary" pendingLabel="Resending...">
          Resend to patient
        </SubmitButton>
      </form>
    </div>
  );
}
