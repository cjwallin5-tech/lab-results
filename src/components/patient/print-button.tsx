"use client";

/** Opens the browser print dialog so the patient can save or print a PDF. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-forest transition-colors hover:bg-forest-soft"
    >
      Download PDF
    </button>
  );
}
