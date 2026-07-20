import { UploadForm } from '@/components/provider/upload-form';

export default function UploadPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">New report</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the patient details to start a report. The system reads the results on the next
        screen, and you verify them before anything is classified.
      </p>
      <UploadForm />
    </div>
  );
}
