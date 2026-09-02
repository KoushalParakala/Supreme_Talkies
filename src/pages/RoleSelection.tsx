import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Nav from '../components/Nav';
import { roleColor, roleOnColor, type RoleColorId } from '../lib/roleColors';
import { useTheme } from '../context/ThemeContext';

const ROLE_LOGOS: Record<string, string> = {
  writer: '/logo1.webp',
  technician: '/logo2.webp',
  producer: '/logo3.webp',
  presenter: '/logo4.webp',
  marketing: '/logo5.webp',
  amplifier: '/logo6.webp',
};

const ROLES = [
  {
    id: 'writer',
    label: 'Writer',
    scene: '01',
    doLine: 'Write and submit scripts',
    getLine: 'Status updates + challenges',
  },
  {
    id: 'technician',
    label: 'Technician',
    scene: '02',
    doLine: 'Offer craft & crew skills',
    getLine: 'Collabs + open briefs',
  },
  {
    id: 'producer',
    label: 'Producer',
    scene: '03',
    doLine: 'Post briefs, back stories',
    getLine: 'Scripts + crew roster',
  },
  {
    id: 'presenter',
    label: 'Presenter',
    scene: '04',
    doLine: 'Propose community screenings',
    getLine: 'Approval status on each pitch',
  },
  {
    id: 'marketing',
    label: 'Marketer',
    scene: '05',
    doLine: 'Run campaigns & share kits',
    getLine: 'Reach logging + idea board',
  },
  {
    id: 'amplifier',
    label: 'Member',
    scene: '06',
    doLine: 'Share films, grow the audience',
    getLine: 'Streaks + shoutout wall',
  },
] as const;

function RoleCard({
  role, onConfirm, loading, isSelected, isExisting,
}: {
  role: (typeof ROLES)[number];
  onConfirm: () => void;
  loading: boolean;
  isSelected: boolean;
  isExisting: boolean;
}) {
  const { theme } = useTheme();
  const roleId = role.id as RoleColorId;
  return (
    <button
      type="button"
      onClick={onConfirm}
      className={`casting-card${isSelected ? ' is-selected' : ''}${isExisting ? ' is-existing' : ''}`}
      style={{
        ['--role-accent' as string]: roleColor(roleId, theme),
        ['--role-on' as string]: roleOnColor(roleId, theme),
      }}
    >
      <div className="casting-card-tags">
        {isExisting && <span>In crew</span>}
        {isSelected && !isExisting && <span>Selected · tap again</span>}
      </div>
      <img className="casting-card-mark" src={ROLE_LOGOS[role.id]} alt="" />
      <div className="casting-card-copy">
        <p className="eyebrow">{role.scene}</p>
        {loading ? (
          <p className="casting-card-wait">Rolling…</p>
        ) : (
          <>
            <h2>{isSelected && !loading ? (isExisting ? 'Open dashboard' : 'Confirm role') : role.label}</h2>
            <p>Do: {role.doLine}</p>
            <p>Get: {role.getLine}</p>
          </>
        )}
      </div>
    </button>
  );
}

function FilmReel() {
  return (
    <motion.svg
      className="casting-reel"
      width="48"
      height="48"
      viewBox="0 0 160 160"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      aria-hidden="true"
    >
      <circle cx="80" cy="80" r="76" stroke="currentColor" strokeWidth="2" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <circle key={i} cx={80 + 68 * Math.cos(a)} cy={80 + 68 * Math.sin(a)} r="7" stroke="currentColor" strokeWidth="2" />;
      })}
      <circle cx="80" cy="80" r="28" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="80" cy="80" r="9" fill="currentColor" opacity="0.4" />
    </motion.svg>
  );
}

export default function RoleSelection() {
  const { user, profile, refreshProfile, displayName } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/auth', { replace: true });
  }, [user, navigate]);

  const existingRoles: string[] = useMemo(() => (
    (profile?.roles && Array.isArray(profile.roles) && profile.roles.length > 0)
      ? profile.roles.map((r) => r.toLowerCase())
      : (profile?.role ? [profile.role.toLowerCase()] : [])
  ), [profile?.roles, profile?.role]);

  const [loading, setLoading] = useState(false);
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const handleConfirm = async (roleId: string) => {
    if (!roleId || loading || !user) return;

    if (existingRoles.includes(roleId)) {
      navigate('/dashboard', { state: { activeRole: roleId }, replace: true });
      return;
    }

    if (pendingRole !== roleId) {
      setPendingRole(roleId);
      return;
    }

    const id = roleId.toLowerCase();
    setLoading(true);
    try {
      setLastConfirmed(roleId);
      const { error: rpcError } = await supabase.rpc('assign_role', { new_role: id });
      if (rpcError) throw rpcError;

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

      await refreshProfile(user.id);
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
  const shownRoles = existingRoles.filter((r) => r !== 'admin');

  return (
    <div className="site-page sub-page casting-page">
      <Nav scrolled={true} />
      <div className="casting-shell">
        <aside className="casting-intro">
          <FilmReel />
          <img className="casting-logo" src="/logo-main.webp" alt="" />
          <p className="eyebrow">WHO YOU ARE SHAPES WHAT YOU SEE</p>
          <h1>The<br /><em>casting call.</em></h1>
          <p className="casting-greeting">{greeting}</p>
          {shownRoles.length > 0 && (
            <div className="casting-current">
              <p className="eyebrow">Your current roles</p>
              <div className="casting-chips">
                {shownRoles.map((r) => (
                  <span
                    key={r}
                    style={{
                      ['--role-accent' as string]: roleColor((r === 'amplifier' ? 'amplifier' : r) as RoleColorId, theme),
                    }}
                  >
                    {r === 'amplifier' ? 'Member' : r}
                  </span>
                ))}
              </div>
              <p>Select a new role to join the crew, or tap one you already have to open that dashboard.</p>
            </div>
          )}
          {existingRoles.length > 0 && (
            <button type="button" className="text-link" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </button>
          )}
        </aside>
        <div className="casting-grid-wrap">
          <motion.div
            className="casting-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
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
    </div>
  );
}
