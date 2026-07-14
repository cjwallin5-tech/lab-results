"use client";

import { useActionState, useState } from "react";
import { askQuestionAction, type AskState } from "@/app/r/[token]/actions";
import { CLINIC } from "@/lib/clinic";
import { Button } from "@/components/ui/button";

const initialState: AskState = {};

const COMMON_QUESTIONS = [
  "What should I change in my diet?",
  "Do I need medication?",
  "When should I re-test?",
];

export function AskForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(askQuestionAction, initialState);
  const [question, setQuestion] = useState("");

  if (state.sent) {
    return (
      <div className="rounded-[var(--radius-card)] border border-forest/20 bg-forest-soft/40 p-6">
        <h2 className="font-display text-xl text-ink">Your question was sent</h2>
        <p className="mt-2 text-sm text-muted">
          {CLINIC.providerName} usually replies within one business day.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
      <input type="hidden" name="token" value={token} />

      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Start from a common question
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {COMMON_QUESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setQuestion(prompt)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink transition-colors hover:border-forest/40"
          >
            {prompt}
          </button>
        ))}
      </div>

      <textarea
        name="question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={5}
        placeholder="Write your question here. Plain language is perfect. Include anything you have noticed, like changes in energy or diet."
        className="mt-4 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
      />

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-critical">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-muted">
          For urgent concerns, call the clinic. Do not wait for a reply here.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send question"}
        </Button>
      </div>
    </form>
  );
}
