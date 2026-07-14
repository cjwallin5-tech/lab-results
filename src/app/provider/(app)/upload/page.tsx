import { availablePdfRefs } from "@/lib/llm/offline";
import { UploadForm } from "@/components/provider/upload-form";

const REPORT_LABELS: Record<string, string> = {
  "alvarez-lipid-cbc": "Lipid panel and CBC (sample report)",
  "chen-metabolic-liver": "Metabolic and liver panel (sample report)",
  "okoro-thyroid-vitd": "Thyroid and vitamin D (sample report)",
  "reyes-annual-cmp": "Routine annual panel, all in range (sample report)",
  "petrov-critical-panel": "Panel with multiple critical results (sample report)",
};

export default function UploadPage() {
  const reports = availablePdfRefs().map((value) => ({
    value,
    label: REPORT_LABELS[value] ?? value,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Upload a report</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the patient details and choose a report. The system will read the results for you to
        verify.
      </p>
      <UploadForm reports={reports} />
    </div>
  );
}
