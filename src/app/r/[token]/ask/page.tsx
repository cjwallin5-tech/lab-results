import Link from "next/link";
import { redirect } from "next/navigation";
import { isDobConfirmed } from "@/lib/auth/dob-gate";
import { CLINIC } from "@/lib/clinic";
import { AskForm } from "@/components/patient/ask-form";

export default async function AskPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // The ask page is behind the same date-of-birth gate as the results.
  if (!(await isDobConfirmed(token))) {
    redirect(`/r/${token}`);
  }

  return (
    <div>
      <Link href={`/r/${token}`} className="text-sm text-forest hover:underline">
        Back to your results
      </Link>
      <h1 className="mt-4 font-display text-3xl text-ink">
        Ask {CLINIC.providerName} a question
      </h1>
      <p className="mt-1 text-sm text-muted">
        Your question goes to the clinic. {CLINIC.providerName} usually replies within one business
        day.
      </p>
      <div className="mt-6">
        <AskForm token={token} />
      </div>
    </div>
  );
}
