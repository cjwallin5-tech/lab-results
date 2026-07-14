/**
 * Assert a required environment variable is set, or fail loudly — never limp along
 * without config. Callers pass the value from a static `process.env.NAME` access:
 * Next.js only inlines NEXT_PUBLIC_* vars into the browser bundle on static access,
 * so a dynamic `process.env[name]` lookup here would always be undefined client-side.
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name} — copy .env.example to .env.local and fill in the values.`,
    );
  }
  return value;
}
