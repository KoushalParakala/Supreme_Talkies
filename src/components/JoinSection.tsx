import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Card data ── */
const CARDS = [
  {
    cue: 'LIGHT',
    title: 'I HAVE A STORY',
    quote: 'A script that demands to be told. Every blank page is a universe waiting.',
    sub: 'Writers & Storytellers',
    icon: '✦',
    delay: 0,
  },
  {
    cue: 'CAMERA',
    title: 'I WANT TO BUILD',
    quote: 'My craft belongs on set. The invisible magic that makes it real.',
    sub: 'Crew & Technicians',
    icon: '◈',
    delay: 0.1,
  },
  {
    cue: 'ACTION',
    title: "I'M THE SIGNAL",
    quote: 'I amplify what matters. Be the first to feel the wave.',
    sub: 'Producers, Marketers & Members',
    icon: '▶',
    delay: 0.2,
  },
] as const;

/* ── Single invite card ── */
function InviteCard({
  cue, title, quote, sub, icon, delay,
  onClick,
}: typeof CARDS[number] & { onClick: () => void }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: 'relative',
        flex: '1 1 0',
        minWidth: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        background: hov ? 'rgba(232,97,10,0.07)' : 'rgba(188,168,142,0.03)',
        border: `1px solid ${hov ? 'rgba(232,97,10,0.55)' : 'rgba(188,168,142,0.14)'}`,
        padding: 'clamp(28px, 4vw, 48px) clamp(20px, 3vw, 36px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}
    >
      {/* Cue word — giant watermark */}
      <motion.div
        animate={{ opacity: hov ? 0.12 : 0.06, scale: hov ? 1.04 : 1 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'absolute', bottom: -10, right: -6,
          fontFamily: '"Impact Std Regular", Impact, Arial, sans-serif',
          fontSize: 'clamp(72px, 10vw, 120px)',
          color: hov ? '#E8610A' : '#BCA88E',
          letterSpacing: -2,
          userSelect: 'none',
          pointerEvents: 'none',
          lineHeight: 1,
        }}
      >
        {cue}
      </motion.div>

      {/* Top badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.span
          animate={{ color: hov ? '#E8610A' : '#BCA88E' }}
          transition={{ duration: 0.3 }}
          style={{ fontFamily: 'Inter, monospace', fontSize: 10, letterSpacing: 5 }}
        >
          {cue}
        </motion.span>
        <div style={{ flex: 1, height: 1, background: hov ? 'rgba(232,97,10,0.4)' : 'rgba(188,168,142,0.2)', transition: 'background 0.3s' }} />
        <span style={{ fontSize: 14, color: hov ? '#E8610A' : '#BCA88E', opacity: 0.7, transition: 'color 0.3s' }}>{icon}</span>
      </div>

      {/* Title */}
      <motion.h3
        animate={{ color: hov ? '#FFFFFF' : '#F0EBE0' }}
        transition={{ duration: 0.3 }}
        style={{
          fontFamily: '"Impact Std Regular", Impact, "Arial Narrow", Arial, sans-serif',
          fontSize: 'clamp(22px, 2.5vw, 32px)',
          letterSpacing: 3,
          margin: 0,
          lineHeight: 1.1,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </motion.h3>

      {/* Quote */}
      <p style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 'clamp(13px, 1.2vw, 16px)',
        color: hov ? 'rgba(240,235,224,0.85)' : 'rgba(240,235,224,0.5)',
        fontStyle: 'italic',
        lineHeight: 1.65,
        margin: 0,
        transition: 'color 0.3s',
      }}>
        "{quote}"
      </p>

      {/* Sub + CTA */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: hov ? 0.5 : 0.3, letterSpacing: 3, transition: 'opacity 0.3s' }}>{sub}</span>
        <motion.span
          animate={{ x: hov ? 6 : 0, opacity: hov ? 1 : 0.4 }}
          transition={{ duration: 0.25 }}
          style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: hov ? '#E8610A' : '#BCA88E', letterSpacing: 2 }}
        >
          JOIN →
        </motion.span>
      </div>
    </motion.div>
  );
}

/* ── GET IN button ── */
function GetInButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4 }}
      animate={{ background: hov ? '#BCA88E' : 'transparent', color: hov ? '#0e0f13' : '#BCA88E' }}
      style={{
        border: '1px solid #BCA88E',
        padding: '14px 52px',
        fontFamily: 'Playfair Display, serif',
        fontSize: 14,
        letterSpacing: 6,
        cursor: 'pointer',
        marginTop: 12,
        alignSelf: 'center',
        textTransform: 'uppercase' as const,
        transition: 'background 0.25s, color 0.25s',
        minWidth: 'min(440px, 100%)',
        whiteSpace: 'nowrap'
      }}
    >
      {hov ? 'GET IN →' : 'ALREADY HAVE A PASS? GET IN'}
    </motion.button>
  );
}

export default function JoinSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEntry = (cue?: string) => {
    if (user) {
      if (cue === 'LIGHT') navigate('/dashboard', { state: { activeRole: 'writer' } });
      else if (cue === 'CAMERA') navigate('/dashboard', { state: { activeRole: 'technician' } });
      else if (cue === 'ACTION') navigate('/dashboard', { state: { activeRole: 'producer' } });
      else navigate('/role-select');
    } else {
      navigate('/auth', { state: { mode: cue ? 'signup' : 'login' } });
    }
  };

  return (
    <section
      id="join-section"
      style={{
        background: '#13141a',
        paddingTop: 'clamp(64px, 10vh, 120px)',
        paddingBottom: 'clamp(64px, 10vh, 120px)',
        paddingLeft: 'clamp(24px, 6vw, 100px)',
        paddingRight: 'clamp(24px, 6vw, 100px)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 56,
      }}
    >
      {/* Subtle grid */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 60px, rgba(188,168,142,0.012) 60px, rgba(188,168,142,0.012) 61px), repeating-linear-gradient(90deg, transparent 0px, transparent 60px, rgba(188,168,142,0.008) 60px, rgba(188,168,142,0.008) 61px)' }} />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
          <div style={{ width: 48, height: 1, background: 'rgba(188,168,142,0.3)' }} />
          <span style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', letterSpacing: 6, opacity: 0.5 }}>JOIN THE CAST</span>
          <div style={{ width: 48, height: 1, background: 'rgba(188,168,142,0.3)' }} />
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 5vw, 64px)', color: '#F0EBE0', lineHeight: 0.95, margin: '0 0 12px', letterSpacing: 1 }}>
          WHO ARE YOU?
        </h2>
        <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.35, margin: 0, letterSpacing: 3 }}>
          THE GATE IS OPEN. CHOOSE YOUR CALL.
        </p>
      </motion.div>

      {/* 3 Cards */}
      <div
        style={{
          display: 'flex',
          gap: 'clamp(12px, 2vw, 28px)',
          width: '100%',
          maxWidth: 1200,
          position: 'relative',
          zIndex: 1,
          flexWrap: 'wrap',
        }}
      >
        {CARDS.map((card) => (
          <InviteCard key={card.cue} {...card} onClick={() => handleEntry(card.cue)} />
        ))}
      </div>

      {/* GET IN button */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <GetInButton onClick={() => handleEntry()} />
        <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#F0EBE0', opacity: 0.2, margin: 0, letterSpacing: 3, textAlign: 'center' }}>
          RETURNING MEMBER? LOG BACK IN ABOVE
        </p>
      </div>
    </section>
  );
}
