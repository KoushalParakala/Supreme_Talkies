import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const SESSION_KEY = 'st_call_sheet_session_at';

function sessionStartedAt(): string {
  if (typeof sessionStorage === 'undefined') return new Date().toISOString();
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const stamp = new Date().toISOString();
  sessionStorage.setItem(SESSION_KEY, stamp);
  return stamp;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      setItems((data as AppNotification[]) || []);
    } catch (err) {
      console.warn('[useNotifications] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as AppNotification;
          setItems((prev) => [row, ...prev].slice(0, 40));
          toast(row.title, {
            icon: '✦',
            style: {
              background: 'rgba(30,32,41,0.95)',
              color: '#F0EBE0',
              border: '1px solid #BCA88E',
              fontFamily: 'Inter, monospace',
              fontSize: 12,
            },
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markRead = useCallback(
    async (ids?: string[]) => {
      if (!user) return;
      try {
        const { error } = await supabase.rpc('mark_notifications_read', {
          p_ids: ids ?? null,
        });
        if (error) throw error;
        setItems((prev) =>
          prev.map((n) =>
            !ids || ids.includes(n.id) ? { ...n, read_at: n.read_at || new Date().toISOString() } : n
          )
        );
      } catch (err) {
        console.warn('[useNotifications] markRead failed:', err);
      }
    },
    [user?.id]
  );

  const sessionStart = useMemo(() => sessionStartedAt(), [user?.id]);

  const { offlineItems, liveItems } = useMemo(() => {
    const start = new Date(sessionStart).getTime();
    const offline: AppNotification[] = [];
    const live: AppNotification[] = [];
    for (const item of items) {
      if (new Date(item.created_at).getTime() < start) offline.push(item);
      else live.push(item);
    }
    return { offlineItems: offline, liveItems: live };
  }, [items, sessionStart]);

  return {
    items,
    loading,
    unreadCount,
    fetchNotifications,
    markRead,
    offlineItems,
    liveItems,
  };
}
