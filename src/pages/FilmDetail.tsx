import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilms } from '../hooks/useFilms';
import Nav from '../components/Nav';

/* ── Background Slideshow for film stills ── */
function StillsSlideshow({ stills, filmColor }: { stills?: string[]; filmColor: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!stills || stills.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % stills.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [stills]);

  if (!stills || stills.length === 0) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 70% 40%, ${filmColor} 0%, #000 75%)`, filter: 'blur(4px) saturate(1.4) brightness(0.85)' }} />
    );
  }

  const currentStill = stills[index];
  const isRightAligned = currentStill.includes('bg1') || currentStill.includes('bg2') || currentStill.includes('bg4');

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${currentStill})`,
            backgroundSize: 'cover',
            backgroundPosition: isRightAligned ? '90% center' : '70% center',
            filter: `brightness(${currentStill.includes('bg2') ? '0.8' : '0.7'}) saturate(1.2)`,
          }}
        />
      </AnimatePresence>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 70% 50%, transparent 20%, rgba(0,0,0,0.7) 100%)' }} />
    </div>
  );
}

export default function FilmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { films, loading } = useFilms();
  const film = films.find((f) => f.id === id);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect to home if film not found — must be in useEffect, not during render
  useEffect(() => {
    if (!loading && !film) {
      navigate('/', { replace: true });
    }
  }, [film, loading, navigate]);

  if (loading || !film) {
    return <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a' }} />;
  }

  const handleBack = () => {
    // Return to home and restore the reel scroll position for this film
    navigate('/', { state: { returnToFilm: film.id } });
  };

  if (film.comingSoon) {
    return (
      <motion.div
        style={{ position: 'fixed', inset: 0, zIndex: 100, width: '100%', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
      >
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', zIndex: 0, overflow: 'hidden' }}>
          <StillsSlideshow stills={film.stills} filmColor={film.color} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.85)' }} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)', opacity: 0.4 }} />
        </div>

        <Nav scrolled={true} />

        <motion.button
          onClick={handleBack}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            position: 'fixed', top: 110, left: isMobile ? 24 : 'clamp(40px, 5vw, 80px)',
            background: 'rgba(10,10,10,0.65)', backdropFilter: 'blur(8px)',
            padding: '10px 16px', borderRadius: 4, border: '1px solid rgba(188,168,142,0.15)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, zIndex: 20,
            fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E',
            letterSpacing: 4, opacity: 0.8, transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = 'rgba(10,10,10,0.85)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; (e.currentTarget as HTMLElement).style.background = 'rgba(10,10,10,0.65)'; }}
        >
          ← BACK TO REEL
        </motion.button>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 24 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ 
              border: '1px solid rgba(188,168,142,0.2)', 
              padding: isMobile ? '32px 24px' : '48px 64px', 
              textAlign: 'center',
              maxWidth: 600,
              width: '100%',
              background: 'rgba(10,10,10,0.4)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: 6, color: '#BCA88E', opacity: 0.4, margin: '0 0 16px', textTransform: 'uppercase' }}>
              SUPREME TALKIES PRESENTS
            </p>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? 'clamp(32px, 6vw, 48px)' : 'clamp(36px, 5vw, 72px)', color: '#F0EBE0', margin: 0, textTransform: 'uppercase', lineHeight: 1.1 }}>
              {film.title}
            </h1>
            <div style={{ width: 60, height: 1, background: '#c9a84c', margin: '24px auto', opacity: 0.6 }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: 6, color: '#BCA88E', opacity: 0.5, margin: 0, textTransform: 'uppercase' }}>
              DETAILS DROPPING SOON
            </p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const credits = film.customCredits && film.customCredits.length > 0 
    ? film.customCredits.filter(c => c.value).map(c => ({ label: c.role.toUpperCase(), value: c.value }))
    : [
    { label: 'DIRECTED BY',      value: film.director },
    { label: 'PRODUCED BY',      value: film.producer },
    { label: 'ASSOCIATE DIRECTOR', value: film.associateDirector },
    { label: 'WRITTEN BY',       value: film.writtenBy },
    { label: 'CINEMATOGRAPHY',   value: film.cinematography },
    { label: 'EDITING',          value: film.editing },
    { label: 'MUSIC',            value: film.music },
    { label: 'COLOURIST',        value: film.colourist },
    { label: 'PUBLICITY DESIGN', value: film.publicityDesign },
    { label: 'PRESENTED BY',     value: film.presentedBy },
    { label: 'TELUGU DUBBING TEAM', value: film.teluguDubbingTeam },
    { label: 'SUPREME TALKIES TEAM', value: film.supremeTalkiesTeam },
    { label: 'CAST',             value: film.cast },
  ].filter(c => c.value);

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, zIndex: 100, width: '100%', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
    >
      {/* Background slideshow */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', zIndex: 0, overflow: 'hidden' }}>
        <StillsSlideshow stills={film.stills} filmColor={film.color} />
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: isMobile 
            ? 'linear-gradient(to bottom, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.6) 40%, rgba(10,10,10,0.8) 100%)'
            : 'linear-gradient(to right, #0a0a0a 0%, rgba(10,10,10,0.6) 20%, transparent 100%)' 
        }} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)', opacity: 0.4 }} />
      </div>

      {!isMobile && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: 'linear-gradient(to right, rgba(10,10,10,1) 0%, rgba(10,10,10,0.85) 50%, rgba(10,10,10,0.4) 80%, transparent 100%)', zIndex: 1, pointerEvents: 'none' }} />
      )}

      <Nav scrolled={true} />

      {/* ── Back button ── */}
      <motion.button
        onClick={handleBack}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          position: 'fixed', 
          top: 110, 
          left: isMobile ? 24 : 'clamp(40px, 5vw, 80px)',
          background: 'rgba(10,10,10,0.65)', backdropFilter: 'blur(8px)',
          padding: '10px 16px', borderRadius: 4, border: '1px solid rgba(188,168,142,0.15)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, zIndex: 20,
          fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E',
          letterSpacing: 4, opacity: 0.8, transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = 'rgba(10,10,10,0.85)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; (e.currentTarget as HTMLElement).style.background = 'rgba(10,10,10,0.65)'; }}
      >
        ← BACK TO REEL
      </motion.button>

      {/* Scrollable content */}
      <div
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{ position: 'absolute', inset: 0, zIndex: 10, overflowY: 'auto', pointerEvents: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div[data-lenis-prevent]::-webkit-scrollbar { display: none; }`}</style>
        <div style={{ 
          width: isMobile ? '100%' : '50%', 
          minHeight: '100.1vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: isMobile ? '160px 24px 80px' : '140px clamp(40px, 5vw, 80px) 120px', 
          pointerEvents: 'auto' 
        }}>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}
            style={{ 
              fontFamily: 'Playfair Display, sans-serif', 
              fontSize: isMobile ? 'clamp(28px, 8vw, 52px)' : 'clamp(38px, 5vw, 72px)', 
              color: '#BCA88E', 
              lineHeight: 1.1, 
              margin: '0 0 8px', 
              letterSpacing: '-0.01em', 
              textTransform: 'uppercase' 
            }}
          >
            {film.title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.3 }}
            style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 10, fontWeight: 600, color: '#F0EBE0', letterSpacing: 4, marginBottom: 40, textTransform: 'uppercase' }}
          >
            {film.duration} · {film.rating}
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            {credits.map(({ label, value }, i) => (
              <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                <div style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 8, fontWeight: 700, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: label === 'CAST' || label.includes('TEAM') ? 14 : 17, color: '#F0EBE0', opacity: 0.95, maxWidth: isMobile ? '100%' : 400, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{value}</div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ maxWidth: 420 }}>
            <div style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 8, fontWeight: 700, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, marginBottom: 12 }}>SYNOPSIS</div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', lineHeight: 1.8, opacity: 0.7, margin: 0 }}>{film.synopsis}</p>
          </motion.div>



          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} style={{ marginTop: 48 }}>
            {film.videoLink ? (
              <a href={film.videoLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: '#BCA88E', color: '#000' }} whileTap={{ scale: 0.98 }}
                  style={{ background: 'transparent', border: '1px solid #BCA88E', padding: '14px 48px', fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, color: '#BCA88E', letterSpacing: 4, cursor: 'pointer', transition: 'all 0.3s ease' }}
                >
                  WATCH NOW
                </motion.button>
              </a>
            ) : (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#BCA88E', opacity: 0.4, letterSpacing: 2 }}>RELEASING SOON</div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
