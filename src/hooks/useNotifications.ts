import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { startOfLocalDay } from '../lib/time';
import { displayText } from '../lib/errors';

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
  const [error, setError] = useState('');

  const unreadCount = items.filter((n) => !n.read_at).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setItems([]);
      setError('');
      return;
    }
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40);
      if (fetchError) throw fetchError;
      setItems((data as AppNotification[]) || []);
      setError('');
    } catch (err) {
      console.warn('[useNotifications] fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Could not pull the sheet');
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
          toast(displayText(row.title, 'Update on the sheet'), {
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
        const { error: rpcError } = await supabase.rpc('mark_notifications_read', {
          p_ids: ids ?? null,
        });
        if (rpcError) throw rpcError;
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

  const { offlineItems, liveItems } = useMemo(() => {
    const start = startOfLocalDay().getTime();
    const offline: AppNotification[] = [];
    const live: AppNotification[] = [];
    for (const item of items) {
      if (new Date(item.created_at).getTime() < start) offline.push(item);
      else live.push(item);
    }
    return { offlineItems: offline, liveItems: live };
  }, [items]);

  return {
    items,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markRead,
    offlineItems,
    liveItems,
  };
}
