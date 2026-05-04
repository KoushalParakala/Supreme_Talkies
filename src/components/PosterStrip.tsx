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
    }, 3000);
    return () => clearInterval(interval);
  }, [isInteracting]);

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
    
    // Snap back to zero
    animate(dragX, 0, { type: 'spring', stiffness: 60, damping: 20, mass: 1 });

    if (offset < -50 || velocity < -300) {
      nextPoster();
    } else if (offset > 50 || velocity > 300) {
      prevPoster();
    }
  };

  const getDistance = (index: number) => {
    const length = FILMS.length;
    const half = Math.floor(length / 2);
    let dist = index - currentIndex;
    if (dist > half) dist -= length;
    else if (dist < -half) dist += length;
    return dist;
  };

  return (
    <div 
      onMouseEnter={startInteraction}
      onMouseLeave={stopInteraction}
      style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '75vh' : '90vh',
        background: '#0a0a0a',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'pan-y'
      }}
    >
      {/* Softened Edge Gradients */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '12vw', background: 'linear-gradient(to right, #0a0a0a 0%, transparent 100%)', zIndex: 30, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '12vw', background: 'linear-gradient(to left, #0a0a0a 0%, transparent 100%)', zIndex: 30, pointerEvents: 'none' }} />

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
          justifyContent: 'center'
        }}
      >
        {FILMS.map((film, i) => {
          const dist = getDistance(i);
          const isCenter = dist === 0;
          const isLeft = dist === -1;
          const isRight = dist === 1;

          let x = '0%';
          let opacity = 1;
          let blur = 'blur(0px)';
          let brightness = 'brightness(1)';
          let zIndex = 10;
          let pointerEvents: any = 'auto';

          if (isCenter) {
            x = '0%';
            opacity = 1;
            blur = 'blur(0px)';
            brightness = 'brightness(1)';
            zIndex = 10;
          } else if (isLeft) {
            x = isMobile ? '-80%' : '-80%';
            opacity = 0.6;
            blur = 'blur(6px)';
            brightness = 'brightness(0.6)';
            zIndex = 5;
          } else if (isRight) {
            x = isMobile ? '80%' : '80%';
            opacity = 0.6;
            blur = 'blur(6px)';
            brightness = 'brightness(0.6)';
            zIndex = 5;
          } else {
            x = dist < 0 ? '-200%' : '200%';
            opacity = 0;
            blur = 'blur(20px)';
            brightness = 'brightness(0)';
            zIndex = 1;
            pointerEvents = 'none';
          }

          // prefer the dynamic poster_image field if added, otherwise use the legacy fallback logic for static scrolls
          const bgImage = (film as any).posterImage || `/scroll${i + 1}.webp`;

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
                filter: `${blur} ${brightness}`,
              }}
              transition={{
                type: 'spring',
                stiffness: 45,
                damping: 22
              }}
              style={{
                position: 'absolute',
                width: isMobile ? '90vw' : '75vw',
                height: '100%',
                zIndex,
                pointerEvents,
                cursor: isCenter ? 'pointer' : 'grab',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)'
              }}
              whileTap={{ cursor: 'grabbing' }}
            >
              <img 
                src={bgImage} 
                alt=""
                draggable={false}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
