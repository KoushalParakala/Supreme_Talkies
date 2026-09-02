import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
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

function UserMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, profile, signOut, loading, displayName, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [exiting, setExiting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setImgError(false); }, [profile?.avatar_url]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

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

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <div className="nav-user-menu" ref={rootRef}>
      <button
        type="button"
        className={`nav-bubble nav-bubble-avatar ${open ? 'is-open' : ''}`}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <img className="nav-avatar" src={avatarSrc} alt="" onError={() => setImgError(true)} />
      </button>
      {open && (
        <div className="nav-user-drop nav-tray" role="menu">
          <div className="nav-tray-label">{displayName}</div>
          <button type="button" role="menuitem" onClick={() => go('/profile')}>My profile</button>
          <button type="button" role="menuitem" onClick={() => go('/call-sheet')}>Call Sheet</button>
          <button type="button" role="menuitem" onClick={() => go('/green-room')}>Green Room</button>
          <button type="button" role="menuitem" onClick={() => go('/dashboard')}>Dashboard</button>
          {isAdmin && <button type="button" role="menuitem" onClick={() => go('/crew')}>Crew</button>}
          {isAdmin && <button type="button" role="menuitem" onClick={() => go('/green-room-desk')}>Floor Desk</button>}
          <button type="button" role="menuitem" onClick={handleLogout} disabled={exiting}>
            {exiting ? 'Exiting…' : 'Sign out'}
          </button>
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
  const [tray, setTray] = useState<'bell' | 'user' | null>(null);
  const docked = scrolled;
  const hasRoles = !!(profile?.roles?.length || profile?.role);
  const filmCount = String(films.length).padStart(2, '0');

  useEffect(() => {
    setMenu(false);
    setTray(null);
  }, [location.pathname]);

  const goHomeSection = (id: string) => {
    setMenu(false);
    if (location.pathname !== '/') navigate('/', { state: { scrollTo: id } });
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`nav-cluster ${docked ? 'docked' : ''}${tray ? ' is-split' : ''}`}>
      <header className={`glass-nav ${docked ? 'docked' : ''}`}>
        <BrandLockup />
        <nav className={menu ? 'open' : ''}>
          <Link to="/films" onClick={() => setMenu(false)}>Films <small>{filmCount}</small></Link>
          <button type="button" onClick={() => goHomeSection('join-section')}>Members</button>
          <Link to="/about" onClick={() => setMenu(false)}>About</Link>
          {user && (
            <>
              <Link to="/call-sheet" onClick={() => setMenu(false)}>Call Sheet</Link>
              <Link to="/green-room" onClick={() => setMenu(false)}>Green Room</Link>
              <Link to="/dashboard" onClick={() => setMenu(false)}>Dashboard</Link>
              {isAdmin ? (
                <>
                  <Link to="/crew" onClick={() => setMenu(false)}>Crew</Link>
                  <Link to="/green-room-desk" onClick={() => setMenu(false)}>Floor Desk</Link>
                </>
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
          {!user && (
            <Link to="/auth" className="nav-join" onClick={() => setMenu(false)}>
              Join the room <IconArrowUpRight />
            </Link>
          )}
          <button className="mobile-menu" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close menu' : 'Open menu'}>
            {menu ? <IconX /> : <IconPlus />}
          </button>
        </div>
      </header>
      <div className="nav-bubbles">
        <ThemeToggle />
        {user && (
          <>
            <NotificationBell
              open={tray === 'bell'}
              onOpenChange={(next) => setTray(next ? 'bell' : null)}
            />
            <UserMenu
              open={tray === 'user'}
              onOpenChange={(next) => setTray(next ? 'user' : null)}
            />
          </>
        )}
      </div>
    </div>
  );
}
