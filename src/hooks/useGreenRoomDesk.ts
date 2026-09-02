import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PAGE_SIZE, isFullPage, mergeById, patchRealtimeList } from '../lib/paging';
import { errorMessage } from '../lib/errors';
import type { GreenRoomMessage } from './useGreenRoomMessages';

export interface FloorRestriction {
  user_id: string;
  kind: 'restricted' | 'blocked';
  reason: string | null;
  set_by: string | null;
  created_at: string;
  profile?: { full_name: string | null; st_id: string | null } | null;
}

const MESSAGE_SELECT = `
  id, author_id, body, reel_film_id, external_link, external_link_title, external_link_image, reply_to_id, created_at, edited_at,
  author:profiles!author_id (id, full_name, avatar_url, role, roles, st_id)
`;

function rpcMissing(error: { message?: string } | null) {
  return !!error?.message && /could not find the function|schema cache/i.test(error.message);
}

function weekAgoIso() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function unwrapProfile(value: unknown): FloorRestriction['profile'] {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== 'object') return null;
  const rec = row as { full_name?: string | null; st_id?: string | null };
  return { full_name: rec.full_name ?? null, st_id: rec.st_id ?? null };
}

function normalizeRestriction(row: Record<string, unknown>): FloorRestriction {
  const kind = row.kind === 'blocked' ? 'blocked' : 'restricted';
  return {
    user_id: String(row.user_id),
    kind,
    reason: (row.reason as string | null) ?? null,
    set_by: (row.set_by as string | null) ?? null,
    created_at: String(row.created_at),
    profile: unwrapProfile(row.profile),
  };
}

function normalize(raw: Record<string, unknown>): GreenRoomMessage {
  const authorRaw = raw.author;
  const author = (Array.isArray(authorRaw) ? authorRaw[0] : authorRaw) as GreenRoomMessage['author'] | null;
  return {
    id: String(raw.id),
    author_id: String(raw.author_id),
    body: (raw.body as string) || null,
    reel_film_id: (raw.reel_film_id as string) || null,
    external_link: (raw.external_link as string) || null,
    external_link_title: (raw.external_link_title as string) || null,
    external_link_image: (raw.external_link_image as string) || null,
    reply_to_id: (raw.reply_to_id as string) || null,
    created_at: String(raw.created_at),
    edited_at: (raw.edited_at as string) || null,
    author: author || null,
    film: null,
    reply_to: null,
  };
}

export function useGreenRoomDesk() {
  const [messages, setMessages] = useState<GreenRoomMessage[]>([]);
  const [restrictions, setRestrictions] = useState<FloorRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState('');
  const [loadError, setLoadError] = useState('');

  const fetchMessages = useCallback(async (append = false) => {
    const from = append ? messages.length : 0;
    const { data, error } = await supabase
      .from('green_room_messages')
      .select(MESSAGE_SELECT)
      .gte('created_at', weekAgoIso())
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = ((data as Record<string, unknown>[]) || []).map(normalize);
    setMessages(prev => append ? mergeById(prev, rows) : rows);
    setHasMore(isFullPage(data));
  }, [messages.length]);

  const fetchRestrictions = useCallback(async () => {
    const query = supabase
      .from('green_room_restrictions')
      .select('user_id, kind, reason, set_by, created_at, profile:profiles!green_room_restrictions_user_id_fkey(full_name, st_id)')
      .order('created_at', { ascending: false });
    let { data, error } = await query;
    if (error) {
      const fallback = await supabase
        .from('green_room_restrictions')
        .select('user_id, kind, reason, set_by, created_at')
        .order('created_at', { ascending: false });
      if (fallback.error) throw fallback.error;
      data = fallback.data as typeof data;
    }
    setRestrictions(((data || []) as unknown as Record<string, unknown>[]).map(normalizeRestriction));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await fetchMessages(false);
        if (alive) setLoadError('');
      } catch (err) {
        console.error('Floor desk messages', err);
        if (alive) setLoadError(errorMessage(err));
      }
      try {
        await fetchRestrictions();
      } catch (err) {
        console.warn('Floor desk restrictions', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('green-room-desk')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'green_room_messages' }, (payload) => {
        const eventType = payload.eventType;
        if (eventType === 'DELETE') {
          setMessages(prev => patchRealtimeList(prev, eventType, null, (payload.old as any)?.id));
          return;
        }
        const id = (payload.new as any)?.id;
        if (!id) return;
        const created = (payload.new as any)?.created_at;
        if (created && String(created) < weekAgoIso()) return;
        void supabase.from('green_room_messages').select(MESSAGE_SELECT).eq('id', id).maybeSingle().then(({ data }) => {
          if (data) setMessages(prev => patchRealtimeList(prev, eventType, normalize(data as Record<string, unknown>), id));
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'green_room_restrictions' }, () => {
        void fetchRestrictions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRestrictions]);

  const deleteMessage = async (id: string) => {
    const { data, error } = await supabase.rpc('admin_delete_green_room_message', { target: id });
    if (error && !rpcMissing(error)) throw new Error(errorMessage(error));
    const removed = typeof data === 'number' ? data : 0;
    if (!error && removed > 0) {
      setMessages(prev => prev.filter(m => m.id !== id));
      return;
    }
    const fallback = await supabase.from('green_room_messages').delete().eq('id', id).select('id');
    if (fallback.error) throw new Error(errorMessage(fallback.error));
    if (!fallback.data?.length) throw new Error('That line is still on the floor. Run the Floor Desk SQL, then try again.');
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const strikeAuthor = async (authorId: string) => {
    const { data, error } = await supabase.rpc('admin_strike_green_room_author', { target: authorId });
    if (error && !rpcMissing(error)) throw new Error(errorMessage(error));
    const removed = typeof data === 'number' ? data : 0;
    if (!error && removed > 0) {
      setMessages(prev => prev.filter(m => m.author_id !== authorId));
      return;
    }
    const fallback = await supabase.from('green_room_messages').delete().eq('author_id', authorId).select('id');
    if (fallback.error) throw new Error(errorMessage(fallback.error));
    if (!fallback.data?.length) throw new Error('Those lines are still on the floor. Run the Floor Desk SQL, then try again.');
    const gone = new Set(fallback.data.map((row) => String(row.id)));
    setMessages(prev => prev.filter(m => !gone.has(m.id)));
  };

  const setRestriction = async (userId: string, kind: 'restricted' | 'blocked', setBy: string) => {
    const { error } = await supabase.rpc('admin_set_floor_restriction', { target: userId, next_kind: kind });
    if (error && !rpcMissing(error)) throw new Error(errorMessage(error));
    if (error) {
      const fallback = await supabase.from('green_room_restrictions').upsert({
        user_id: userId,
        kind,
        set_by: setBy,
      });
      if (fallback.error) throw new Error(errorMessage(fallback.error));
    }
    await fetchRestrictions();
  };

  const liftRestriction = async (userId: string) => {
    const { error } = await supabase.rpc('admin_lift_floor_restriction', { target: userId });
    if (error && !rpcMissing(error)) throw new Error(errorMessage(error));
    if (error) {
      const fallback = await supabase.from('green_room_restrictions').delete().eq('user_id', userId);
      if (fallback.error) throw new Error(errorMessage(fallback.error));
    }
    setRestrictions(prev => prev.filter(r => r.user_id !== userId));
  };

  const filtered = messages.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = m.author?.full_name?.toLowerCase() || '';
    const st = (m.author?.st_id || '').toLowerCase();
    const body = (m.body || '').toLowerCase();
    return name.includes(q) || st.includes(q) || body.includes(q);
  });

  return {
    messages: filtered,
    restrictions,
    loading,
    loadError,
    hasMore,
    query,
    setQuery,
    loadMore: () => fetchMessages(true),
    deleteMessage,
    strikeAuthor,
    setRestriction,
    liftRestriction,
  };
}
