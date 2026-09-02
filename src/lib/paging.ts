export const PAGE_SIZE = 50;

export function pageRange(loadedCount: number): [number, number] {
  return [loadedCount, loadedCount + PAGE_SIZE - 1];
}

export function isFullPage<T>(rows: T[] | null | undefined): boolean {
  return (rows?.length ?? 0) >= PAGE_SIZE;
}

export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  if (!incoming.length) return existing;
  const seen = new Set(existing.map((row) => row.id));
  const extra = incoming.filter((row) => !seen.has(row.id));
  return extra.length ? [...existing, ...extra] : existing;
}

export function patchRealtimeList<T extends { id: string }>(
  list: T[],
  eventType: string | undefined,
  next: T | null | undefined,
  oldId?: string | null,
): T[] {
  const type = (eventType || '').toUpperCase();
  if (type === 'INSERT' && next?.id) {
    if (list.some((row) => row.id === next.id)) {
      return list.map((row) => (row.id === next.id ? { ...row, ...next } : row));
    }
    return [next, ...list];
  }
  if (type === 'UPDATE' && next?.id) {
    let found = false;
    const mapped = list.map((row) => {
      if (row.id !== next.id) return row;
      found = true;
      return { ...row, ...next };
    });
    return found ? mapped : [next, ...list];
  }
  if (type === 'DELETE') {
    const id = oldId || next?.id;
    if (!id) return list;
    return list.filter((row) => row.id !== id);
  }
  return list;
}
