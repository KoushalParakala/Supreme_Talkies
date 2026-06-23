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
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 2000);
  };

  // Auto scroll
  useEffect(() => {
    if (isInteracting) return;
    const interval = setInterval(() => {
      nextPoster();
    }, 4000);
    return () => clearInterval(interval);
  }, [isInteracting, FILMS.length]);

  const handlePanStart = () => {
    startInteraction();
    dragX.stop();
  };

  const handlePan = (_: any, info: PanInfo) => {
    dragX.set(info.offset.x);
  };

  const handlePanEnd = (_: any, info: PanInfo) => {
    stopInteraction();
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    animate(dragX, 0, { type: 'spring', stiffness: 60, damping: 20, mass: 1 });
    if (offset < -50 || velocity < -300) nextPoster();
    else if (offset > 50 || velocity > 300) prevPoster();
  };

  const getDistance = (index: number) => {
    const length = FILMS.length;
    const half = Math.floor(length / 2);
    let dist = index - currentIndex;
    if (dist > half) dist -= length;
    else if (dist < -half) dist += length;
    return dist;
  };

  // Poster width & spacing
  const POSTER_W = isMobile ? '86vw' : '72vw';
  const SIDE_OFFSET = isMobile ? '92vw' : '78vw';

  return (
    <div
      onMouseEnter={startInteraction}
      onMouseLeave={stopInteraction}
      style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '60vh' : '78vh',
        background: '#0a0808',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'pan-y',
      }}
    >
      {/* Softened Edge Gradients — left and right container overlays */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: isMobile ? '15vw' : '12vw',
          background: 'linear-gradient(to right, #0a0808 0%, transparent 100%)',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: isMobile ? '15vw' : '12vw',
          background: 'linear-gradient(to left, #0a0808 0%, transparent 100%)',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      />

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
          const isLeft = dist === -1;
          const isRight = dist === 1;

          let x = '0%';
          let opacity = 1;
          let scale = 1;
          let zIndex = 10;
          let pointerEvents: any = 'auto';

          if (isCenter) {
            x = '0%';
            opacity = 1;
            scale = 1;
            zIndex = 20;
          } else if (isLeft) {
            x = `-${SIDE_OFFSET}`;
            opacity = 0.55;
            scale = 0.94;
            zIndex = 10;
          } else if (isRight) {
            x = SIDE_OFFSET;
            opacity = 0.55;
            scale = 0.94;
            zIndex = 10;
          } else {
            x = dist < 0 ? '-200%' : '200%';
            opacity = 0;
            scale = 0.85;
            zIndex = 1;
            pointerEvents = 'none';
          }

          const bgImage =
            film.posterImage ||
            (i < 5 ? `/scroll${i + 1}.webp` : film.stills?.[0] || film.reelImage);

          const isVisible = isCenter || isLeft || isRight;

          return (
            <motion.div
              key={film.id}
              onClick={() => {
                if (isCenter) onFilmClick(film.id);
                else if (isLeft) prevPoster();
                else if (isRight) nextPoster();
              }}
              animate={{ x, opacity, scale }}
              transition={{ type: 'spring', stiffness: 42, damping: 22 }}
              style={{
                position: 'absolute',
                width: POSTER_W,
                height: '84%', // properly boxed card with vertical margin
                zIndex,
                pointerEvents,
                cursor: isCenter ? 'pointer' : 'pointer',
                willChange: 'transform',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 48px rgba(0,0,0,0.65)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Poster image */}
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

              {/* Warm amber depth tint for side cards — NOT grey */}
              {!isCenter && isVisible && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(10, 8, 8, 0.52)',
                    boxShadow: 'inset 0 0 80px 20px rgba(10,8,8,0.6)',
                  }}
                />
              )}

              {/* Gold border frame on center card */}
              {isCenter && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.18)',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                />
              )}

              {/* Bottom title gradient + info on center card */}
              {isCenter && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(10,8,8,0.85) 0%, rgba(10,8,8,0.5) 40%, transparent 100%)',
                    padding: isMobile ? '40px 20px 20px' : '60px 40px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    zIndex: 6,
                    pointerEvents: 'none',
                  }}
                >
                  {film.title && (
                    <p
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: isMobile ? 18 : 26,
                        fontWeight: 600,
                        color: '#F0EBE0',
                        margin: 0,
                        letterSpacing: 1,
                        textShadow: '0 2px 12px rgba(0,0,0,0.8)',
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
                          border: '1px solid rgba(240,235,224,0.2)',
                          padding: '2px 6px',
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

      {/* Pagination — gold perforations */}
      {FILMS.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
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
                opacity: i === currentIndex ? 1 : 0.35,
                background: i === currentIndex ? '#c9a84c' : '#F0EBE0',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                height: 6,
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Nav arrows — minimal, cinematic */}
      {!isMobile && FILMS.length > 1 && (
        <>
          <button
            onClick={() => { prevPoster(); startInteraction(); stopInteraction(); }}
            style={{
              position: 'absolute',
              left: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
              background: 'rgba(10,8,8,0.6)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: 'rgba(201,168,76,0.7)',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'monospace',
              fontSize: 16,
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = '#c9a84c';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(10,8,8,0.6)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(201,168,76,0.7)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.2)';
            }}
          >
            ‹
          </button>
          <button
            onClick={() => { nextPoster(); startInteraction(); stopInteraction(); }}
            style={{
              position: 'absolute',
              right: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
              background: 'rgba(10,8,8,0.6)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: 'rgba(201,168,76,0.7)',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'monospace',
              fontSize: 16,
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = '#c9a84c';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(10,8,8,0.6)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(201,168,76,0.7)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.2)';
            }}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
