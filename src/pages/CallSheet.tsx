import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Nav from '../components/Nav';
import { useAuth } from '../context/AuthContext';
import { ROLE_COLORS } from '../lib/roleColors';
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
  const { profile, displayName, isAdmin } = useAuth();
  const { roles, units, loading, error, fetchSheet } = useCallSheet();

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
