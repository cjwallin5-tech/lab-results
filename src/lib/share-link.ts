/** Whether a share link's expiry timestamp is in the past. */
export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}
