import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Nav from '../components/Nav';
import ReelSection from '../components/ReelSection';
import JoinSection from '../components/JoinSection';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { IconArrowDown, IconMoveRight } from '../components/ReelIcons';

function usePageScroll() {
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const onLenis = (e: Event) => setScroll((e as CustomEvent<number>).detail);
    const onScroll = () => setScroll(window.scrollY);
    onScroll();
    window.addEventListener('lenis-scroll', onLenis);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('lenis-scroll', onLenis);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return scroll;
}

function Opening({ scroll }: { scroll: number }) {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();
  const p = Math.min(1, scroll / 180);
  const fade = Math.min(1, Math.max(0, (scroll - 50) / 100));
  return (
    <section className="opening">
      <div
        className="opening-wordmark"
        style={{
          transform: `translate(calc(-50% - ${p * 39}vw), calc(-50% - ${p * 40}vh)) scale(${1 - p * .8})`,
          opacity: Math.max(0, 1 - p * 1.15),
        }}
      >
        <span>SUPREME<br /><em>TALKIES</em></span>
      </div>
      <div className="opening-copy" style={{ opacity: fade, transform: `translateY(${(1 - fade) * 28}px)` }}>
        <p className="eyebrow">AN INDEPENDENT FILM COLLECTIVE / EST. 2025</p>
        <h1>Make a film.<br /><em>Find your people.</em></h1>
        {user ? (
          <p>Welcome back, {displayName.charAt(0) + displayName.slice(1).toLowerCase()}.</p>
        ) : (
          <p>Stories that demand to be told.</p>
        )}
        <a className="text-link light-link" href="#reel-section">Move through the work <IconArrowDown /></a>
        <button
          type="button"
          className="text-link light-link"
          style={{ display: 'block', marginTop: 18, background: 'none', border: 0, padding: 0 }}
          onClick={() => {
            if (user) navigate('/role-select');
            else document.getElementById('join-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {user ? 'View roles' : 'Join the reel'}
        </button>
      </div>
    </section>
  );
}

function AboutTeaser() {
  return (
    <section className="about-teaser">
      <div className="about-visual">
        <img src="/hero-bg.webp" alt="Supreme Talkies" />
        <span>THE COLLECTIVE / EST. 2025</span>
      </div>
      <div className="about-teaser-copy">
        <p className="eyebrow">03 / A NOTE FROM THE ROOM</p>
        <h2>Make it<br /><em>together.</em></h2>
        <p>
          Supreme Talkies is an independent film collective — a platform where writers craft stories worth telling,
          technicians bring visions to life, and audiences discover cinema that actually matters.
        </p>
        <Link to="/about" className="text-link">Meet the founders <IconMoveRight /></Link>
      </div>
    </section>
  );
}

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const scroll = usePageScroll();
  const targetFilmId = (location.state as { returnToFilm?: string } | null)?.returnToFilm;

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!scrollTo) return;
    const t = setTimeout(() => {
      const el = document.getElementById(scrollTo);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState({}, document.title);
    }, 300);
    return () => clearTimeout(t);
  }, [location.state]);

  const handleFilmClick = (id: string) => {
    navigate(`/film/${id}`, { state: { fromHome: true } });
  };

  return (
    <div className="site-page home-page">
      <Nav scrolled={scroll > 24} />
      <Opening scroll={scroll} />
      <main>
        <ReelSection onFilmClick={handleFilmClick} returnFilmId={targetFilmId} />
        <JoinSection />
        <AboutTeaser />
      </main>
      <Footer />
    </div>
  );
}
