import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/* ── Gold divider that draws L-to-R on scroll into view ── */
export function GoldDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  return (
    <div ref={ref} style={{ width: '100%', height: 1, overflow: 'hidden' }}>
      <motion.div
        style={{ height: 1, background: 'var(--color-gold, #BCA88E)', transformOrigin: 'left' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </div>
  );
}

/* ── Viewfinder corner accents ── */
export function CornerAccents() {
  const corners = [
    { top: 24, left: 32 }, { top: 24, right: 32 },
    { bottom: 24, left: 32 }, { bottom: 24, right: 32 },
  ] as const;
  return (
    <>
      {corners.map((pos, i) => (
        <motion.div
          key={i} aria-hidden="true"
          style={{ position: 'absolute', ...pos, width: 20, height: 20, zIndex: 11, opacity: 0.4 }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 1.2 + i * 0.1 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d={
                'right' in pos && 'top' in pos
                  ? 'M20,0 L20,8 M12,0 L20,0'
                  : 'left' in pos && 'top' in pos
                  ? 'M0,0 L0,8 M0,0 L8,0'
                  : 'right' in pos && 'bottom' in pos
                  ? 'M20,20 L20,12 M12,20 L20,20'
                  : 'M0,20 L0,12 M0,20 L8,20'
              }
              stroke="#BCA88E" strokeWidth="1.5"
            />
          </svg>
        </motion.div>
      ))}
    </>
  );
}
