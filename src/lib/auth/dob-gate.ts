import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Per-token proof that the patient confirmed their date of birth. The cookie is
 * httpOnly and its value is an HMAC of the token, so it cannot be forged without
 * the server secret. The date of birth itself is never stored in the cookie or
 * logged anywhere.
 */

const SECRET =
  process.env.SESSION_SECRET ?? "dev-only-insecure-session-secret-do-not-use-in-prod";
const TTL_SECONDS = 60 * 30;

function cookieName(token: string): string {
  return `dob_${token}`;
}

function sign(token: string): string {
  return createHmac("sha256", SECRET).update(token).digest("base64url");
}

export async function setDobConfirmed(token: string): Promise<void> {
  const store = await cookies();
  store.set(cookieName(token), sign(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function isDobConfirmed(token: string): Promise<boolean> {
  const store = await cookies();
  const cookie = store.get(cookieName(token));
  if (cookie === undefined) return false;
  const expected = sign(token);
  const a = Buffer.from(cookie.value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
