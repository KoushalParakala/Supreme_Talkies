import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Loader from '../components/Loader';
import Nav from '../components/Nav';
import PosterStrip from '../components/PosterStrip';
import ReelSection from '../components/ReelSection';
import TearSection from '../components/TearSection';
import JoinSection from '../components/JoinSection';
import Footer from '../components/Footer';
import { GoldDivider, CornerAccents } from '../components/CinemaDecorations';
import { useAuth } from '../context/AuthContext';


/* ── Animated chevron scroll indicator ── */
function ScrollIndicator() {
  return (
    <motion.div
      style={{
        position: 'absolute', bottom: 32, left: '50%', translateX: '-50%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 12,
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.7, delay: 2.6 }}
    >
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: 6, color: '#F0EBE0', opacity: 0.35, textTransform: 'uppercase' }}>SCROLL</span>
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M3 6L9 12L15 6" stroke="#BCA88E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
      </motion.div>
    </motion.div>
  );
}


export default function Home() {
  const { user, displayName } = useAuth();
  const location = useLocation();
  // Skip loader if already shown this session
  const alreadyShown = sessionStorage.getItem('st_loader_shown') === '1';
  const [loading, setLoading] = useState(!alreadyShown);
  const [heroVisible, setHeroVisible] = useState(alreadyShown);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // If returning from a film detail page, read the target film id
  const returnFilmId = (location.state as any)?.returnToFilm as string | undefined;
  const [stripFilmId, setStripFilmId] = useState<string | undefined>();
  const targetFilmId = stripFilmId || returnFilmId;

  const handlePosterStripClick = (id: string) => {
    setStripFilmId(id);
    document.getElementById('reel-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setHeroVisible(true), 200);
      
      // Handle navigation scrolling
      const scrollTo = (location.state as any)?.scrollTo;
      if (scrollTo) {
        // Small delay to ensure DOM is ready and animations don't interfere
        setTimeout(() => {
          const el = document.getElementById(scrollTo);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          // Clear state to prevent scrolling on refresh
          window.history.replaceState({}, document.title);
        }, 300);
      }
      
      return () => clearTimeout(t);
    }
  }, [loading, location.state]);

  useEffect(() => {
    const onLenisScroll = (e: Event) => {
      const scroll = (e as CustomEvent<number>).detail;
      setScrolled(scroll > window.innerHeight * 0.28);
    };
    window.addEventListener('lenis-scroll', onLenisScroll);
    return () => window.removeEventListener('lenis-scroll', onLenisScroll);
  }, []);

  const handleFilmClick = (id: string) => {
    navigate(`/film/${id}`, { state: { fromHome: true } });
  };

  return (
    <>
      <AnimatePresence>
        {loading && (
          <Loader
            onComplete={() => {
              sessionStorage.setItem('st_loader_shown', '1');
              setLoading(false);
            }}
          />
        )}
      </AnimatePresence>

      {!loading && (
        <div style={{ overflowX: 'clip' }}>
          <Nav scrolled={scrolled} />

          {/* ── HERO — Ken Burns background ── */}
          <section
            style={{
              position: 'relative', width: '100%', height: '100vh',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              style={{
                position: 'absolute', inset: '-5%',
                backgroundImage: "url('/hero-bg.webp')",
                backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0,
              }}
              initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 3, ease: 'easeOut' }}
            />
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.20) 40%, rgba(0,0,0,0.70) 100%)' }} />
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'radial-gradient(ellipse 85% 75% at 50% 50%, transparent 25%, rgba(5,3,0,0.70) 100%)' }} />
            <CornerAccents />

            <AnimatePresence>
              {!scrolled && heroVisible && (
                <motion.div
                  key="hero-logo"
                  style={{ 
                    position: 'absolute', 
                    top: '48%', left: '50%', 
                    translateX: '-50%', translateY: '-50%',
                    zIndex: 10, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: 0
                  }}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.2, x: 'calc(-46vw + 60px)', y: 'calc(-46vh + 46px)', transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] } }}
                  transition={{ duration: 1.0, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <motion.div aria-hidden="true" style={{ position: 'absolute', inset: '-15%', background: 'radial-gradient(ellipse at center, rgba(188,168,142,0.22) 0%, rgba(255,215,0,0.08) 50%, transparent 75%)', filter: 'blur(28px)', zIndex: -1 }} animate={{ opacity: [0.6, 1.0, 0.6], scale: [0.95, 1.06, 0.95] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
                  <div style={{ display: 'inline-block' }}>
                    <motion.img
                      layoutId="site-logo" src="/logo-main.webp" alt="Supreme Talkies" draggable={false}
                      fetchPriority="high"
                      width="600"
                      height="200"
                      style={{ width: 'clamp(320px, 35vw, 600px)', height: 'auto', display: 'block', userSelect: 'none', mixBlendMode: 'screen', filter: 'brightness(1.1) saturate(1.2)' }}
                    />
                  </div>


                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {heroVisible && !scrolled && (
                <motion.div
                  style={{ position: 'absolute', bottom: '15%', left: '50%', translateX: '-50%', zIndex: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, whiteSpace: 'nowrap' }}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, delay: 0.7 }}
                >
                  {/* Personalized Greeting - placed between logo and the line */}
                  {user && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 0.8, y: 0 }}
                      transition={{ delay: 0.9, duration: 0.8 }}
                      style={{ 
                        fontFamily: 'Playfair Display, serif', 
                        fontSize: 'clamp(22px, 3vw, 36px)', 
                        color: '#BCA88E', 
                        letterSpacing: 2, 
                        margin: '0 0 15px 0', 
                        fontStyle: 'italic',
                        fontWeight: 500,
                        textShadow: '0 4px 15px rgba(0,0,0,0.6)',
                        opacity: 1
                      }}
                    >
                      Welcome back, {displayName.charAt(0) + displayName.slice(1).toLowerCase()}.
                    </motion.p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 1, background: 'rgba(188,168,142,0.4)' }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#F0EBE0', opacity: 0.5, letterSpacing: 5 }}>STORIES THAT DEMAND TO BE TOLD</span>
                    <div style={{ width: 40, height: 1, background: 'rgba(188,168,142,0.4)' }} />
                  </div>

                  {/* Action Button */}
                  <motion.button
                    onClick={() => {
                      if (user) navigate('/role-select');
                      else document.getElementById('join-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    whileHover={{ scale: 1.05, letterSpacing: '6px' }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(188,168,142,0.5)',
                      color: '#BCA88E',
                      padding: '14px 42px',
                      fontFamily: '"Montserrat", sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 4,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginTop: 10
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#BCA88E';
                      (e.currentTarget as HTMLElement).style.color = '#0e0f13';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'none';
                      (e.currentTarget as HTMLElement).style.color = '#BCA88E';
                    }}
                  >
                    {user ? 'VIEW ROLES' : 'JOIN THE REEL'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {heroVisible && !scrolled && <ScrollIndicator />}
            </AnimatePresence>
          </section>

          <GoldDivider />
          <PosterStrip onFilmClick={handlePosterStripClick} />

          <ReelSection onFilmClick={handleFilmClick} returnFilmId={targetFilmId} />
          <GoldDivider />
          <TearSection />
          <GoldDivider />
          <JoinSection />
          <GoldDivider />
          <Footer />
        </div>
      )}
    </>
  );
}
