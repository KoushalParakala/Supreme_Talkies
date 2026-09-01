import { motion } from 'framer-motion';

const COUNTDOWN = [8, 7, 6, 5, 4, 3, 2, 1];

export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        background: '#171920',
        paddingTop: 48,
        paddingBottom: 36,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      {/* Film countdown leader numbers — background decoration */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {COUNTDOWN.map((num, i) => (
          <motion.div
            key={num}
            style={{
              fontFamily: 'Playfair Display, sans-serif',
              fontSize: 'clamp(60px, 8vw, 110px)',
              color: '#BCA88E',
              opacity: 0,
              userSelect: 'none',
              lineHeight: 1,
            }}
            animate={{ opacity: [0, 0.06, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatDelay: COUNTDOWN.length * 1.2 - 1.2,
              delay: i * 1.2,
              ease: 'easeInOut',
            }}
          >
            {num}
          </motion.div>
        ))}
      </div>

      {/* Film strip top edge */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          background: '#0d0d0d',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 12,
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 2,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.9)',
            }}
          />
        ))}
      </div>

      {/* Typographic logo mark */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: 8,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, sans-serif',
            fontSize: 18,
            color: '#F0EBE0',
            letterSpacing: 7,
            opacity: 0.55,
          }}
        >
          SUPREME
        </div>
        <div
          style={{
            fontFamily: 'Playfair Display, sans-serif',
            fontSize: 18,
            color: '#BCA88E',
            letterSpacing: 7,
            opacity: 0.55,
          }}
        >
          TALKIES
        </div>
      </div>

      {/* Divider with film reel notation */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          maxWidth: 400,
          padding: '0 32px',
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'rgba(188,168,142,0.12)' }} />
        <span
          style={{
            fontFamily: 'Inter, monospace',
            fontSize: 9,
            color: '#BCA88E',
            opacity: 0.4,
            letterSpacing: 3,
          }}
        >
          END OF REEL
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(188,168,142,0.12)' }} />
      </div>

      {/* Nav links */}
      <div
        style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 28, alignItems: 'center' }}
      >
        {['HOME', 'CINEMA', 'SUBMIT', 'JOIN'].map((label) => (
          <a
            key={label}
            href={
              label === 'HOME'
                ? '/'
                : label === 'SUBMIT'
                ? '/submit'
                : label === 'JOIN'
                ? '/join'
                : '#reel-section'
            }
            style={{
              fontFamily: 'Playfair Display, sans-serif',
              fontSize: 13,
              color: '#BCA88E',
              opacity: 0.4,
              letterSpacing: 4,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.4')}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Copyright */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, monospace',
            fontSize: 10,
            color: '#F0EBE0',
            opacity: 0.18,
            letterSpacing: 2,
          }}
        >
          © MMXXVI · ALL RIGHTS RESERVED · 35MM
        </span>
      </div>

      {/* Film strip bottom edge */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          background: '#0d0d0d',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 10,
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </footer>
  );
}
