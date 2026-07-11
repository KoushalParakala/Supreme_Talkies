import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [clapDone, setClapDone] = useState(false);
  const [flashing, setFlashing] = useState(false);

  const handleClapComplete = useCallback(() => {
    if (clapDone || flashing) return;
    setFlashing(true);
    setTimeout(() => {
      setClapDone(true);
      setTimeout(onComplete, 800);
    }, 180);
  }, [clapDone, flashing, onComplete]);

  useEffect(() => {
    const safety = setTimeout(handleClapComplete, 4000);
    return () => clearTimeout(safety);
  }, [handleClapComplete]);

  const BOARD_W = 280;

  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
        overflow: 'hidden',
      }}
      exit={{
        opacity: 0,
        y: -40,
        scale: 0.96,
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
      }}
    >
      {/* Flash on clap */}
      <AnimatePresence>
        {flashing && (
          <motion.div
            style={{ position: 'absolute', inset: 0, background: '#ffffff', zIndex: 10 }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Film grain overlay (minimalist) */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── MINIMALIST CLAPPERBOARD ── */}
      <div style={{ position: 'relative', width: BOARD_W, zIndex: 2 }}>
        
        {/* TOP CLAP ARM */}
        <motion.div
          style={{
            transformOrigin: '0% 50%',
            position: 'relative',
            zIndex: 4,
            height: 32,
            background: 'repeating-linear-gradient(-45deg, #fff, #fff 24px, #111 24px, #111 48px)',
            border: '2px solid #fff',
            borderBottom: '1px solid #fff',
          }}
          initial={{ rotate: -25 }}
          animate={{ rotate: 0 }}
          transition={{ delay: 0.8, duration: 0.22, type: 'spring', stiffness: 500, damping: 20 }}
          onAnimationComplete={handleClapComplete}
        />

        {/* BOTTOM SLATE */}
        <div
          style={{
            width: BOARD_W,
            height: 140,
            background: '#111',
            border: '2px solid #fff',
            borderTop: '1px solid #fff',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span style={{ 
            fontFamily: 'Inter, sans-serif', 
            fontWeight: 800,
            fontSize: 26, 
            color: '#fff', 
            letterSpacing: '0.2em',
            textTransform: 'uppercase'
          }}>
            Supreme
          </span>
          <span style={{ 
            fontFamily: 'Inter, sans-serif', 
            fontWeight: 400,
            fontSize: 14, 
            color: '#fff', 
            opacity: 0.8,
            letterSpacing: '0.4em',
            marginTop: 4,
            textTransform: 'uppercase'
          }}>
            Talkies
          </span>
        </div>
      </div>

      {/* Loading indicator */}
      <motion.div
        style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12, zIndex: 2 }}
        animate={{ opacity: clapDone ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <span style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#fff', opacity: 0.5, letterSpacing: '0.3em' }}>
          LOADING
        </span>
        <motion.div
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}
