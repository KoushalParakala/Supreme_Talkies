import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'NOW';
  if (m < 60) return `${m}M`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H`;
  return `${Math.floor(h / 24)}D`;
}

export default function NotificationBell() {
  const { items, unreadCount, markRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={rootRef} style={{ position: 'relative', zIndex: 110 }}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          background: 'none',
          border: '1px solid rgba(188,168,142,0.25)',
          color: '#BCA88E',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 14,
              height: 14,
              borderRadius: 7,
              background: '#BCA88E',
              color: '#0e0f13',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 8,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: 320,
              maxHeight: 420,
              background: 'rgba(8,8,10,0.98)',
              border: '1px solid rgba(188,168,142,0.15)',
              zIndex: 1200,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid rgba(188,168,142,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 3, color: '#BCA88E' }}>
                NOTIFICATIONS
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markRead()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(188,168,142,0.7)',
                    fontFamily: 'Inter, monospace',
                    fontSize: 9,
                    letterSpacing: 1,
                    cursor: 'pointer',
                  }}
                >
                  MARK ALL READ
                </button>
              )}
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading && items.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(240,235,224,0.4)', fontSize: 10 }}>
                  Loading notifications…
                </div>
              )}
              {!loading && items.length === 0 && (
                <div style={{ padding: 28, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', color: '#BCA88E', fontSize: 16, marginBottom: 8 }}>
                    Quiet on set
                  </div>
                  <div style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: 'rgba(240,235,224,0.4)' }}>
                    Script moves and collabs will show up here.
                  </div>
                </div>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    void markRead([n.id]);
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: n.read_at ? 'transparent' : 'rgba(188,168,142,0.06)',
                    border: 'none',
                    borderBottom: '1px solid rgba(188,168,142,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#F0EBE0',
                        letterSpacing: 1,
                      }}
                    >
                      {n.title}
                    </span>
                    <span style={{ fontFamily: 'Inter, monospace', fontSize: 8, color: 'rgba(188,168,142,0.5)' }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <div style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: 'rgba(240,235,224,0.45)', lineHeight: 1.4 }}>
                      {n.body}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
