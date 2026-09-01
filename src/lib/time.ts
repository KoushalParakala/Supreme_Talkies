export function startOfLocalDay(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const ms = Date.now() - then;
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'NOW';
  if (m < 60) return `${m}M`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H`;
  return `${Math.floor(h / 24)}D`;
}
