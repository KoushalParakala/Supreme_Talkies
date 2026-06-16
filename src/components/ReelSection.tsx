import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilms } from '../hooks/useFilms';
import FilmHoverCard from './FilmHoverCard';
import type { Film } from '../data/films';

interface ReelSectionProps {
  onFilmClick: (id: string) => void;
  returnFilmId?: string;
}

/* ── Single sprocket perforation ── */
function SprocketHole() {
  return (
    <div
      style={{
        width: 13,
        height: 20,
        borderRadius: 3,
        background: '#0d0f14',
        border: '1px solid rgba(255,255,255,0.055)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.95)',
        flexShrink: 0,
      }}
    />
  );
}

/* ── Vertical sprocket strip — DOM-ref driven for zero re-render perf ── */
function VerticalSprocketStrip({
  innerRef,
}: {
  innerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 34,
        height: '100%',
        background: '#1c1e26',
        overflow: 'hidden',
        flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,0.035)',
        borderRight: '1px solid rgba(255,255,255,0.035)',
      }}
    >
      <div
        ref={innerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 11,
          paddingTop: 10,
          willChange: 'transform',
        }}
      >
        {Array.from({ length: 120 }).map((_, i) => (
          <SprocketHole key={i} />
        ))}
      </div>
    </div>
  );
}

/* ── Intersection Observer Hook ── */
const useIntersectionObserver = (ref: React.RefObject<Element | null>, options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  // Stringify options to avoid re-running on every object reference change
  const optionsKey = JSON.stringify(options);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => 
      setIsIntersecting(entry.isIntersecting), { rootMargin: '200px', ...options });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, optionsKey]);
  return isIntersecting;
};

/* ── Individual poster card ── */
function PosterCard({
  film,
  onClick,
  onHoverChange,
}: {
  film: Film;
  onClick: () => void;
  onHoverChange: (hovered: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(cardRef);

  const handleHover = (h: boolean) => {
    setHovered(h);
    onHoverChange(h);
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      style={{ position: 'absolute', inset: 0, cursor: 'pointer', overflow: 'hidden' }}
    >
      {film.reelImage && isVisible ? (
        <motion.img
          src={film.reelImage}
          alt={`${film.title} poster`}
          draggable={false}
          loading="lazy"
          decoding="async"
          width="900"
          height="500"
          animate={{ scale: hovered ? 1.04 : 1 }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : film.reelImage ? (
        <div style={{ width: '100%', height: '100%', background: '#13151a' }} />
      ) : (
        <>
          {/* Colour radial base */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 40% 35%, ${film.color}cc 0%, ${film.color}55 35%, #171920 75%)`,
            }}
          />
          {/* Diagonal stripe texture */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(-45deg, transparent 0px, transparent 14px, rgba(255,255,255,0.012) 14px, rgba(255,255,255,0.012) 15px)',
              pointerEvents: 'none',
            }}
          />
          {/* Centred title frame */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                border: '1px solid rgba(201,168,76,0.14)',
                borderRadius: 2,
                padding: '20px 32px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 9,
                  color: '#c9a84c',
                  letterSpacing: 6,
                  opacity: 0.45,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                }}
              >
                COMING SOON
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 4vw, 52px)',
                  color: 'rgba(240,235,224,0.85)',
                  lineHeight: 0.9,
                  letterSpacing: '0.04em',
                }}
              >
                {film.title}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cinematic gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.22) 52%, rgba(0,0,0,0.08) 100%)',
        }}
      />

      {/* Scanlines */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
          pointerEvents: 'none',
        }}
      />

      {/* Warm hover glow */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 90% 60% at 50% 90%, rgba(188,168,142,0.09), transparent)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      />

      {/* Bottom text overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 'clamp(18px, 3vw, 34px)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 9,
            color: '#F0EBE0',
            opacity: 0.32,
            letterSpacing: 5,
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          SUPREME TALKIES PRESENTS
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(30px, 4.5vw, 60px)',
            color: '#BCA88E',
            lineHeight: 0.9,
            margin: '0 0 10px',
            letterSpacing: '0.02em',
            textShadow: hovered
              ? '0 0 40px rgba(188,168,142,0.4)'
              : '0 0 12px rgba(188,168,142,0.08)',
            transition: 'text-shadow 0.35s ease',
          }}
        >
          {film.title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              color: '#F0EBE0',
              opacity: 0.38,
              letterSpacing: 1,
            }}
          >
            A FILM BY {film.director}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Blurred cinematic side panel — dynamically tinted by current film ── */
function BlurredPanel({ side, film }: { side: 'left' | 'right'; film: Film }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: 'clamp(80px, 20vw, 320px)',
        zIndex: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(80px)',
        WebkitBackdropFilter: 'blur(80px)',
        borderRight: side === 'left' ? '1px solid rgba(255,255,255,0.06)' : 'none',
        borderLeft: side === 'right' ? '1px solid rgba(255,255,255,0.06)' : 'none',
        overflow: 'hidden',
      }}
    >
      <motion.div
        key={film.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: film.color ? film.color : 'transparent',
        }}
      />
    </div>
  );
}

/* ── Main ReelSection ── */
export default function ReelSection({ onFilmClick, returnFilmId }: ReelSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftSprocketRef = useRef<HTMLDivElement>(null);
  const rightSprocketRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);

  const { films: FILMS } = useFilms();

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [hoveredFilm, setHoveredFilm] = useState<Film | null>(null);

  /* Clear hover card whenever the active film changes */
  useEffect(() => {
    setHoveredFilm(null);
  }, [current]);

  /* RAF loop — reads getBoundingClientRect() which Lenis keeps in sync with window.scrollY */
  const isIntersecting = useIntersectionObserver(containerRef, { rootMargin: '100% 0px 100% 0px' });
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isIntersecting) return;
    let rafId: number;

    const tick = () => {
      const rect = container.getBoundingClientRect();
      const totalScrollable = container.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const progress =
        totalScrollable > 0 ? Math.min(1, scrolled / totalScrollable) : 0;

      /* Sprocket — direct DOM mutation + time-based continuous motion */
      const autoOffset = (Date.now() / 40) % 100; // Small continuous loop
      const sprocketOffset = -(progress * 1600) - autoOffset;
      
      if (leftSprocketRef.current)
        leftSprocketRef.current.style.transform = `translateY(${sprocketOffset}px)`;
      if (rightSprocketRef.current)
        rightSprocketRef.current.style.transform = `translateY(${sprocketOffset}px)`;

      /* Discrete film index */
      const newIndex = Math.min(
        FILMS.length - 1,
        Math.floor(progress * FILMS.length)
      );
      if (newIndex !== currentRef.current) {
        setDirection(newIndex > currentRef.current ? 1 : -1);
        currentRef.current = newIndex;
        setCurrent(newIndex);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isIntersecting, FILMS.length]);

  /* On return from film detail: scroll to the correct film's position */
  useEffect(() => {
    if (!returnFilmId) return;
    const filmIndex = FILMS.findIndex(f => f.id === returnFilmId);
    if (filmIndex < 0) return;
    const t = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const totalScrollable = container.offsetHeight - window.innerHeight;
      const targetScroll = (filmIndex / (FILMS.length - 1)) * totalScrollable;
      const top = container.offsetTop + targetScroll;
      window.scrollTo({ top, behavior: 'auto' });
    }, 100);
    return () => clearTimeout(t);
  }, [returnFilmId, FILMS]);

  /* Vertical film-advance slide variants */
  const slideVariants = {
    enter: (d: number) => ({ y: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (d: number) => ({ y: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    /* Outer scroll container — FILMS.length screens tall */
    <div
      ref={containerRef}
      id="reel-section"
      style={{ position: 'relative', height: `${Math.max(1, FILMS.length) * 100}vh` }}
    >
      {/* Sticky viewport — stays pinned while outer scrolls */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Ambient blurred side panels */}
        <BlurredPanel side="left" film={FILMS[current]} />
        <BlurredPanel side="right" film={FILMS[current]} />

        {/* Film counter — bottom left */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(18px, 2.5vw, 44px)',
            bottom: 'clamp(20px, 3vh, 40px)',
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            color: '#F0EBE0',
            opacity: 0.18,
            letterSpacing: 4,
            zIndex: 2,
          }}
        >
          {String(current + 1).padStart(2, '0')} / {String(FILMS.length).padStart(2, '0')}
        </div>

        {/* Vertical progress indicators — right edge */}
        <div
          style={{
            position: 'absolute',
            right: 'clamp(18px, 2.5vw, 44px)',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            zIndex: 2,
          }}
        >
          {FILMS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: i === current ? 32 : 10,
                background:
                  i === current ? '#c9a84c' : 'rgba(201,168,76,0.2)',
              }}
              transition={{ duration: 0.3 }}
              style={{ width: 3, borderRadius: 2 }}
            />
          ))}
        </div>

        {/* Scroll hint — fades out after first film */}
        <motion.div
          style={{
            position: 'absolute',
            right: 'clamp(18px, 2.5vw, 44px)',
            bottom: 'clamp(20px, 3vh, 40px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            zIndex: 2,
          }}
          animate={{ opacity: current === 0 ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            style={{
              width: 1,
              height: 36,
              background: 'rgba(201,168,76,0.3)',
              transformOrigin: 'top',
            }}
            animate={{ scaleY: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 8,
              letterSpacing: 4,
              color: '#c9a84c',
              opacity: 0.4,
              writingMode: 'vertical-rl',
              textTransform: 'uppercase',
            }}
          >
            SCROLL
          </span>
        </motion.div>

        {/* Center content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 900,
            padding: '0 clamp(16px, 4vw, 40px)',
          }}
        >
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{ marginBottom: 22, textAlign: 'center' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(201,168,76,0.17)',
                  maxWidth: 72,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10,
                  color: '#c9a84c',
                  letterSpacing: 7,
                  opacity: 0.55,
                }}
              >
                THE FILMS
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(201,168,76,0.17)',
                  maxWidth: 72,
                }}
              />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(34px, 5vw, 68px)',
                color: '#F0EBE0',
                letterSpacing: '0.06em',
                lineHeight: 0.88,
                margin: 0,
              }}
            >
              OUR CINEMA
            </h2>
          </motion.div>

          {/* ── Film Strip Frame ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            style={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow:
                '0 28px 72px rgba(0,0,0,0.97), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
              display: 'flex',
              flexDirection: 'row',
              height: 'clamp(300px, 54vh, 500px)',
              alignItems: 'stretch',
            }}
          >
            {/* Left sprocket strip */}
            <VerticalSprocketStrip innerRef={leftSprocketRef} />

            {/* Poster area */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                height: '100%',
                overflow: 'hidden',
                background: '#13151a',
              }}
            >
              {/*
                mode="sync": new poster enters while old one exits simultaneously.
                This prevents stacking/lag when scrolling quickly through films.
              */}
              <AnimatePresence mode="sync" custom={direction} initial={false}>
                <motion.div
                  key={current}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38, ease: [0.76, 0, 0.24, 1] }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <PosterCard
                    film={FILMS[current]}
                    onClick={() => onFilmClick(FILMS[current].id)}
                    onHoverChange={(h) =>
                      setHoveredFilm(h ? FILMS[current] : null)
                    }
                  />
                </motion.div>
              </AnimatePresence>

              {/* Top aperture shadow */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  background:
                    'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
                  pointerEvents: 'none',
                  zIndex: 8,
                }}
              />
              {/* Bottom aperture shadow */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                  pointerEvents: 'none',
                  zIndex: 8,
                }}
              />
            </div>

            {/* Right sprocket strip */}
            <VerticalSprocketStrip innerRef={rightSprocketRef} />
          </motion.div>
        </div>
      </div>

      {/* Synopsis card — fixed bottom-left, appears on poster hover */}
      <FilmHoverCard film={hoveredFilm} />
    </div>
  );
}
