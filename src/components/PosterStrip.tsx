import { useState, useEffect, useRef } from 'react';
import { motion, PanInfo, useMotionValue, animate } from 'framer-motion';
import { useFilms } from '../hooks/useFilms';

interface PosterStripProps {
  onFilmClick: (id: string) => void;
}

export default function PosterStrip({ onFilmClick }: PosterStripProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { films: FILMS } = useFilms();
  const dragX = useMotionValue(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextPoster = () => setCurrentIndex((prev) => (prev + 1) % FILMS.length);
  const prevPoster = () => setCurrentIndex((prev) => (prev - 1 + FILMS.length) % FILMS.length);

  const startInteraction = () => {
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    setIsInteracting(true);
  };

  const stopInteraction = () => {
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => setIsInteracting(false), 2000);
  };

  useEffect(() => {
    if (isInteracting) return;
    const interval = setInterval(nextPoster, 4000);
    return () => clearInterval(interval);
  }, [isInteracting, FILMS.length]);

  const handlePanStart = () => { startInteraction(); dragX.stop(); };
  const handlePan = (_: any, info: PanInfo) => { dragX.set(info.offset.x); };
  const handlePanEnd = (_: any, info: PanInfo) => {
    stopInteraction();
    animate(dragX, 0, { type: 'spring', stiffness: 60, damping: 20, mass: 1 });
    if (info.offset.x < -50 || info.velocity.x < -300) nextPoster();
    else if (info.offset.x > 50 || info.velocity.x > 300) prevPoster();
  };

  const getDistance = (index: number) => {
    const length = FILMS.length;
    const half = Math.floor(length / 2);
    let dist = index - currentIndex;
    if (dist > half) dist -= length;
    else if (dist < -half) dist += length;
    return dist;
  };

  // Poster takes full width — side posters are offset so they peek in and blend
  const POSTER_W  = isMobile ? '100vw' : '100vw';
  const SIDE_OFFSET = isMobile ? '85vw' : '88vw';

  // Mask gradients: center has wide opaque middle fading at both edges
  // side cards fade stronger toward the outer edge to blend seamlessly
  const CENTER_MASK = 'linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)';
  const SIDE_MASK   = 'linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)';

  return (
    <div
      onMouseEnter={startInteraction}
      onMouseLeave={stopInteraction}
      style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '65vh' : '85vh',
        background: '#0a0808',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'pan-y',
      }}
    >
      <motion.div
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{
          position: 'absolute',
          inset: 0,
          x: dragX,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {FILMS.map((film, i) => {
          const dist = getDistance(i);
          const isCenter = dist === 0;
          const isLeft   = dist === -1;
          const isRight  = dist === 1;

          let x: string;
          let opacity: number;
          let zIndex: number;
          let pointerEvents: any = 'auto';
          let brightness: number;

          if (isCenter) {
            x = '0%'; opacity = 1; brightness = 1; zIndex = 20;
          } else if (isLeft) {
            x = `-${SIDE_OFFSET}`; opacity = 1; brightness = 0.45; zIndex = 10;
          } else if (isRight) {
            x = SIDE_OFFSET; opacity = 1; brightness = 0.45; zIndex = 10;
          } else {
            x = dist < 0 ? '-220%' : '220%';
            opacity = 0; brightness = 0; zIndex = 1; pointerEvents = 'none';
          }

          const isVisible = isCenter || isLeft || isRight;

          const bgImage =
            film.posterImage ||
            (i < 5 ? `/scroll${i + 1}.webp` : film.stills?.[0] || film.reelImage);

          // Mask: fades edges of each poster so adjacent posters blend into each other
          const mask = isCenter ? CENTER_MASK : SIDE_MASK;

          return (
            <motion.div
              key={film.id}
              onClick={() => {
                if (isCenter) onFilmClick(film.id);
                else if (isLeft) prevPoster();
                else if (isRight) nextPoster();
              }}
              animate={{
                x,
                opacity,
                filter: `brightness(${brightness})`,
              }}
              transition={{ type: 'spring', stiffness: 40, damping: 22 }}
              style={{
                position: 'absolute',
                width: POSTER_W,
                height: '100%',
                zIndex,
                pointerEvents,
                cursor: 'pointer',
                willChange: 'transform',
                // Mask creates the seamless blend between adjacent posters
                WebkitMaskImage: isVisible ? mask : 'none',
                maskImage: isVisible ? mask : 'none',
              }}
              whileTap={{ cursor: 'grabbing' }}
            >
              <img
                src={bgImage}
                alt={film.title || ''}
                draggable={false}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  userSelect: 'none',
                }}
              />

              {/* Center card: subtle bottom gradient + title info */}
              {isCenter && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background:
                      'linear-gradient(to top, rgba(10,8,8,0.88) 0%, rgba(10,8,8,0.45) 45%, transparent 100%)',
                    padding: isMobile ? '50px 22px 22px' : '70px 56px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                    zIndex: 6,
                    pointerEvents: 'none',
                  }}
                >
                  {film.title && (
                    <p
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: isMobile ? 20 : 28,
                        fontWeight: 600,
                        color: '#F0EBE0',
                        margin: 0,
                        letterSpacing: 1,
                        textShadow: '0 2px 14px rgba(0,0,0,0.9)',
                      }}
                    >
                      {film.title}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    {film.director && (
                      <span
                        style={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: 9,
                          letterSpacing: 4,
                          color: '#c9a84c',
                          textTransform: 'uppercase',
                        }}
                      >
                        dir. {film.director}
                      </span>
                    )}
                    {film.rating && (
                      <span
                        style={{
                          fontFamily: 'Inter, monospace',
                          fontSize: 8,
                          letterSpacing: 3,
                          color: 'rgba(240,235,224,0.4)',
                          border: '1px solid rgba(240,235,224,0.18)',
                          padding: '2px 7px',
                        }}
                      >
                        {film.rating}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Pagination — gold pill dots */}
      {FILMS.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            zIndex: 50,
            alignItems: 'center',
          }}
        >
          {FILMS.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => { setCurrentIndex(i); startInteraction(); stopInteraction(); }}
              animate={{
                width: i === currentIndex ? 24 : 6,
                opacity: i === currentIndex ? 1 : 0.3,
                background: i === currentIndex ? '#c9a84c' : '#F0EBE0',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0 }}
            />
          ))}
        </div>
      )}

      {/* Nav arrows */}
      {!isMobile && FILMS.length > 1 && (
        <>
          {[
            { side: 'left' as const, label: '‹', onClick: () => { prevPoster(); startInteraction(); stopInteraction(); } },
            { side: 'right' as const, label: '›', onClick: () => { nextPoster(); startInteraction(); stopInteraction(); } },
          ].map(({ side, label, onClick }) => (
            <button
              key={side}
              onClick={onClick}
              style={{
                position: 'absolute',
                [side]: 28,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 50,
                background: 'rgba(10,8,8,0.55)',
                border: '1px solid rgba(201,168,76,0.22)',
                color: 'rgba(201,168,76,0.75)',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: 18,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(201,168,76,0.14)';
                el.style.color = '#c9a84c';
                el.style.borderColor = 'rgba(201,168,76,0.5)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(10,8,8,0.55)';
                el.style.color = 'rgba(201,168,76,0.75)';
                el.style.borderColor = 'rgba(201,168,76,0.22)';
              }}
            >
              {label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
