export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    if (/non-2xx status code/i.test(err.message)) return 'Could not fetch that link';
    return err.message;
  }
  if (err && typeof err === 'object') {
    const rec = err as { message?: unknown; error?: { message?: unknown } | string; details?: unknown; hint?: unknown };
    if (typeof rec.error === 'string' && rec.error) return rec.error;
    if (typeof rec.message === 'string' && rec.message) {
      if (/non-2xx status code/i.test(rec.message)) return 'Could not fetch that link';
      return rec.message;
    }
    if (typeof rec.error === 'object' && rec.error && typeof rec.error.message === 'string' && rec.error.message) {
      return rec.error.message;
    }
    if (typeof rec.details === 'string' && rec.details) return rec.details;
    try {
      const json = JSON.stringify(err);
      if (json && json !== '{}') return json;
    } catch {
      /* fall through */
    }
  }
  const text = String(err);
  return text && text !== '[object Object]' ? text : 'Something went wrong';
}

export function displayText(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return errorMessage(value) || fallback;
}
