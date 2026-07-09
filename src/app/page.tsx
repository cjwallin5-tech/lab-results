export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold">Lab Result Explainer</h1>
      <p className="text-lg">
        Type in your blood-test results and read plain-language, human-reviewed
        explanations of what each one means. Nothing you enter is stored or
        sent anywhere.
      </p>
      <p className="text-sm opacity-70">
        Educational information only, not medical advice. The tool is under
        construction; the entry form and explanations arrive with v1 (see
        ROADMAP.md, Phase 1).
      </p>
    </main>
  );
}
