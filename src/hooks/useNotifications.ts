import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
        .limit(20);
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
          setItems((prev) => [row, ...prev].slice(0, 20));
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

  return { items, loading, unreadCount, fetchNotifications, markRead };
}
