import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { IconBell } from './ReelIcons';
import { timeAgo } from '../lib/time';
import { displayText } from '../lib/errors';

export default function NotificationBell({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { items, unreadCount, markRead, loading } = useNotifications();
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="nav-user-menu" ref={rootRef}>
      <button
        type="button"
        className={`nav-bubble ${open ? 'is-open' : ''}`}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <IconBell size={15} />
        {unreadCount > 0 && (
          <span className="nav-bubble-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav-tray nav-tray-notify"
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <div className="nav-tray-head">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button type="button" onClick={() => void markRead()}>
                  Mark all read
                </button>
              )}
            </div>

            <div className="nav-tray-list" data-lenis-prevent>
              {loading && items.length === 0 && (
                <div className="nav-tray-empty">Loading notifications…</div>
              )}
              {!loading && items.length === 0 && (
                <div className="nav-tray-empty">
                  <strong>Quiet on set</strong>
                  <p>Script moves and collabs will show up here.</p>
                </div>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`nav-tray-item ${n.read_at ? '' : 'is-unread'}`}
                  onClick={() => {
                    void markRead([n.id]);
                    onOpenChange(false);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <div className="nav-tray-item-top">
                    <span>{displayText(n.title, 'Update')}</span>
                    <small>{timeAgo(n.created_at)}</small>
                  </div>
                  {n.body && <p>{displayText(n.body)}</p>}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="nav-tray-foot"
              onClick={() => {
                onOpenChange(false);
                navigate('/call-sheet');
              }}
            >
              Open the Call Sheet
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
