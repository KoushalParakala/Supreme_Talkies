import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Nav from '../components/Nav';
import { useAuth } from '../context/AuthContext';
import { ROLE_COLORS } from '../lib/roleColors';
import { useNowShowing } from '../hooks/useNowShowing';
import { errorMessage } from '../lib/errors';
import {
  CALL_SHEET_ROLE_LABELS,
  useCallSheet,
  type CallSheetRole,
  type CallSheetUnit,
} from '../hooks/useCallSheet';

const UNIT_ACCENT: Record<CallSheetRole, string> = {
  writer: ROLE_COLORS.writer,
  technician: ROLE_COLORS.technician,
  producer: ROLE_COLORS.producer,
  presenter: ROLE_COLORS.presenter,
  marketing: ROLE_COLORS.marketing,
  amplifier: ROLE_COLORS.amplifier,
  admin: '#c9a153',
};

function CinemaInput({ label, placeholder, value, onChange, type = 'text' }: { label: string; placeholder?: string; value: string; onChange: (val: string) => void; type?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'DM Serif Display, serif', fontSize: 10, color: '#c9a153', letterSpacing: 4 }}>{label}</label>
      <input
        type={type}
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: 'var(--lift)', border: '1px solid rgba(var(--ink-rgb),0.12)', padding: '12px 16px', color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, outline: 'none' }}
      />
    </div>
  );
}

function CinemaTextarea({ label, placeholder, value, onChange, rows = 3 }: { label: string; placeholder?: string; value: string; onChange: (val: string) => void; rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'DM Serif Display, serif', fontSize: 10, color: '#c9a153', letterSpacing: 4 }}>{label}</label>
      <textarea
        rows={rows}
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: 'var(--lift)', border: '1px solid rgba(var(--ink-rgb),0.12)', padding: '12px 16px', color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, outline: 'none', resize: 'vertical' }}
      />
    </div>
  );
}

function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0');
}

function UnitCard({
  unit,
  onOpen,
}: {
  unit: CallSheetUnit;
  onOpen: (role: CallSheetRole) => void;
}) {
  const accent = UNIT_ACCENT[unit.role];
  return (
    <article
      className="call-sheet-unit"
      style={{ ['--role-accent' as string]: accent }}
    >
      <div className="call-sheet-unit-head">
        <span>{unit.kicker}</span>
        <span>{pad(unit.rows.length)} LINES</span>
      </div>
      <div className={`call-sheet-tiles call-sheet-tiles-${unit.tiles.length}`}>
        {unit.tiles.map((tile) => (
          <div key={tile.id} className="call-sheet-tile">
            <b>{pad(tile.count)}</b>
            <span>{tile.label}</span>
          </div>
        ))}
      </div>
      <div className="call-sheet-on">
        <span className="call-sheet-on-kicker">On the sheet</span>
        {unit.rows.length === 0 ? (
          <p className="call-sheet-on-empty">{unit.empty}</p>
        ) : (
          unit.rows.map((row) => (
            <button
              key={row.id}
              type="button"
              className="call-sheet-line"
              onClick={() => onOpen(unit.role)}
            >
              <strong>{row.title}</strong>
              <small>{row.meta}</small>
            </button>
          ))
        )}
      </div>
      <div className="call-sheet-unit-foot">
        <button type="button" className="dash-ghost-btn" onClick={() => onOpen(unit.role)}>
          Open the {unit.label} room
        </button>
      </div>
    </article>
  );
}

export default function CallSheet() {
  const navigate = useNavigate();
  const { user, profile, displayName, isAdmin } = useAuth();
  const { roles, units, loading, error, fetchSheet } = useCallSheet();
  const { posters, loading: postersLoading, submitRequest } = useNowShowing();
  const [reqFilm, setReqFilm] = useState('');
  const [reqEmail, setReqEmail] = useState(user?.email || '');
  const [reqNote, setReqNote] = useState('');
  const [reqLink, setReqLink] = useState('');
  const [reqPoster, setReqPoster] = useState<File | null>(null);
  const [sendingReq, setSendingReq] = useState(false);

  useEffect(() => { setReqEmail(user?.email || ''); }, [user?.email]);

  const openRole = (role: CallSheetRole) => {
    navigate('/dashboard', { state: { activeRole: role } });
  };

  const crafts = roles.map((role) => CALL_SHEET_ROLE_LABELS[role]).join(' · ');
  const stId = profile?.st_id
    ? profile.st_id.startsWith('SUPR-')
      ? profile.st_id
      : `SUPR-${profile.st_id}`
    : null;
  const soloRole = roles.length === 1 ? roles[0] : null;
  const shellRole = soloRole && soloRole !== 'admin' ? soloRole : null;

  return (
    <motion.div
      className={`dash-shell site-page sub-page${shellRole ? ` dash-role dash-role-${shellRole}` : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Nav scrolled={true} />
      <div className={`dash-body${shellRole ? ` dash-role dash-role-${shellRole}` : ''}`}>
        <div className="dash-masthead">
          <div className="section-line dash-section-line">
            <span>08 / THE CALL SHEET</span>
            <span>WHAT HAS BEEN DONE <i /></span>
          </div>
          <h1>The Call <em>Sheet</em></h1>
          <p className="dash-meta">
            <span>{displayName || 'Member'}</span>
            {stId && (
              <>
                <span className="dash-meta-sep">/</span>
                <span className="dash-id">{stId}</span>
              </>
            )}
            {crafts && (
              <>
                <span className="dash-meta-sep">/</span>
                <span>{crafts}</span>
              </>
            )}
          </p>
        </div>

        <div className="call-sheet-now">
          <div className="section-line dash-section-line">
            <span>NOW SHOWING</span>
            <span>ON THE WALL <i /></span>
          </div>
          {postersLoading && posters.length === 0 ? (
            <div className="dash-loading dash-loading-inline"><p>Pulling the posters…</p></div>
          ) : posters.length === 0 ? (
            <div className="crew-empty">
              <h3>Nothing on the wall yet</h3>
              <p>Request a film below and the floor will follow.</p>
            </div>
          ) : (
            <div className="call-sheet-now-grid">
              {posters.map((poster) => (
                <a
                  key={poster.id}
                  className="call-sheet-poster"
                  href={poster.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={poster.image_url} alt={poster.title} />
                  <span>{poster.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <form
          className="call-sheet-request"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!user || sendingReq) return;
            setSendingReq(true);
            try {
              await submitRequest({
                user_id: user.id,
                film_name: reqFilm,
                email: reqEmail,
                note: reqNote,
                poster_link: reqLink,
                posterFile: reqPoster,
              });
              setReqFilm('');
              setReqNote('');
              setReqLink('');
              setReqPoster(null);
            } catch (err: unknown) {
              toast(errorMessage(err));
            } finally {
              setSendingReq(false);
            }
          }}
        >
          <div className="section-line dash-section-line">
            <span>REQUEST YOUR FILM</span>
            <span>FOR THE WALL <i /></span>
          </div>
          <div className="call-sheet-request-fields">
            <CinemaInput label="FILM NAME" value={reqFilm} onChange={setReqFilm} />
            <CinemaInput label="EMAIL" type="email" value={reqEmail} onChange={setReqEmail} />
          </div>
          <CinemaTextarea label="NOTE" value={reqNote} onChange={setReqNote} rows={3} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontFamily: 'DM Serif Display, serif', fontSize: 10, color: '#c9a153', letterSpacing: 4 }}>POSTER</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 12, cursor: sendingReq ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
              <span style={{ background: 'none', border: '1px solid rgba(201,161,83,0.28)', color: '#c9a153', fontSize: 10, padding: '8px 14px', letterSpacing: 2, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
                UPLOAD POSTER
              </span>
              {reqPoster && <span style={{ fontSize: 11, color: 'var(--ink)', opacity: 0.7 }}>{reqPoster.name}</span>}
              <input
                type="file"
                accept="image/*"
                disabled={sendingReq}
                onChange={(e) => {
                  setReqPoster(e.target.files?.[0] || null);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <CinemaInput label="POSTER LINK" value={reqLink} onChange={setReqLink} placeholder="https:// (optional if you upload)" />
          <button type="submit" className="primary-button" disabled={sendingReq || !reqFilm.trim() || !reqEmail.trim() || (!reqLink.trim() && !reqPoster)}>
            {sendingReq ? 'SENDING…' : 'SEND REQUEST'}
          </button>
        </form>

        {error && (
          <div className="crew-empty call-sheet-error">
            <h3>Could not pull the sheet</h3>
            <p>{error}</p>
            <button type="button" className="dash-ghost-btn" onClick={() => void fetchSheet()}>
              Try again
            </button>
          </div>
        )}

        {loading && units.length === 0 && (
          <div className="dash-loading dash-loading-inline">
            <p>Pulling the sheet…</p>
          </div>
        )}

        {!loading && roles.length === 0 && !isAdmin && (
          <div className="crew-empty">
            <h3>No craft on the sheet</h3>
            <p>Pick a role and the numbers will land here.</p>
            <button type="button" className="dash-ghost-btn" onClick={() => navigate('/role-select')}>
              Choose a role
            </button>
          </div>
        )}

        {units.length > 0 && (
          <div className={`call-sheet-units${units.length === 1 ? ' is-solo' : ''}`}>
            {units.map((unit) => (
              <UnitCard key={unit.role} unit={unit} onOpen={openRole} />
            ))}
          </div>
        )}

        <div className="dash-footer-actions">
          <button type="button" className="primary-button" onClick={() => navigate('/green-room')}>
            Open the Green Room
          </button>
          <button type="button" className="dash-ghost-btn" onClick={() => navigate('/dashboard')}>
            Craft rooms
          </button>
        </div>
      </div>
    </motion.div>
  );
}
