import { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import GlobalGrain from './components/GlobalGrain';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const FilmDetail = lazy(() => import('./pages/FilmDetail'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RoleSelection = lazy(() => import('./pages/RoleSelection'));
const CrewDirectory = lazy(() => import('./pages/CrewDirectory'));
const About = lazy(() => import('./pages/About'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const NotFound = lazy(() => import('./pages/NotFound'));

gsap.registerPlugin(ScrollTrigger);

/* Film burn flash overlay for route transitions */
function FilmBurn() {
  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(ellipse at center, #fff8e8 0%, #ffffff 40%, #BCA88E 70%, #000 100%)',
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: [0, 1, 0], transition: { duration: 0.5, times: [0, 0.3, 1] } }}
    />
  );
}

function App() {
  const location = useLocation();
  const lenisRef = useRef<Lenis | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    /* Also sync Framer Motion's internal scroll tracking */
    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      window.dispatchEvent(new CustomEvent('lenis-scroll', { detail: scroll }));
    });

    /* Handle programmatic scroll-to requests from other components */
    const handleScrollTo = (e: Event) => {
      const target = (e as CustomEvent<{ target: number }>).detail?.target ?? 0;
      lenis.scrollTo(target, { immediate: false });
    };
    window.addEventListener('lenis-scroll-to', handleScrollTo);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      window.removeEventListener('lenis-scroll-to', handleScrollTo);
      lenis.destroy();
    };
  }, []);

  // Reset scroll on route change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [location.pathname]);

  return (
    <>
      <GlobalGrain />
      <FilmBurn key={`burn-${location.pathname}`} />
      <Suspense fallback={
        <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 99998 }}>
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', letterSpacing: 8 }}>
            LOADING
          </motion.div>
        </div>
      }>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/film/:id" element={<FilmDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/role-select" element={
              <ProtectedRoute>
                <RoleSelection />
              </ProtectedRoute>
            } />
            <Route path="/crew" element={
              <ProtectedRoute>
                <CrewDirectory />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}

export default App;
