/**
 * Generate a DETERMINISTIC SUPR-ID fallback from the user's UUID.
 */
export function deriveSuprId(userId: string): string {
  const clean = userId.replace(/-/g, '');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  const num = (hash % 90000) + 10000;
  return `SUPR-${num.toString().padStart(5, '0')}`;
}

