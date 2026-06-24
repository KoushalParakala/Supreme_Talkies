import { motion, AnimatePresence } from 'framer-motion';
import type { Film } from '../data/films';

interface FilmHoverCardProps {
  film: Film | null;
}

export default function FilmHoverCard({ film }: FilmHoverCardProps) {
  return (
    <AnimatePresence>
      {film && (
        <motion.div
          key={film.id}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            bottom: 48,
            left: 48,
            zIndex: 60,
            background: 'rgba(7,7,7,0.96)',
            borderLeft: '2px solid #BCA88E',
            padding: '20px 26px',
            minWidth: 270,
            maxWidth: 340,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
          initial={{ opacity: 0, x: -18, y: 6 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -12, y: 4 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* Label */}
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 9,
              color: '#c9a84c',
              letterSpacing: 5,
              opacity: 0.55,
              marginBottom: 10,
              textTransform: 'uppercase',
            }}
          >
            PRODUCTION NOTE
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              color: '#BCA88E',
              lineHeight: 0.95,
              margin: '0 0 10px',
              letterSpacing: '0.02em',
            }}
          >
            {film.title}
          </h3>

          {/* Special Note / Logline */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: '#F0EBE0',
              lineHeight: 1.75,
              opacity: 0.75,
              margin: '0 0 14px',
              fontStyle: film.specialNote ? 'normal' : 'italic',
            }}
          >
            {film.specialNote || film.productionNote}
          </p>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: 'rgba(188,168,142,0.18)',
              marginBottom: 12,
            }}
          />

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              letterSpacing: 3,
            }}
          >
            <span style={{ color: '#c9a84c' }}>{film.rating}</span>
            <span style={{ color: 'rgba(240,235,224,0.18)' }}>·</span>
            <span style={{ color: '#c9a84c' }}>{film.duration}</span>
            <span style={{ color: 'rgba(240,235,224,0.18)' }}>·</span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 10,
                color: 'rgba(240,235,224,0.35)',
                letterSpacing: 1,
              }}
            >
              {film.director || film.customCredits?.find(c => c.role.toLowerCase().includes('direct'))?.value || ''}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
