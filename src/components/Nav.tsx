import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { IconArrowUpRight, IconPlus, IconX } from './ReelIcons';
import { useFilms } from '../hooks/useFilms';

interface NavProps { scrolled: boolean }

function BrandLockup() {
  return (
    <Link
      to="/"
      className="brand-lockup"
      aria-label="Supreme Talkies — home"
      onClick={() => window.dispatchEvent(new CustomEvent('lenis-scroll-to', { detail: { target: 0 } }))}
    >
      <img src="/logo-main.webp" alt="" />
    </Link>
  );
}

function UserMenu() {
  const { user, profile, signOut, loading, displayName, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => { setImgError(false); }, [profile?.avatar_url]);

  if (loading || !user) return null;

  const emailStr = user.email || 'member@cinema.com';
  const sampleIdx = (emailStr.charCodeAt(0) + (emailStr.charCodeAt(1) || 0)) % 6 + 1;
  const fallbackAvatar = `/Sample${sampleIdx}.webp`;
  const avatarSrc = (!imgError && profile?.avatar_url) ? profile.avatar_url : fallbackAvatar;

  const handleLogout = async () => {
    setExiting(true);
    try { await signOut(); } catch (err) { console.error('Logout error:', err); }
    finally { navigate('/auth', { replace: true }); }
  };

  return (
    <div className="nav-user-menu" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="nav-user-btn" onClick={() => navigate('/profile')} aria-label="Account">
        <img className="nav-avatar" src={avatarSrc} alt="" onError={() => setImgError(true)} />
      </button>
      {open && (
        <div className="nav-user-drop">
          <div style={{ padding: '8px 16px 10px', fontSize: 10, letterSpacing: '.1em' }}>{displayName}</div>
          <button type="button" onClick={() => { navigate('/profile'); setOpen(false); }}>My profile</button>
          <button type="button" onClick={() => { navigate('/dashboard'); setOpen(false); }}>Dashboard</button>
          {isAdmin && <button type="button" onClick={() => { navigate('/crew'); setOpen(false); }}>Crew</button>}
          <button type="button" onClick={handleLogout} disabled={exiting}>{exiting ? 'Exiting…' : 'Sign out'}</button>
        </div>
      )}
    </div>
  );
}

export default function Nav({ scrolled }: NavProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { films } = useFilms();
  const [menu, setMenu] = useState(false);
  const docked = scrolled;
  const hasRoles = !!(profile?.roles?.length || profile?.role);
  const filmCount = String(films.length).padStart(2, '0');

  useEffect(() => { setMenu(false); }, [location.pathname]);

  const goHomeSection = (id: string) => {
    setMenu(false);
    if (location.pathname !== '/') navigate('/', { state: { scrollTo: id } });
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={`glass-nav ${docked ? 'docked' : ''}`}>
      <BrandLockup />
      <nav className={menu ? 'open' : ''}>
        <Link to="/films" onClick={() => setMenu(false)}>Films <small>{filmCount}</small></Link>
        <button type="button" onClick={() => goHomeSection('join-section')}>Members</button>
        <Link to="/about" onClick={() => setMenu(false)}>About</Link>
        {user && (
          <>
            <Link to="/dashboard" onClick={() => setMenu(false)}>Dashboard</Link>
            {isAdmin ? (
              <Link to="/crew" onClick={() => setMenu(false)}>Crew</Link>
            ) : (
              <Link to="/role-select" onClick={() => setMenu(false)}>{hasRoles ? 'Add role' : 'Roles'}</Link>
            )}
            <span className="nav-mobile-auth">
              <Link to="/profile" onClick={() => setMenu(false)}>Profile</Link>
            </span>
            <button
              type="button"
              className="nav-mobile-auth"
              onClick={() => { setMenu(false); signOut().then(() => navigate('/auth', { replace: true })); }}
            >
              Sign out
            </button>
          </>
        )}
      </nav>
      <div className="nav-actions">
        <span className="nav-status"><i /> LIVE REEL</span>
        {user ? (
          <>
            <NotificationBell />
            <UserMenu />
          </>
        ) : (
          <Link to="/auth" className="nav-join" onClick={() => setMenu(false)}>
            Join the room <IconArrowUpRight />
          </Link>
        )}
        <button className="mobile-menu" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close menu' : 'Open menu'}>
          {menu ? <IconX /> : <IconPlus />}
        </button>
      </div>
    </header>
  );
}
