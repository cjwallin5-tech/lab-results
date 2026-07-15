/**
 * The education-only disclaimer. Rendered by the shared patient layout so no
 * patient view can omit it (FR-12).
 */
export function Disclaimer() {
  return (
    <p className="text-xs leading-relaxed text-muted">
      This page explains your results in plain language. It is not medical advice and it does not
      replace your provider, who knows your full picture. Typical ranges vary slightly between labs.
    </p>
  );
}
