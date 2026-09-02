import { useState, type CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Nav from '../components/Nav';
import { useAuth } from '../context/AuthContext';
import { useGreenRoomDesk } from '../hooks/useGreenRoomDesk';
import { timeAgo } from '../lib/time';
import { errorMessage } from '../lib/errors';

const CHIP: CSSProperties = {
  background: 'none',
  border: '1px solid rgba(201,161,83,0.1)',
  padding: '6px 14px',
  color: '#c9a153',
  fontFamily: 'Space Grotesk, sans-serif',
  fontSize: 8,
  letterSpacing: 3,
  cursor: 'pointer',
};

function isAuthorAdmin(author?: { role?: string | null; roles?: string[] | null } | null) {
  const raw = [...(Array.isArray(author?.roles) ? author!.roles : []), author?.role]
    .filter((r): r is string => typeof r === 'string' && r.length > 0)
    .map((r) => r.toLowerCase());
  return raw.includes('admin');
}

export default function GreenRoomDesk() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const desk = useGreenRoomDesk();
  const [busy, setBusy] = useState<string | null>(null);

  if (!authLoading && !isAdmin) return <Navigate to="/dashboard" replace />;

  const run = async (key: string, fn: () => Promise<void>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) toast.success(ok);
    } catch (err: unknown) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      className="dash-shell site-page sub-page green-room-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Nav scrolled={true} />
      <div className="dash-body green-room-body">
        <div className="dash-masthead">
          <div className="section-line dash-section-line">
            <span>THE FLOOR / DESK</span>
            <span>MODERATION <i /></span>
          </div>
          <h1>Floor <em>Desk</em></h1>
          <p className="dash-meta">Last seven days on the Green Room</p>
        </div>

        <div className="green-room-stage green-room-desk">
          <div className="green-room-window">
            <div className="green-room-window-head">
              <span>LIVE FLOOR</span>
              <span>LAST WEEK <i /></span>
            </div>
            <input
              className="crew-search"
              type="text"
              value={desk.query}
              onChange={(e) => desk.setQuery(e.target.value)}
              placeholder="Filter by name, SUPR-ID, or line"
              style={{ margin: '12px 16px 0' }}
            />
            <div className="green-room-floor" data-lenis-prevent>
              {desk.loading && desk.messages.length === 0 && (
                <div className="dash-loading dash-loading-inline"><p>Opening the desk…</p></div>
              )}
              {!desk.loading && desk.messages.length === 0 && (
                <div className="crew-empty">
                  <h3>{desk.loadError ? 'Desk could not open' : 'The floor is quiet'}</h3>
                  <p>{desk.loadError || 'No lines in the last seven days.'}</p>
                </div>
              )}
              {desk.messages.map((message) => (
                <article key={message.id} className="green-room-msg" id={`green-room-msg-${message.id}`}>
                  <div className="green-room-msg-body">
                    <div className="green-room-msg-top">
                      <strong>{message.author?.full_name?.trim() || 'Member'}</strong>
                      {isAuthorAdmin(message.author) && <span className="green-room-admin">ADMIN</span>}
                      <small className="green-room-time">{timeAgo(message.created_at)}</small>
                    </div>
                    {message.body && <p>{message.body}</p>}
                    {!message.body && message.external_link_title && <p>{message.external_link_title}</p>}
                    <div className="green-room-msg-actions">
                      <button
                        type="button"
                        className="green-room-own-btn is-danger"
                        style={{ color: '#ff5050' }}
                        disabled={busy === message.id}
                        onClick={() => void run(message.id, () => desk.deleteMessage(message.id), 'Line struck')}
                      >
                        DELETE
                      </button>
                      <button
                        type="button"
                        style={CHIP}
                        disabled={busy === `r-${message.author_id}` || message.author_id === user?.id}
                        onClick={() => user && void run(`r-${message.author_id}`, () => desk.setRestriction(message.author_id, 'restricted', user.id), 'Restricted from the floor')}
                      >
                        RESTRICT
                      </button>
                      <button
                        type="button"
                        style={CHIP}
                        disabled={busy === `b-${message.author_id}` || message.author_id === user?.id}
                        onClick={() => user && void run(`b-${message.author_id}`, () => desk.setRestriction(message.author_id, 'blocked', user.id), 'Blocked from the floor')}
                      >
                        BLOCK
                      </button>
                      <button
                        type="button"
                        className="green-room-own-btn is-danger"
                        style={{ color: '#ff5050' }}
                        disabled={busy === `all-${message.author_id}`}
                        onClick={() => {
                          const who = message.author?.full_name?.trim() || 'this member';
                          if (!window.confirm(`Strike every line from ${who} on the floor?`)) return;
                          void run(`all-${message.author_id}`, () => desk.strikeAuthor(message.author_id), `Struck ${who}`);
                        }}
                      >
                        STRIKE ALL
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {desk.hasMore && (
                <button type="button" className="dash-ghost-btn" onClick={() => void desk.loadMore()} style={{ margin: 16 }}>
                  LOAD MORE
                </button>
              )}
            </div>
          </div>

          <div className="call-sheet-unit green-room-desk-side" style={{ ['--role-accent' as string]: '#c9a153' }}>
            <div className="call-sheet-unit-head">
              <span>RESTRICTED</span>
              <span>{String(desk.restrictions.length).padStart(2, '0')}</span>
            </div>
            {desk.restrictions.length === 0 ? (
              <p className="call-sheet-on-empty">No one is off the floor.</p>
            ) : desk.restrictions.map((row) => (
              <div key={row.user_id} className="call-sheet-line" style={{ cursor: 'default' }}>
                <strong>{row.profile?.full_name || 'Member'}</strong>
                <small>{row.kind.toUpperCase()} · {row.profile?.st_id || row.user_id.slice(0, 8)}</small>
                <button type="button" style={{ ...CHIP, marginTop: 8 }} onClick={() => void run(`lift-${row.user_id}`, () => desk.liftRestriction(row.user_id), 'Lifted')}>
                  LIFT
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
