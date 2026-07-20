import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Mock provider auth for developing the web page: one demo account, a signed
 * httpOnly cookie. This is a stand-in until the team wires Supabase auth; the
 * call sites (getSession / requireProvider) stay the same when that lands.
 */

const COOKIE_NAME = 'provider_session';
const PROVIDER_SUBJECT = 'demo-provider';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const SECRET = process.env.SESSION_SECRET ?? 'dev-only-insecure-session-secret-do-not-use-in-prod';
const DEMO_EMAIL = process.env.DEMO_PROVIDER_EMAIL ?? 'dr.anderson@demo.clinic';
const DEMO_PASSWORD = process.env.DEMO_PROVIDER_PASSWORD ?? 'demo-password-2026';

export interface ProviderSession {
  sub: string;
}

function equals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function verifyProviderCredentials(email: string, password: string): boolean {
  return (
    equals(email.trim().toLowerCase(), DEMO_EMAIL.toLowerCase()) && equals(password, DEMO_PASSWORD)
  );
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function encodeCookie(): string {
  const payload = Buffer.from(PROVIDER_SUBJECT).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decodeCookie(value: string): ProviderSession | null {
  const [payload, signature] = value.split('.');
  if (!payload || !signature || !equals(signature, sign(payload))) return null;
  return Buffer.from(payload, 'base64url').toString() === PROVIDER_SUBJECT
    ? { sub: PROVIDER_SUBJECT }
    : null;
}

export async function createProviderSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
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

export async function requireProvider(): Promise<ProviderSession> {
  const session = await getSession();
  if (session === null) redirect('/provider/sign-in');
  return session;
}
