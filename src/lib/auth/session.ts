import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Demo provider auth: one account, a signed httpOnly cookie. This is the auth
 * seam. Swapping to Supabase auth for the real pilot changes only this file;
 * call sites use getSession / requireProvider and never see the mechanism.
 *
 * The single demo credential and signing secret come from the environment, with
 * dev fallbacks so the app runs on localhost with no configuration. Set real
 * values before any non-synthetic use.
 */

const COOKIE_NAME = "provider_session";
const PROVIDER_SUBJECT = "demo-provider";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "dev-only-insecure-session-secret-do-not-use-in-prod";
const DEMO_EMAIL = process.env.DEMO_PROVIDER_EMAIL ?? "dr.anderson@demo.clinic";
const DEMO_PASSWORD = process.env.DEMO_PROVIDER_PASSWORD ?? "demo-password-2026";

export interface ProviderSession {
  sub: string;
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function equals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Verify the single demo credential. Constant-time on both fields. */
export function verifyProviderCredentials(email: string, password: string): boolean {
  const emailOk = equals(email.trim().toLowerCase(), DEMO_EMAIL.toLowerCase());
  const passwordOk = equals(password, DEMO_PASSWORD);
  return emailOk && passwordOk;
}

function encodeCookie(): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: PROVIDER_SUBJECT, iat: Date.now() }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeCookie(value: string): ProviderSession | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !equals(signature, sign(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    return parsed?.sub === PROVIDER_SUBJECT ? { sub: PROVIDER_SUBJECT } : null;
  } catch {
    return null;
  }
}

/** Start a provider session. Call only from a Server Action or Route Handler. */
export async function createProviderSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyProviderSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<ProviderSession | null> {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME);
  return cookie ? decodeCookie(cookie.value) : null;
}

/** Redirects to sign-in when there is no valid session. */
export async function requireProvider(): Promise<ProviderSession> {
  const session = await getSession();
  if (session === null) redirect("/provider/sign-in");
  return session;
}
