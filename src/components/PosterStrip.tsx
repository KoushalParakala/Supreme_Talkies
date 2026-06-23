// Production Build: Seamless edge-blended cinematic poster strip
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
  const POSTER_W  = isMobile ? '80vw' : '45vw';
  const SIDE_OFFSET = isMobile ? '85vw' : '48vw';

  return (
    <div
      onMouseEnter={startInteraction}
      onMouseLeave={stopInteraction}
      style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '45vh' : '55vh',
        background: '#0a0808',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'pan-y',
      }}
    >
      {/* Smooth Edge Gradients to blend side posters into the background */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: isMobile ? '12vw' : '25vw',
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
          width: isMobile ? '12vw' : '25vw',
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

    </div>
  );
}
