import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Nav from '../components/Nav';

const ROLE_LOGOS: Record<string, string> = {
  writer:     '/logo1.webp',
  technician: '/logo2.webp',
  producer:   '/logo3.webp',
  presenter:  '/logo4.webp',
  marketing:  '/logo5.webp',
  amplifier:  '/logo6.webp',
};

const ROLES = [
  {
    id: 'writer',
    label: 'WRITER',
    scene: 'SC·01',
    description: 'For screenwriters and storytellers',
    line: 'Where blank pages become universes.',
    features: ['Submit scripts with DNA tagging', 'Version history & revisions', 'Writing challenges & prompts', 'Inspiration pinboard'],
  },
  {
    id: 'technician',
    label: 'TECHNICIAN',
    scene: 'SC·02',
    description: 'For crew & technical artists',
    line: 'The architects of cinematic reality.',
    features: ['Crew card & showreel', 'Availability toggle', 'Collaboration requests', 'Connect with other crew'],
  },
  {
    id: 'producer',
    label: 'PRODUCER',
    scene: 'SC·03',
    description: 'For producers & financiers',
    line: 'Manifesting vision into tangible form.',
    features: ['Browse accepted scripts', 'Post film briefs', 'View crew roster', 'Express interest in projects'],
  },
  {
    id: 'presenter',
    label: 'PRESENTER',
    scene: 'SC·04',
    description: 'For hosts, anchors & on-screen talent',
    line: 'The singular eye that captures soul.',
    features: ['Submit screening proposals', 'Countdown to your next screening', 'Reach report & analytics', 'Audience reaction feed'],
  },
  {
    id: 'marketing',
    label: 'MARKETING',
    scene: 'SC·05',
    description: 'For promoters & content strategists',
    line: 'The bridge between story and world.',
    features: ['Launch & manage campaigns', 'Submit collab briefs', 'Track reach metrics'],
  },
  {
    id: 'amplifier',
    label: 'MEMBER',          // Public label is "MEMBER"
    scene: 'SC·06',
    description: 'For fans, supporters & community',
    line: 'Voices that echo in the silence.',
    features: ['Log daily shares for streak', 'Shoutout wall', 'Early access perks'],
  },
];

function VF() {
  const corners = [
    { top: 8,    left: 8,   d: 'M0,0 L0,12 M0,0 L12,0' },
    { top: 8,    right: 8,  d: 'M18,0 L18,12 M6,0 L18,0' },
    { bottom: 8, left: 8,   d: 'M0,18 L0,6 M0,18 L12,18' },
    { bottom: 8, right: 8,  d: 'M18,18 L18,6 M6,18 L18,18' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {corners.map((c, i) => (
        <svg key={i} style={{ position: 'absolute', top: (c as any).top, bottom: (c as any).bottom, left: (c as any).left, right: (c as any).right }}
          width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d={c.d} stroke="#BCA88E" strokeWidth="1.8" />
        </svg>
      ))}
    </div>
  );
}

function RoleCard({
  role, onConfirm, loading, isSelected, isExisting,
}: {
  role: typeof ROLES[0]; onConfirm: () => void; loading: boolean; isSelected: boolean; isExisting: boolean;
}) {
  const [hov, setHov] = useState(false);
  const active = hov || isSelected;

  return (
    <motion.div
      onClick={onConfirm}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      animate={{
        backgroundColor: active ? 'rgba(188,168,142,0.08)' : 'rgba(10,11,14,0.4)',
        borderColor: isSelected ? 'rgba(188,168,142,0.7)' : active ? 'rgba(188,168,142,0.4)' : 'rgba(188,168,142,0.08)',
      }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'relative', overflow: 'hidden', cursor: 'pointer', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px', border: '1px solid', backdropFilter: 'blur(8px)',
      }}
    >
      <VF />

      {/* Status Indicators */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', gap: 8 }}>
        {isExisting && (
          <span style={{ fontFamily: 'Inter, monospace', fontSize: 8, color: '#F0EBE0', background: 'rgba(188,168,142,0.3)', border: '1px solid rgba(188,168,142,0.5)', padding: '2px 8px', letterSpacing: 2 }}>
            IN CREW
          </span>
        )}
        {isSelected && !isExisting && (
          <span style={{ fontFamily: 'Inter, monospace', fontSize: 8, color: '#BCA88E', background: 'rgba(188,168,142,0.15)', border: '1px solid #BCA88E', padding: '2px 8px', letterSpacing: 2 }}>
            SELECTED
          </span>
        )}
      </div>

      <motion.div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <motion.img src={ROLE_LOGOS[role.id]} alt=""
          animate={{ scale: active ? 1.15 : 1, opacity: active ? 0.35 : 0.15, filter: active ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.6)' }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'screen', opacity: 0.2 }}
        />
      </motion.div>

      <motion.span animate={{ opacity: active ? 1 : 0.4, y: active ? 0 : 5 }}
        style={{ position: 'absolute', top: 24, right: 28, zIndex: 10, fontFamily: 'Inter, monospace', fontSize: 10, fontWeight: 700, color: '#BCA88E', letterSpacing: 5 }}
      >
        {role.scene}
      </motion.span>

      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 32, height: 32, border: '2px solid rgba(188,168,142,0.2)', borderTopColor: '#BCA88E', borderRadius: '50%' }} />
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, fontWeight: 700, color: '#BCA88E', letterSpacing: 6 }}>ROLLING...</p>
            </motion.div>
          ) : (
            <motion.div key={active ? 'active' : 'normal'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 4, margin: '0 0 8px' }}>
                {role.description}
              </p>
              <h2 style={{
                fontFamily: '"Impact Std Regular", Impact, sans-serif',
                fontSize: 'clamp(32px, 3.5vw, 52px)',
                color: active ? '#BCA88E' : '#F0EBE0',
                letterSpacing: 2, margin: 0, lineHeight: 0.9,
                textTransform: 'uppercase',
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}>
                {isSelected && !loading ? (isExisting ? 'ENTER DASHBOARD' : 'CONFIRM CALL') : role.label}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p animate={{ opacity: active ? 1 : 0.4, y: active ? 0 : 5 }}
          style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, color: '#BCA88E', fontStyle: 'italic', margin: 0, maxWidth: 280, lineHeight: 1.6 }}
        >
          "{role.line}"
        </motion.p>

        {/* Feature list on hover */}
        <AnimatePresence>
          {active && !loading && (
            <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.3 }}
              style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              {role.features.map(f => (
                <li key={f} style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#F0EBE0', opacity: 0.7, letterSpacing: 1 }}>
                  ✦ {f}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div style={{ position: 'absolute', bottom: 24, left: 28, zIndex: 5 }}>
        <div style={{ width: 24, height: 1, background: '#BCA88E', opacity: 0.3 }} />
      </div>
    </motion.div>
  );
}

function FilmReel() {
  return (
    <motion.svg width="56" height="56" viewBox="0 0 160 160" fill="none"
      animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      style={{ opacity: 0.2, marginBottom: 20 }}
    >
      <circle cx="80" cy="80" r="76" stroke="#BCA88E" strokeWidth="2" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <circle key={i} cx={80 + 68 * Math.cos(a)} cy={80 + 68 * Math.sin(a)} r="7" stroke="#BCA88E" strokeWidth="2" />;
      })}
      <circle cx="80" cy="80" r="28" stroke="#BCA88E" strokeWidth="1.5" />
      <circle cx="80" cy="80" r="9" fill="#BCA88E" opacity="0.4" />
    </motion.svg>
  );
}

export default function RoleSelection() {
  const { user, profile, refreshProfile, displayName } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  // Session guard
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const existingRoles: string[] = useMemo(() => (
    (profile?.roles && Array.isArray(profile.roles) && profile.roles.length > 0)
      ? profile.roles.map(r => r.toLowerCase())
      : (profile?.role ? [profile.role.toLowerCase()] : [])
  ), [profile?.roles, profile?.role]);

  const [loading, setLoading]         = useState(false);
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null);
  // "pending" selection state — user clicks once to preview, second click confirms
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const handleConfirm = async (roleId: string) => {
    if (!roleId || loading || !user) return;

    // If it's already an existing role, just navigate
    if (existingRoles.includes(roleId)) {
      navigate('/dashboard', { state: { activeRole: roleId }, replace: true });
      return;
    }

    // First click: show preview / selected state. Second click: save.
    if (pendingRole !== roleId) {
      setPendingRole(roleId);
      return;
    }

    // Second click — commit
    const id = roleId.toLowerCase();

    setLoading(true);
    try {
      setLastConfirmed(roleId);

      // Server-side RPC: whitelists which roles a user may self-assign and can
      // never grant 'admin'. Replaces the old raw `.update({ role, roles })`,
      // which had no protection against a client sending role: 'admin' directly.
      const { error: rpcError } = await supabase.rpc('assign_role', { new_role: id });
      if (rpcError) throw rpcError;

      // avatar_symbol / full_name are ordinary, non-privileged columns — still fine
      // to update directly.
      const extraFields: Record<string, unknown> = {
        avatar_symbol: profile?.avatar_symbol || '🎬',
        updated_at: new Date().toISOString(),
      };
      if (!profile?.full_name || profile.full_name === 'Anonymous Creator') {
        extraFields.full_name = displayName || 'Anonymous Creator';
      }
      const { error: extraError } = await supabase
        .from('profiles')
        .update(extraFields)
        .eq('id', user.id);
      if (extraError) throw extraError;

      // Ensure profile is refreshed before navigating
      await refreshProfile(user.id);
      
      // Delay slightly to show success state if needed
      setTimeout(() => {
        navigate('/dashboard', { state: { activeRole: roleId }, replace: true });
      }, 500);
    } catch (e: unknown) {
      console.error('Role Selection Error:', e);
      toast(`CASTING ERROR: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
      setPendingRole(null);
    }
  };

  const greeting = `Welcome, ${displayName.charAt(0) + displayName.slice(1).toLowerCase().split(' ')[0]}.`;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      <Nav scrolled={true} />

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: "url('/hero-bg.webp')", backgroundSize: 'cover', backgroundPosition: 'center', transform: 'scale(1.06)', filter: 'blur(16px) brightness(0.14) saturate(0.35)' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,5,3,0.75)', zIndex: 1, pointerEvents: 'none' }} />
      <div className="film-grain" style={{ position: 'fixed', inset: 0, opacity: 0.09, zIndex: 2, pointerEvents: 'none' }} />

      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: isMobile ? 0 : -20, y: isMobile ? -20 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.7 }}
        style={{
          width: isMobile ? '100%' : 'clamp(300px, 24vw, 420px)',
          height: isMobile ? 'auto' : '100vh',
          flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(32px, 5vw, 64px)',
          paddingTop: isMobile ? '100px' : '90px',
          borderRight: isMobile ? 'none' : '1px solid rgba(188,168,142,0.12)',
          borderBottom: isMobile ? '1px solid rgba(188,168,142,0.12)' : 'none',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(32px)', zIndex: 10,
        }}
      >
        <FilmReel />
        <img src="/logo-main.webp" alt="Supreme Talkies" style={{ height: 48, width: 'auto', mixBlendMode: 'screen', filter: 'brightness(1.1) saturate(1.2)', marginBottom: 28 }} />
        <div style={{ width: 32, height: 1, background: '#BCA88E', opacity: 0.45, marginBottom: 14 }} />
        <h1 style={{ fontFamily: '"Impact Std Regular", Impact, sans-serif', fontSize: 'clamp(36px, 4vw, 64px)', color: '#BCA88E', lineHeight: 0.9, margin: '0 0 16px', letterSpacing: 1 }}>
          THE<br />CASTING<br />CALL.
        </h1>
        <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.3, letterSpacing: 5, margin: '0 0 8px', lineHeight: 2 }}>
          WHO YOU ARE<br />SHAPES WHAT YOU SEE.
        </p>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, color: '#BCA88E', opacity: 0.6, margin: '0 0 24px', letterSpacing: 1, fontStyle: 'italic' }}>
          {greeting}
        </p>

        {/* Existing roles hint */}
        {existingRoles.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: '0 0 10px' }}>YOUR CURRENT ROLES</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {existingRoles.filter(r => r !== 'admin').map(r => (
                <span key={r} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', border: '1px solid rgba(188,168,142,0.3)', padding: '3px 10px', letterSpacing: 2 }}>
                  {r === 'amplifier' ? 'MEMBER' : r.toUpperCase()}
                </span>
              ))}
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#F0EBE0', opacity: 0.4, margin: '12px 0 0', lineHeight: 1.5 }}>
              Select a new role to join the crew, or click an existing one to enter your dashboard.
            </p>
          </div>
        )}

        {existingRoles.length > 0 && (
          <button onClick={() => navigate('/dashboard')}
            style={{ marginTop: 32, background: 'none', border: '1px solid rgba(188,168,142,0.4)', color: '#BCA88E', padding: '10px 24px', fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 4, cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.3s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#BCA88E'; (e.currentTarget as HTMLElement).style.color = '#0e0f13'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#BCA88E'; }}
          >
            BACK TO DASHBOARD →
          </button>
        )}
      </motion.div>

      {/* Role Grid */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', zIndex: 5, paddingTop: isMobile ? 0 : '80px' }}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gridTemplateRows: isMobile ? 'repeat(6, 320px)' : 'repeat(2, 1fr)',
            height: isMobile ? 'auto' : '100%',
            gap: 1,
          }}
        >
          {ROLES.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onConfirm={() => handleConfirm(role.id)}
              loading={loading && lastConfirmed === role.id}
              isSelected={pendingRole === role.id || existingRoles.includes(role.id)}
              isExisting={existingRoles.includes(role.id)}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
