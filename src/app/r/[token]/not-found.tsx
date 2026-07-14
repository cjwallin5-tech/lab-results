import { CLINIC } from "@/lib/clinic";

export default function PatientNotFound() {
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <h1 className="font-display text-2xl text-ink">This link is not available</h1>
      <p className="mt-2 text-sm text-muted">
        The link may be incomplete or no longer active. Call {CLINIC.name} at {CLINIC.phone} and
        they can help.
      </p>
    </div>
  );
}
