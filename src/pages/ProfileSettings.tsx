import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Nav from '../components/Nav';

// ─── Design tokens ────────────────────────────────────────────────
const C = {
  bg:         '#090A0D',
  surface:    '#0E1018',
  surfaceAlt: '#13151E',
  border:     'rgba(188,168,142,0.10)',
  borderHov:  'rgba(188,168,142,0.28)',
  gold:       '#BCA88E',
  goldDim:    'rgba(188,168,142,0.55)',
  goldFaint:  'rgba(188,168,142,0.06)',
  text:       '#EDE8DF',
  textDim:    'rgba(237,232,223,0.45)',
  textMuted:  'rgba(237,232,223,0.25)',
  red:        '#e05555',
  redFaint:   'rgba(224,85,85,0.06)',
  success:    'rgba(100,200,140,0.9)',
  error:      'rgba(224,85,85,0.95)',
};

const F = {
  display: '"Playfair Display", Georgia, serif',
  ui:      '"Montserrat", system-ui, sans-serif',
  mono:    '"Courier New", Courier, monospace',
};

// ─── Sub-components ───────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: F.ui, fontSize: 9, fontWeight: 700, letterSpacing: 3,
      color: C.gold, opacity: 0.75, marginBottom: 7, textTransform: 'uppercase',
    }}>{children}</div>
  );
}

function TextField({
  label, value, onChange, disabled = false, placeholder = '', type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void;
  disabled?: boolean; placeholder?: string; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: disabled ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.28)',
          border: `1px solid ${focused ? C.gold : C.border}`,
          padding: '11px 14px',
          fontFamily: F.mono,
          fontSize: 13,
          color: disabled ? C.textMuted : C.text,
          outline: 'none',
          transition: 'border-color 0.22s ease',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text',
          borderRadius: 2,
        }}
      />
    </div>
  );
}

function GoldButton({
  onClick, children, variant = 'outline', disabled = false, loading = false, fullWidth = false,
}: {
  onClick: () => void; children: React.ReactNode;
  variant?: 'outline' | 'solid' | 'ghost' | 'danger';
  disabled?: boolean; loading?: boolean; fullWidth?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const isOff = disabled || loading;
  const color = variant === 'danger' ? C.red : C.gold;

  const bg = isOff ? 'transparent'
    : hov && variant === 'solid'   ? C.gold
    : hov && variant === 'outline' ? 'rgba(188,168,142,0.10)'
    : hov && variant === 'danger'  ? 'rgba(224,85,85,0.10)'
    : 'transparent';

  const textColor = isOff ? (variant === 'danger' ? 'rgba(224,85,85,0.3)' : C.goldDim)
    : hov && variant === 'solid' ? '#0A0A0D'
    : color;

  return (
    <motion.button
      whileHover={{ scale: isOff ? 1 : 1.015 }}
      whileTap={{ scale: isOff ? 1 : 0.985 }}
      onClick={() => !isOff && onClick()}
      disabled={isOff}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: bg,
        border: `1px solid ${isOff ? (variant === 'danger' ? 'rgba(224,85,85,0.18)' : 'rgba(188,168,142,0.16)') : color}`,
        color: textColor,
        padding: '11px 28px',
        fontFamily: F.ui,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 4,
        cursor: isOff ? 'not-allowed' : 'pointer',
        transition: 'all 0.22s ease',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : 'auto',
        borderRadius: 2,
        minWidth: 130,
      }}>
      {loading && (
        <span style={{
          width: 10, height: 10, border: `1.5px solid ${color}`,
          borderTopColor: 'transparent', borderRadius: '50%',
          display: 'inline-block', animation: 'spin 0.65s linear infinite',
        }}/>
      )}
      {children}
    </motion.button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: C.surfaceAlt,
      border: `1px solid ${C.border}`,
      padding: '18px 20px',
      borderRadius: 4,
      flex: 1,
      minWidth: 120,
    }}>
      <div style={{ fontFamily: F.ui, fontSize: 8, letterSpacing: 3, color: C.goldDim, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: F.mono, fontSize: 18, color: C.gold, letterSpacing: 2 }}>{value}</div>
      {sub && <div style={{ fontFamily: F.ui, fontSize: 8, color: C.textMuted, marginTop: 4, letterSpacing: 1 }}>{sub}</div>}
    </div>
  );
}

function SectionCard({ title, number, children }: { title: string; number: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(0,0,0,0.2)',
      }}>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.goldDim, letterSpacing: 2 }}>{number}</span>
        <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 3, textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ padding: '28px 24px' }}>{children}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const clean = role.toLowerCase() === 'amplifier' ? 'MEMBER' : role.toUpperCase();
  const color = clean === 'ADMIN' ? '#c9a84c' : clean === 'WRITER' ? '#7eb8d4' : C.gold;
  return (
    <span style={{
      fontFamily: F.ui, fontSize: 8, fontWeight: 700, letterSpacing: 2,
      color, border: `1px solid ${color}30`, background: `${color}10`,
      padding: '3px 10px', borderRadius: 2, whiteSpace: 'nowrap',
    }}>{clean}</span>
  );
}

type TabId = 'identity' | 'production' | 'account';

// Derive a deterministic fallback SUPR ID from user UUID (matches AuthContext logic)
function deriveFallbackId(uid: string): string {
  const clean = uid.replace(/-/g, '');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  return `SUPR-${((hash % 90000) + 10000).toString().padStart(5, '0')}`;
}

// ─── Main component ───────────────────────────────────────────────

export default function ProfileSettings() {
  const { user, profile, refreshProfile, signOut, displayName } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/auth', { replace: true });
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState<TabId>('identity');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const [fullName, setFullName]         = useState('');
  const [age, setAge]                   = useState('');
  const [phone, setPhone]               = useState('');
  const [niche, setNiche]               = useState('');
  const [skills, setSkills]             = useState('');
  const [experience, setExperience]     = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [contact, setContact]           = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [avatarUrl, setAvatarUrl]       = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProfileId = useRef<string | null>(null);

  // Initialize form — re-runs when a NEW profile id is detected (handles remount & first load)
  useEffect(() => {
    if (!profile || profile.id === lastProfileId.current) return;
    lastProfileId.current = profile.id;
    setFullName(profile.full_name || displayName || '');
    setAvatarUrl(profile.avatar_url || '');
    setAge(profile.age != null ? String(profile.age) : '');
    setPhone(profile.phone || '');
    setNiche(profile.niche || '');
    setSkills(profile.skills ? profile.skills.join(', ') : '');
    setExperience(profile.experience || '');
    setPortfolioUrl(profile.portfolio_url || '');
    setContact(profile.contact || '');
    setSocialHandle(profile.social_handle || '');
    setImgError(false);
  }, [profile, displayName]);

  // Safe async sync: fill empty fields if profile updates after initial render
  useEffect(() => {
    if (!profile) return;
    if (!avatarUrl && profile.avatar_url) { setAvatarUrl(profile.avatar_url); setImgError(false); }
    if (!fullName && profile.full_name) setFullName(profile.full_name);
  }, [profile?.avatar_url, profile?.full_name]); // eslint-disable-line

  // Retry loading profile if it wasn't loaded when this page mounted
  const profileRetried = useRef(false);
  useEffect(() => {
    if (!profile && user && !profileRetried.current) {
      profileRetried.current = true;
      refreshProfile(user.id);
    }
  }, [profile, user, refreshProfile]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ── DB save ────────────────────────────────────────────────────
  const persistToDb = async (fields: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    if (!user) throw new Error('No active session.');
    const payload: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };

    // Ensure auth session is fresh before hitting DB (fixes stale JWT → RLS blocks)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      // Try to refresh the session
      const { error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr) {
        console.error('[ProfileSettings] Session refresh failed:', refreshErr);
        throw new Error('Session expired — please sign in again.');
      }
    }

    console.log('[ProfileSettings] Saving to DB:', Object.keys(payload));

    const { data, error, status } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single();

    console.log('[ProfileSettings] Save response — status:', status, 'error:', error, 'hasData:', !!data);

    if (error) throw new Error(`Save Error: ${error.message}`);
    if (!data) throw new Error('Save returned no data — your session may have expired. Try refreshing.');
    return data;
  };

  // ── Avatar upload ──────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      setImgError(false);
      await persistToDb({ avatar_url: publicUrl });
      await refreshProfile(user.id);
      showToast('PHOTO UPDATED', 'success');
    } catch (err: unknown) {
      console.error('[ProfileSettings] Upload error:', err);
      showToast(err instanceof Error ? err.message : 'UPLOAD FAILED', 'error');
    } finally {
      setUploading(false);
    }
  };

  // ── Save all profile fields ────────────────────────────────────
  const handleSave = async () => {
    if (!user) { showToast('SESSION EXPIRED', 'error'); return; }
    const changes = {
      full_name:     fullName.trim() || 'Anonymous Creator',
      age:           age === '' ? null : parseInt(age, 10),
      phone:         phone.trim(),
      avatar_url:    avatarUrl,
      niche:         niche.trim(),
      skills:        skills.split(',').map(s => s.trim()).filter(Boolean),
      experience:    experience.trim(),
      portfolio_url: portfolioUrl.trim(),
      contact:       contact.trim(),
      social_handle: socialHandle.trim(),
    };
    setSaving(true);
    try {
      await persistToDb(changes);
      // Sync name/avatar to auth metadata (best-effort)
      const metaChanges: Record<string, string> = {};
      if (changes.full_name)  metaChanges.full_name  = changes.full_name;
      if (changes.avatar_url) metaChanges.avatar_url = changes.avatar_url;
      if (Object.keys(metaChanges).length > 0) {
        try { await supabase.auth.updateUser({ data: metaChanges }); }
        catch (e) { console.warn('Auth metadata sync failed:', e); }
      }
      // Refresh profile in context so Nav etc. update
      await refreshProfile(user.id);
      showToast('PROFILE SAVED', 'success');
    } catch (err: unknown) {
      console.error('[ProfileSettings] Save error:', err);
      showToast(err instanceof Error ? err.message : 'SAVE FAILED', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) throw error;
      showToast('RESET LINK SENT TO ' + user.email, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'FAILED', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').delete().eq('id', user.id);
      await signOut();
      window.location.href = '/auth';
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'DELETE FAILED', 'error');
      setSaving(false);
    }
  };

  // ── Derived display values ─────────────────────────────────────
  const emailStr   = user?.email || 'member@cinema.com';
  const sampleIdx  = (emailStr.charCodeAt(0) + (emailStr.charCodeAt(1) || 0)) % 6 + 1;
  const fallback   = `/Sample${sampleIdx}.webp`;
  const avatarDisp = (!imgError && avatarUrl) ? avatarUrl : fallback;

  const rawId     = profile?.st_id || '';
  const displayId = rawId ? (rawId.startsWith('SUPR-') ? rawId : `SUPR-${rawId}`) : (user ? deriveFallbackId(user.id) : '—');
  const primaryRole = (profile?.roles?.[0] || profile?.role || 'MEMBER');
  const cleanRole   = primaryRole.toLowerCase() === 'amplifier' ? 'MEMBER' : primaryRole.toUpperCase();
  const allRoles    = Array.from(new Set([...(profile?.roles || []), profile?.role].filter(Boolean) as string[]));

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
    : '—';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'identity',   label: 'IDENTITY'   },
    { id: 'production', label: 'PRODUCTION' },
    { id: 'account',    label: 'ACCOUNT'    },
  ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(188,168,142,0.25) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(188,168,142,0.15); border-radius: 2px; }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}
      >
        <Nav scrolled={true} />

        <div style={{ maxWidth: 1200, margin: '0 auto', paddingTop: 110, paddingLeft: 'clamp(16px,4vw,48px)', paddingRight: 'clamp(16px,4vw,48px)' }}>

          {/* ═══ IDENTITY BANNER ══════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: 'clamp(20px,3vw,36px)',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(16px,3vw,32px)',
              flexWrap: 'wrap',
              position: 'relative',
              overflow: 'hidden',
            }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.5, pointerEvents: 'none' }}/>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 280, height: 280, background: 'radial-gradient(ellipse at top right, rgba(188,168,142,0.06) 0%, transparent 65%)', pointerEvents: 'none' }}/>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                title="Click to change photo"
                style={{
                  width: 'clamp(72px,10vw,96px)', height: 'clamp(72px,10vw,96px)',
                  borderRadius: '50%', overflow: 'hidden',
                  border: `2px solid ${C.border}`,
                  cursor: 'pointer', position: 'relative',
                  transition: 'border-color 0.25s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
              >
                <img
                  src={avatarDisp}
                  alt="Avatar"
                  onError={() => setImgError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: 20, height: 20, border: `2px solid ${C.gold}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.65s linear infinite' }}/>
                  </div>
                )}
              </div>
              {profile?.st_verified && (
                <div style={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: C.gold, border: `2px solid ${C.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: '#0A0A0D' }}>✓</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload}/>
            </div>

            {/* Identity text */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: F.ui, fontSize: 9, letterSpacing: 4, color: C.goldDim, marginBottom: 6 }}>
                SUPREME TALKIES — MEMBER PROFILE
              </div>
              <h1 style={{ fontFamily: F.display, fontSize: 'clamp(22px,4vw,38px)', color: C.text, fontStyle: 'italic', margin: '0 0 8px', lineHeight: 1.15 }}>
                {fullName || displayName || 'Member'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  fontFamily: F.mono, fontSize: 11, color: C.gold,
                  background: 'rgba(188,168,142,0.06)', border: `1px solid rgba(188,168,142,0.18)`,
                  padding: '4px 12px', letterSpacing: 3, borderRadius: 2,
                }}>
                  {displayId}
                </div>
                <RoleBadge role={cleanRole}/>
                {profile?.st_verified && (
                  <div style={{ fontFamily: F.ui, fontSize: 8, color: C.gold, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>✓</span> SUPR VERIFIED
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatCard label="Member Since" value={memberSince}/>
              <StatCard label="Streak" value={`${profile?.share_streak || 0}`} sub="DAYS"/>
              <StatCard label="Roles" value={`${Math.max(allRoles.length, 1)}`} sub="ACTIVE"/>
            </div>
          </motion.div>

          {/* ═══ TWO-COLUMN LAYOUT ════════════════════════════════ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'clamp(200px,22%,260px) 1fr',
            gap: 20,
            alignItems: 'start',
          }}>

            {/* ── Left sidebar ─────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ fontFamily: F.ui, fontSize: 8, letterSpacing: 3, color: C.goldDim }}>SETTINGS</div>
                </div>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '13px 16px',
                      background: activeTab === tab.id ? 'rgba(188,168,142,0.07)' : 'none',
                      border: 'none',
                      borderLeft: `2px solid ${activeTab === tab.id ? C.gold : 'transparent'}`,
                      fontFamily: F.ui, fontSize: 10, fontWeight: 700, letterSpacing: 3,
                      color: activeTab === tab.id ? C.gold : C.textDim,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      display: 'block',
                    }}
                    onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.background = 'rgba(188,168,142,0.04)'; }}
                    onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.background = 'none'; }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {allRoles.length > 0 && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: 16 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 8, letterSpacing: 3, color: C.goldDim, marginBottom: 12 }}>YOUR ROLES</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {allRoles.map(r => <RoleBadge key={r} role={r}/>)}
                  </div>
                </div>
              )}

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: 16 }}>
                <div style={{ fontFamily: F.ui, fontSize: 8, letterSpacing: 3, color: C.goldDim, marginBottom: 10 }}>SUPREME ID</div>
                <div style={{
                  fontFamily: F.mono, fontSize: 16, color: C.gold,
                  letterSpacing: 4, padding: '10px 12px',
                  background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(188,168,142,0.15)`,
                  textAlign: 'center', borderRadius: 2,
                }}>
                  {displayId}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 7, color: C.textMuted, letterSpacing: 1, marginTop: 8, textAlign: 'center' }}>
                  Permanent · Cannot be changed
                </div>
              </div>
            </motion.div>

            {/* ── Right content ─────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === 'identity' && (
                  <motion.div key="identity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    <SectionCard title="Personal Details" number="01">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <TextField label="Full Name" value={fullName} onChange={setFullName} placeholder="Your full name" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <TextField label="Supreme ID" value={displayId} onChange={() => {}} disabled placeholder="SUPR-XXXXX"/>
                          <div style={{ fontFamily: F.ui, fontSize: 8, color: C.textMuted, marginTop: 5, letterSpacing: 1 }}>
                            Auto-assigned at registration · Permanent · Unique to you
                          </div>
                        </div>
                        <TextField label="Age" value={age} onChange={setAge} type="number" placeholder="e.g. 23"/>
                        <TextField label="Phone" value={phone} onChange={setPhone} placeholder="+91 XXXXXXXXXX"/>
                      </div>
                      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                        <GoldButton onClick={handleSave} loading={saving} disabled={uploading} variant="solid">
                          SAVE DETAILS
                        </GoldButton>
                      </div>
                    </SectionCard>

                    <SectionCard title="Avatar" number="02">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${C.border}`, flexShrink: 0 }}>
                          <img src={avatarDisp} alt="Current avatar" onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: F.ui, fontSize: 10, color: C.text, marginBottom: 6 }}>Profile Photo</div>
                          <div style={{ fontFamily: F.ui, fontSize: 9, color: C.textMuted, marginBottom: 14, lineHeight: 1.6 }}>
                            Upload a new photo or sign in with Google to auto-sync your avatar.
                            Accepted: JPG, PNG, WEBP · Max 5MB
                          </div>
                          <GoldButton onClick={() => fileInputRef.current?.click()} loading={uploading} disabled={saving} variant="outline">
                            {uploading ? 'UPLOADING…' : 'CHANGE PHOTO'}
                          </GoldButton>
                        </div>
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {activeTab === 'production' && (
                  <motion.div key="production" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                    <SectionCard title="Production Profile" number="03">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <TextField label="Specialization / Niche" value={niche} onChange={setNiche} placeholder="e.g. Cinematographer, Director, Writer"/>
                        <TextField label="Key Skills (comma separated)" value={skills} onChange={setSkills} placeholder="e.g. Editing, Color Grading, Scripting"/>
                        <TextField label="Experience Level / Bio" value={experience} onChange={setExperience} placeholder="e.g. 5+ Years · Feature Film Focus"/>
                        <TextField label="Portfolio / Website URL" value={portfolioUrl} onChange={setPortfolioUrl} placeholder="https://mywork.com"/>
                        <TextField label="Contact Email" value={contact} onChange={setContact} placeholder="work@domain.com"/>
                        <TextField label="Social Handle" value={socialHandle} onChange={setSocialHandle} placeholder="@instagram_handle"/>
                      </div>
                      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                        <GoldButton onClick={handleSave} loading={saving} disabled={uploading} variant="solid">
                          SAVE PRODUCTION DETAILS
                        </GoldButton>
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {activeTab === 'account' && (
                  <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    <SectionCard title="Login & Security" number="04">
                      <div style={{ marginBottom: 24 }}>
                        <TextField label="Email Address" value={user?.email || ''} onChange={() => {}} disabled/>
                        <button
                          onClick={() => window.location.href = `mailto:support@supremetalkies.com?subject=Email Change Request: ${profile?.full_name || ''}`}
                          style={{ marginTop: 8, background: 'none', border: 'none', color: C.goldDim, fontFamily: F.ui, fontSize: 9, letterSpacing: 2, cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                          onMouseLeave={e => (e.currentTarget.style.color = C.goldDim)}>
                          REQUEST EMAIL CHANGE ↗
                        </button>
                      </div>
                      <GoldButton onClick={handleResetPassword} disabled={saving || uploading} variant="outline">
                        SEND RESET LINK
                      </GoldButton>
                    </SectionCard>

                    <SectionCard title="Danger Zone" number="05">
                      <div style={{ background: C.redFaint, border: `1px solid rgba(224,85,85,0.14)`, borderRadius: 3, padding: '20px 22px' }}>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: C.red, letterSpacing: 2, marginBottom: 8 }}>Permanent Account Deletion</div>
                        <p style={{ fontFamily: F.ui, fontSize: 10, color: C.textDim, lineHeight: 1.7, margin: '0 0 20px', letterSpacing: 0.5 }}>
                          This is irreversible. Your profile, credentials, and all associated data will be permanently destroyed. This action cannot be undone.
                        </p>
                        <GoldButton variant="danger" onClick={() => setShowDeleteModal(true)} disabled={saving || uploading}>
                          DELETE MY ACCOUNT
                        </GoldButton>
                      </div>
                    </SectionCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* ═══ DELETE MODAL ═══════════════════════════════════════ */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <motion.div
                initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
                style={{ background: '#0C0D11', border: `1px solid rgba(224,85,85,0.25)`, padding: 'clamp(28px,5vw,52px)', maxWidth: 460, width: '100%', borderRadius: 4 }}>
                <div style={{ fontFamily: F.ui, fontSize: 8, letterSpacing: 4, color: C.red, opacity: 0.7, marginBottom: 14 }}>IRREVERSIBLE ACTION</div>
                <h2 style={{ fontFamily: F.display, fontSize: 28, color: C.red, margin: '0 0 16px', fontStyle: 'italic' }}>Delete Account</h2>
                <p style={{ fontFamily: F.ui, fontSize: 11, color: C.textDim, lineHeight: 1.7, marginBottom: 32 }}>
                  All your data — profile, SUPR ID, roles, submissions, and history — will be permanently erased. This cannot be undone.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <GoldButton variant="danger" onClick={handleDeleteAccount} loading={saving} fullWidth>
                    YES, DELETE EVERYTHING
                  </GoldButton>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    style={{ background: 'none', border: 'none', color: C.textDim, fontFamily: F.ui, fontSize: 9, letterSpacing: 4, cursor: 'pointer', padding: '10px 0', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.textDim)}>
                    CANCEL
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ TOAST ══════════════════════════════════════════════ */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.message + toast.type}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              style={{
                position: 'fixed', bottom: 32, right: 32,
                background: toast.type === 'success' ? C.success : C.error,
                color: '#0A0A0D',
                padding: '13px 24px',
                fontFamily: F.ui,
                fontSize: 10, fontWeight: 700, letterSpacing: 3,
                zIndex: 10001,
                borderRadius: 3,
                boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span>{toast.type === 'success' ? '✓' : '✕'}</span>
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}