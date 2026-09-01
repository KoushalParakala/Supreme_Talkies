import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type ReactionKind = 'hype' | 'loved' | 'clap';

export interface GreenRoomAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  roles: string[] | null;
}

export interface GreenRoomFilm {
  id: string;
  title: string;
  poster_image: string | null;
  reel_image: string | null;
  stills: string[] | null;
  duration: string | null;
  director: string | null;
  rating: string | null;
  coming_soon: boolean | null;
}

export interface GreenRoomReply {
  id: string;
  body: string | null;
  author_id: string;
  external_link_title: string | null;
}

export interface GreenRoomMessage {
  id: string;
  author_id: string;
  body: string | null;
  reel_film_id: string | null;
  external_link: string | null;
  external_link_title: string | null;
  external_link_image: string | null;
  reply_to_id: string | null;
  created_at: string;
  edited_at: string | null;
  author?: GreenRoomAuthor | null;
  film?: GreenRoomFilm | null;
  reply_to?: GreenRoomReply | null;
}

export interface ReactionBucket {
  count: number;
  mine: boolean;
}

export type ReactionMap = Record<string, Record<ReactionKind, ReactionBucket>>;

const MESSAGE_SELECT = `
  id, author_id, body, reel_film_id, external_link, external_link_title, external_link_image, reply_to_id, created_at, edited_at,
  author:profiles!author_id (id, full_name, avatar_url, role, roles),
  film:films!reel_film_id (id, title, poster_image, reel_image, stills, duration, director, rating, coming_soon),
  reply_to:green_room_messages!reply_to_id (id, body, author_id, external_link_title)
`;

const EMPTY_BUCKET: Record<ReactionKind, ReactionBucket> = {
  hype: { count: 0, mine: false },
  loved: { count: 0, mine: false },
  clap: { count: 0, mine: false },
};

function emptyBuckets(): Record<ReactionKind, ReactionBucket> {
  return {
    hype: { count: 0, mine: false },
    loved: { count: 0, mine: false },
    clap: { count: 0, mine: false },
  };
}

function unwrap<T>(value: unknown): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  if (typeof value === 'object') return value as T;
  return null;
}

function normalizeMessage(raw: Record<string, unknown>): GreenRoomMessage {
  return {
    id: String(raw.id),
    author_id: String(raw.author_id),
    body: (raw.body as string | null) ?? null,
    reel_film_id: (raw.reel_film_id as string | null) ?? null,
    external_link: (raw.external_link as string | null) ?? null,
    external_link_title: (raw.external_link_title as string | null) ?? null,
    external_link_image: (raw.external_link_image as string | null) ?? null,
    reply_to_id: (raw.reply_to_id as string | null) ?? null,
    created_at: String(raw.created_at),
    edited_at: (raw.edited_at as string | null) ?? null,
    author: unwrap<GreenRoomAuthor>(raw.author),
    film: unwrap<GreenRoomFilm>(raw.film),
    reply_to: unwrap<GreenRoomReply>(raw.reply_to),
  };
}

async function hydrateMessage(row: GreenRoomMessage): Promise<GreenRoomMessage> {
  const next = { ...row };
  if (!next.author) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, roles')
      .eq('id', row.author_id)
      .maybeSingle();
    next.author = (data as GreenRoomAuthor | null) ?? null;
  }
  if (row.reel_film_id && !next.film) {
    const { data } = await supabase
      .from('films')
      .select('id, title, poster_image, reel_image, stills, duration, director, rating, coming_soon')
      .eq('id', row.reel_film_id)
      .maybeSingle();
    next.film = (data as GreenRoomFilm | null) ?? null;
  }
  if (row.reply_to_id && !next.reply_to) {
    const { data } = await supabase
      .from('green_room_messages')
      .select('id, body, author_id, external_link_title')
      .eq('id', row.reply_to_id)
      .maybeSingle();
    next.reply_to = (data as GreenRoomReply | null) ?? null;
  }
  return next;
}

export interface SendGreenRoomInput {
  body?: string;
  reelFilmId?: string | null;
  externalLink?: string | null;
  externalLinkTitle?: string | null;
  externalLinkImage?: string | null;
  replyToId?: string | null;
}

export function useGreenRoomMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GreenRoomMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionMap>({});
  const [loading, setLoading] = useState(false);

  const upsertMessage = useCallback((incoming: GreenRoomMessage) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === incoming.id);
      if (idx === -1) {
        return [...prev, incoming].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      }
      const next = [...prev];
      next[idx] = { ...next[idx], ...incoming };
      return next;
    });
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setReactions((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const loadReactions = useCallback(async (ids: string[], uid?: string) => {
    if (ids.length === 0) {
      setReactions({});
      return;
    }
    const { data, error } = await supabase
      .from('green_room_reactions')
      .select('message_id, user_id, kind')
      .in('message_id', ids);
    if (error) {
      console.warn('[useGreenRoomMessages] reactions failed:', error);
      return;
    }
    const next: ReactionMap = {};
    for (const row of data || []) {
      const mid = row.message_id as string;
      const kind = row.kind as ReactionKind;
      if (!next[mid]) next[mid] = emptyBuckets();
      next[mid][kind].count += 1;
      if (uid && row.user_id === uid) next[mid][kind].mine = true;
    }
    setReactions(next);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setReactions({});
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('green_room_messages')
        .select(MESSAGE_SELECT)
        .order('created_at', { ascending: false })
        .limit(80);
      let rows: GreenRoomMessage[] = [];
      if (error) {
        console.warn('[useGreenRoomMessages] nested select failed, retrying:', error);
        const fallback = await supabase
          .from('green_room_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(80);
        if (fallback.error) throw fallback.error;
        rows = await Promise.all(
          ((fallback.data as Record<string, unknown>[]) || []).map((raw) =>
            hydrateMessage(normalizeMessage(raw)),
          ),
        );
        rows.reverse();
      } else {
        rows = ((data as Record<string, unknown>[]) || []).map(normalizeMessage).reverse();
      }
      setMessages(rows);
      await loadReactions(rows.map((m) => m.id), user.id);
    } catch (err) {
      console.warn('[useGreenRoomMessages] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadReactions]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('green-room-floor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'green_room_messages' },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          void hydrateMessage(normalizeMessage(raw)).then(upsertMessage);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'green_room_messages' },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          void hydrateMessage(normalizeMessage(raw)).then(upsertMessage);
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'green_room_messages' },
        (payload) => {
          const id = (payload.old as { id?: string } | null)?.id;
          if (id) removeMessage(id);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'green_room_reactions' },
        (payload) => {
          const row = payload.new as { message_id: string; user_id: string; kind: ReactionKind };
          if (row.user_id === user.id) return;
          setReactions((prev) => {
            const current = prev[row.message_id] ? { ...prev[row.message_id] } : emptyBuckets();
            const bucket = { ...current[row.kind] };
            bucket.count += 1;
            return { ...prev, [row.message_id]: { ...current, [row.kind]: bucket } };
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'green_room_reactions' },
        (payload) => {
          const row = payload.old as { message_id: string; user_id: string; kind: ReactionKind };
          if (!row?.message_id || !row.kind) return;
          if (row.user_id === user.id) return;
          setReactions((prev) => {
            const current = prev[row.message_id];
            if (!current) return prev;
            const bucket = { ...current[row.kind] };
            bucket.count = Math.max(0, bucket.count - 1);
            return { ...prev, [row.message_id]: { ...current, [row.kind]: bucket } };
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, upsertMessage, removeMessage]);

  const sendMessage = useCallback(
    async (input: SendGreenRoomInput) => {
      if (!user) return { error: 'Not signed in' };
      const body = input.body?.trim() || null;
      const payload = {
        author_id: user.id,
        body,
        reel_film_id: input.reelFilmId || null,
        external_link: input.externalLink || null,
        external_link_title: input.externalLinkTitle || null,
        external_link_image: input.externalLinkImage || null,
        reply_to_id: input.replyToId || null,
      };
      if (!payload.body && !payload.reel_film_id && !payload.external_link) {
        return { error: 'Write a line or pin a reel' };
      }
      const { data, error } = await supabase
        .from('green_room_messages')
        .insert(payload)
        .select(MESSAGE_SELECT)
        .single();
      if (error) return { error: error.message };
      if (data) upsertMessage(normalizeMessage(data as Record<string, unknown>));
      return { error: null };
    },
    [user?.id, upsertMessage],
  );

  const editMessage = useCallback(
    async (id: string, body: string) => {
      if (!user) return { error: 'Not signed in' };
      const nextBody = body.trim();
      const current = messages.find((m) => m.id === id);
      if (!nextBody && !current?.reel_film_id && !current?.external_link) {
        return { error: 'Write a line or pin a reel' };
      }
      const { data, error } = await supabase
        .from('green_room_messages')
        .update({ body: nextBody || null })
        .eq('id', id)
        .eq('author_id', user.id)
        .select(MESSAGE_SELECT)
        .single();
      if (error) return { error: error.message };
      if (data) upsertMessage(normalizeMessage(data as Record<string, unknown>));
      return { error: null };
    },
    [user?.id, messages, upsertMessage],
  );

  const deleteMessage = useCallback(
    async (id: string) => {
      if (!user) return { error: 'Not signed in' };
      const { error } = await supabase
        .from('green_room_messages')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id);
      if (error) return { error: error.message };
      removeMessage(id);
      return { error: null };
    },
    [user?.id, removeMessage],
  );

  const toggleReaction = useCallback(
    async (messageId: string, kind: ReactionKind) => {
      if (!user) return;
      const mine = reactions[messageId]?.[kind]?.mine;
      setReactions((prev) => {
        const current = prev[messageId] ? { ...prev[messageId] } : emptyBuckets();
        const bucket = { ...current[kind] };
        if (mine) {
          bucket.mine = false;
          bucket.count = Math.max(0, bucket.count - 1);
        } else {
          bucket.mine = true;
          bucket.count += 1;
        }
        return { ...prev, [messageId]: { ...current, [kind]: bucket } };
      });
      if (mine) {
        const { error } = await supabase
          .from('green_room_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('kind', kind);
        if (error) {
          console.warn('[useGreenRoomMessages] unreact failed:', error);
          setReactions((prev) => {
            const current = prev[messageId] ? { ...prev[messageId] } : emptyBuckets();
            const bucket = { ...current[kind] };
            bucket.mine = true;
            bucket.count += 1;
            return { ...prev, [messageId]: { ...current, [kind]: bucket } };
          });
        }
      } else {
        const { error } = await supabase.from('green_room_reactions').insert({
          message_id: messageId,
          user_id: user.id,
          kind,
        });
        if (error) {
          console.warn('[useGreenRoomMessages] react failed:', error);
          setReactions((prev) => {
            const current = prev[messageId] ? { ...prev[messageId] } : emptyBuckets();
            const bucket = { ...current[kind] };
            bucket.mine = false;
            bucket.count = Math.max(0, bucket.count - 1);
            return { ...prev, [messageId]: { ...current, [kind]: bucket } };
          });
        }
      }
    },
    [user?.id, reactions],
  );

  const byId = useMemo(() => {
    const map = new Map<string, GreenRoomMessage>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  return {
    messages,
    reactions,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    byId,
    emptyBuckets: EMPTY_BUCKET,
  };
}
