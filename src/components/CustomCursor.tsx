import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  const springConfig = { stiffness: 700, damping: 42, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Blade angles for 6-blade camera iris
  const bladeAngles = [0, 60, 120, 180, 240, 300];

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const el = e.target as HTMLElement;
      const isClickable = !!(
        el.closest('a') ||
        el.closest('button') ||
        el.closest('[role="button"]') ||
        el.closest('[data-cursor-hover]') ||
        el.tagName === 'A' ||
        el.tagName === 'BUTTON' ||
        el.tagName === 'INPUT' ||
        el.tagName === 'LABEL' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT'
      );
      setHovering(isClickable);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [mouseX, mouseY]);

  const size = clicking ? 38 : hovering ? 52 : 44;

  return (
    <motion.div
      className="pointer-events-none fixed z-[10000]"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      aria-hidden="true"
    >
      <motion.svg
        animate={{ width: size, height: size }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        viewBox="-24 -24 48 48"
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Outer lens ring — slowly rotating */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
          animate={{ rotate: 360 }}
          transition={{
            duration: hovering ? 1.5 : 9,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <circle
            cx="0"
            cy="0"
            r="20"
            stroke="#BCA88E"
            strokeWidth="0.8"
            strokeDasharray="5 3.5"
            fill="none"
            opacity={hovering ? 1 : 0.65}
          />
          {/* Tiny tick marks on the ring (lens markings) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={Math.cos(rad) * 17}
                y1={Math.sin(rad) * 17}
                x2={Math.cos(rad) * 20}
                y2={Math.sin(rad) * 20}
                stroke="#BCA88E"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}
        </motion.g>

        {/* 6 Iris aperture blades */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
          animate={{ rotate: hovering ? -30 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {bladeAngles.map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const innerR = hovering ? 2 : 4;
            const outerR = hovering ? 12 : 9;
            return (
              <line
                key={angle}
                x1={Math.cos(rad) * innerR}
                y1={Math.sin(rad) * innerR}
                x2={Math.cos(rad) * outerR}
                y2={Math.sin(rad) * outerR}
                stroke="#BCA88E"
                strokeWidth={hovering ? 1.5 : 1}
                opacity={hovering ? 0.9 : 0.4}
                strokeLinecap="round"
              />
            );
          })}
        </motion.g>

        {/* 4 Corner Viewfinder Brackets */}
        {/* Top-left */}
        <motion.path
          d="M-14,-8 L-14,-14 L-8,-14"
          stroke="#BCA88E"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ x: hovering ? -2 : 0, y: hovering ? -2 : 0, opacity: hovering ? 1 : 0.7 }}
          transition={{ duration: 0.2 }}
        />
        {/* Top-right */}
        <motion.path
          d="M14,-8 L14,-14 L8,-14"
          stroke="#BCA88E"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ x: hovering ? 2 : 0, y: hovering ? -2 : 0, opacity: hovering ? 1 : 0.7 }}
          transition={{ duration: 0.2 }}
        />
        {/* Bottom-left */}
        <motion.path
          d="M-14,8 L-14,14 L-8,14"
          stroke="#BCA88E"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ x: hovering ? -2 : 0, y: hovering ? 2 : 0, opacity: hovering ? 1 : 0.7 }}
          transition={{ duration: 0.2 }}
        />
        {/* Bottom-right */}
        <motion.path
          d="M14,8 L14,14 L8,14"
          stroke="#BCA88E"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ x: hovering ? 2 : 0, y: hovering ? 2 : 0, opacity: hovering ? 1 : 0.7 }}
          transition={{ duration: 0.2 }}
        />

        {/* Center dot with glow ring */}
        <motion.circle
          cx="0"
          cy="0"
          r={2}
          animate={{ r: clicking ? 1.5 : hovering ? 3.5 : 2 }}
          transition={{ duration: 0.15 }}
          fill="#BCA88E"
          opacity="0.95"
        />

        {/* Hover glow ring */}
        {hovering && (
          <motion.circle
            cx="0"
            cy="0"
            r="6"
            stroke="#BCA88E"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.svg>
    </motion.div>
  );
}
