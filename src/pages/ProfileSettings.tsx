import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Nav from '../components/Nav';

function CinemaInput({
  label, value, onChange, type = 'text', disabled = false,
}: {
  label: string; value: string; onChange: (val: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', fontFamily: '"Montserrat", sans-serif', fontSize: 10, fontWeight: 700, color: '#BCA88E', letterSpacing: 3, marginBottom: 8, opacity: 0.8 }}>
        {label.toUpperCase()}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(188,168,142,0.2)',
          padding: '12px 16px',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: disabled ? 'rgba(240,235,224,0.4)' : '#F0EBE0',
          outline: 'none',
          transition: 'all 0.3s ease',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#BCA88E')}
        onBlur={(e) => (e.target.style.borderColor = 'rgba(188,168,142,0.2)')}
      />
    </div>
  );
}

function CinemaButton({
  onClick, children, variant = 'gold', disabled = false, loading = false,
}: {
  onClick: () => void; children: React.ReactNode; variant?: 'gold' | 'red'; disabled?: boolean; loading?: boolean;
}) {
  const color = variant === 'red' ? '#ff5050' : '#BCA88E';
  const [isHovered, setIsHovered] = useState(false);
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      onClick={() => !isDisabled && onClick()}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered && !isDisabled ? color : 'transparent',
        border: `1px solid ${isDisabled ? 'rgba(188,168,142,0.2)' : color}`,
        color: isHovered && !isDisabled ? '#0a0a0a' : (isDisabled ? 'rgba(188,168,142,0.3)' : color),
        padding: '13px 44px',
        fontFamily: '"Montserrat", sans-serif',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 5,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 200,
      }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, border: `2px solid ${color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          SAVING...
        </span>
      ) : children}
    </motion.button>
  );
}

// ─── Generate a SUPR-XXXXX id client-side ───────────────────────
function generateStId() {
  return `SUPR-${Math.floor(10000 + Math.random() * 90000)}`;
}

export default function ProfileSettings() {
  const { user, profile, refreshProfile } = useAuth();

  // Separate save-loading from upload-loading so they don't interfere
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form fields (local copies — initialised once from profile)
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  // avatarUrl is the *displayed* URL (can be a freshly-uploaded one before save)
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialise form from profile (runs once when profile first loads)
  const initialised = useRef(false);
  useEffect(() => {
    if (profile && !initialised.current) {
      initialised.current = true;
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setAge(profile.age ? profile.age.toString() : '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const assigningStIdRef = useRef(false);

  // Auto-assign SUPR ID immediately if the user has none yet
  useEffect(() => {
    if (user && profile && !profile.st_id && !assigningStIdRef.current) {
      assigningStIdRef.current = true;
      const newId = generateStId();
      supabase.from('profiles').update({ st_id: newId }).eq('id', user.id)
        .then(({ error }) => {
          if (!error) {
            refreshProfile(user.id);
          } else {
            console.error('Failed to auto-assign SUPR ID:', error);
            // reset ref if you want to retry later, but preventing infinite loop is priority
          }
        });
    }
  }, [user, profile, refreshProfile]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Core DB update (UPDATE, not upsert — safer with RLS) ───────
  const persistToDb = async (fields: Record<string, unknown>) => {
    if (!user) throw new Error('No active session.');

    const payload: Record<string, unknown> = {
      ...fields,
      updated_at: new Date().toISOString(),
    };

    // Assign SUPR ID on first save if missing
    if (!profile?.st_id) {
      payload.st_id = generateStId();
    }

    // Try UPDATE first and demand a return row. If no row exists, this will throw PGRST116.
    const { error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      // If the row doesn't exist yet, fall back to INSERT
      if (updateError.code === 'PGRST116' || updateError.message?.includes('no rows')) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, ...payload, avatar_symbol: '🎬', roles: ['member'], role: 'member' });
        if (insertError) throw new Error(`Insert Error: ${insertError.message}`);
      } else {
        throw new Error(`Update Error: ${updateError.message}`);
      }
    }
  };

  // ── Avatar upload ───────────────────────────────────────────────
  // Storage policy: bucket = 'avatars', path = '{userId}/{filename}'
  // so foldername()[1] === auth.uid() ✓
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Reset the input so the same file can be re-selected after an error
    e.target.value = '';

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      // Store under: {userId}/avatar-{timestamp}.{ext}
      // The folder IS the userId → matches the RLS policy
      const filePath = `${user.id}/avatar-${timestamp}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Persist immediately so the NavBar avatar also updates
      await persistToDb({ avatar_url: publicUrl });
      await refreshProfile(user.id);
      showToast('PHOTO UPDATED', 'success');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      showToast(err.message || 'UPLOAD FAILED', 'error');
    } finally {
      setUploading(false);
    }
  };

  // ── Save all changed fields ─────────────────────────────────────
  const handleSaveAll = async () => {
    if (!user) { showToast('SESSION EXPIRED', 'error'); return; }

    // Build diff — only fields that actually changed
    const changes: Record<string, any> = {};
    if (fullName.trim() !== (profile?.full_name || '')) changes.full_name = fullName.trim();
    if (age !== (profile?.age?.toString() || '')) changes.age = age === '' ? null : parseInt(age, 10);
    if (phone !== (profile?.phone || ''))              changes.phone      = phone;
    if (avatarUrl !== (profile?.avatar_url || ''))     changes.avatar_url = avatarUrl;

    if (Object.keys(changes).length === 0) {
      showToast('NO CHANGES DETECTED', 'success');
      return;
    }

    setSaving(true);
    try {
      await persistToDb(changes);

      // Sync name/avatar to Auth metadata (fire & forget)
      const metaChanges: Record<string, string> = {};
      if (changes.full_name)  metaChanges.full_name  = changes.full_name;
      if (changes.avatar_url) metaChanges.avatar_url = changes.avatar_url;
      if (Object.keys(metaChanges).length > 0) {
        try {
          await supabase.auth.updateUser({ data: metaChanges });
        } catch (e) {
          console.warn('Auth metadata sync failed:', e);
        }
      }

      // Refresh global profile → NavBar picks up the new name immediately
      await refreshProfile(user.id);
      showToast('PROFILE SAVED', 'success');
    } catch (err: any) {
      console.error('Profile save error:', err);
      showToast(err.message || 'SAVE FAILED — CHECK CONSOLE', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset password ──────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!user?.email) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) throw error;
      showToast('RESET LINK SENT', 'success');
    } catch (err: any) {
      showToast(err.message || 'FAILED', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete account ──────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (err: any) {
      showToast(err.message || 'DELETE FAILED', 'error');
      setSaving(false);
    }
  };

  // ── Derived display values ──────────────────────────────────────
  const emailStr = user?.email || 'member@cinema.com';
  const sampleIdx = (emailStr.charCodeAt(0) + (emailStr.charCodeAt(1) || 0)) % 6 + 1;
  const defaultAvatarSrc = `/Sample${sampleIdx}.webp`;
  const displayStId = profile?.st_id || '—';

  return (
    <>
      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}
      >
        <Nav scrolled={true} />

        <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 140, paddingLeft: 24, paddingRight: 24 }}>

          {/* ── Header ─────────────────────────────────────────── */}
          <header style={{ marginBottom: 60 }}>
            <span style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 8, fontWeight: 700, opacity: 0.8, display: 'block', marginBottom: 12 }}>
              PROFILE SETTINGS
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              {/* Avatar preview */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change photo"
                  style={{
                    width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                    border: '1px solid rgba(188,168,142,0.4)',
                    background: 'rgba(188,168,142,0.1)',
                    cursor: 'pointer', position: 'relative',
                  }}
                >
                  <img
                    src={avatarUrl || defaultAvatarSrc}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {uploading && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ width: 20, height: 20, border: '2px solid #BCA88E', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    </div>
                  )}
                </div>
                {/* Invisible file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>

              <div>
                <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(28px, 5vw, 40px)', color: '#F0EBE0', fontStyle: 'italic', margin: 0, marginBottom: 6 }}>
                  {fullName || profile?.full_name || 'Member'}
                </h1>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#BCA88E', opacity: 0.6, letterSpacing: 2 }}>
                  SUPREME ID — {displayStId}
                </span>
              </div>
            </div>
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2 }}
              style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, #BCA88E 0%, rgba(188,168,142,0.12) 80%, transparent 100%)', transformOrigin: 'left', marginTop: 24 }}
            />
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 32 }}>

            {/* ── 01 — PROFILE DETAILS ────────────────────────── */}
            <section style={{ background: 'rgba(30,32,41,0.5)', border: '1px solid rgba(188,168,142,0.12)', padding: 32 }}>
              <h2 style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 12, color: '#BCA88E', letterSpacing: 4, marginBottom: 8 }}>01 — PROFILE DETAILS</h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#F0EBE0', opacity: 0.35, letterSpacing: 1, marginBottom: 32 }}>
                Click your avatar above to change your photo.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <CinemaInput label="Full Name" value={fullName} onChange={setFullName} />
                </div>
                <CinemaInput label="Age" value={age} onChange={setAge} />
                <CinemaInput label="Phone" value={phone} onChange={setPhone} />
              </div>

              <CinemaButton onClick={handleSaveAll} loading={saving} disabled={uploading}>
                SAVE CHANGES
              </CinemaButton>
            </section>

            {/* ── 03 — EXPERIENCE & STATS ──────────────────────── */}
            <section style={{ background: 'rgba(30,32,41,0.5)', border: '1px solid rgba(188,168,142,0.12)', padding: 32 }}>
              <h2 style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 12, color: '#BCA88E', letterSpacing: 4, marginBottom: 32 }}>03 — EXPERIENCE</h2>

              <div style={{ marginBottom: 32 }}>
                <span style={{ display: 'block', fontFamily: '"Montserrat", sans-serif', fontSize: 10, fontWeight: 700, color: '#BCA88E', letterSpacing: 3, marginBottom: 12, opacity: 0.8 }}>SUPREME ID</span>
                <div style={{ fontFamily: 'monospace', fontSize: 22, letterSpacing: 6, color: '#BCA88E', border: '1px solid rgba(188,168,142,0.2)', padding: '16px 24px', background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                  {displayStId}
                </div>
              </div>

              {!!profile?.roles?.length && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
                  {profile.roles.map((role) => (
                    <span key={role} style={{ background: 'rgba(188,168,142,0.08)', border: '1px solid rgba(188,168,142,0.2)', padding: '6px 14px', fontSize: 9, color: '#BCA88E', letterSpacing: 2, fontFamily: '"Montserrat", sans-serif' }}>
                      {role.toLowerCase() === 'amplifier' ? 'MEMBER' : role.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#F0EBE0', opacity: 0.4, letterSpacing: 2, fontFamily: '"Montserrat", sans-serif' }}>MEMBER SINCE</span>
                  <span style={{ fontSize: 10, color: '#F0EBE0', letterSpacing: 2, fontFamily: '"Montserrat", sans-serif' }}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>

                {profile?.st_verified && (
                  <div style={{ background: 'rgba(188,168,142,0.1)', border: '1px solid #BCA88E', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#BCA88E' }}>✓</span>
                    <span style={{ fontSize: 10, color: '#BCA88E', letterSpacing: 4, fontWeight: 700, fontFamily: '"Montserrat", sans-serif' }}>SUPR VERIFIED</span>
                  </div>
                )}

                {(profile?.share_streak ?? 0) > 0 && (
                  <div style={{ color: '#BCA88E', fontSize: 10, letterSpacing: 4, fontWeight: 700, fontFamily: '"Montserrat", sans-serif' }}>
                    🔥 {profile?.share_streak} DAY STREAK
                  </div>
                )}
              </div>
            </section>

            {/* ── 04 — ACCOUNT ─────────────────────────────────── */}
            <section style={{ background: 'rgba(30,32,41,0.5)', border: '1px solid rgba(188,168,142,0.12)', padding: 32 }}>
              <h2 style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 12, color: '#BCA88E', letterSpacing: 4, marginBottom: 32 }}>04 — ACCOUNT</h2>

              <div style={{ marginBottom: 32 }}>
                <CinemaInput label="Email" value={user?.email || ''} onChange={() => {}} disabled={true} />
                <button
                  onClick={() => window.location.href = `mailto:support@supremetalkies.com?subject=Email Change Request: ${profile?.full_name || ''}`}
                  style={{ background: 'none', border: 'none', color: '#BCA88E', fontSize: 10, letterSpacing: 2, padding: 0, cursor: 'pointer', opacity: 0.7 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                >
                  REQUEST EMAIL CHANGE
                </button>
              </div>

              <div style={{ marginBottom: 48 }}>
                <CinemaButton onClick={handleResetPassword} disabled={saving || uploading}>
                  RESET PASSWORD
                </CinemaButton>
              </div>

              <div style={{ border: '1px solid rgba(255,80,80,0.2)', padding: 24, background: 'rgba(255,80,80,0.02)' }}>
                <h3 style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 9, color: '#ff5050', letterSpacing: 3, marginBottom: 16 }}>DANGER ZONE</h3>
                <CinemaButton variant="red" onClick={() => setShowDeleteModal(true)} disabled={saving || uploading}>
                  DELETE ACCOUNT
                </CinemaButton>
              </div>
            </section>
          </div>
        </div>

        {/* ── Delete Modal ────────────────────────────────────── */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                style={{ background: '#0a0a0a', border: '1px solid rgba(255,80,80,0.3)', padding: 48, maxWidth: 450, textAlign: 'center' }}
              >
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, color: '#ff5050', marginBottom: 16 }}>PERMANENT DELETION</h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.7, lineHeight: 1.6, marginBottom: 32 }}>
                  This action is irreversible. All your data and access will be permanently destroyed.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CinemaButton variant="red" onClick={handleDeleteAccount} loading={saving}>
                    YES, DELETE EVERYTHING
                  </CinemaButton>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    style={{ background: 'none', border: 'none', color: '#F0EBE0', fontSize: 10, letterSpacing: 4, opacity: 0.5, cursor: 'pointer', marginTop: 12 }}
                  >
                    CANCEL
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Toast ───────────────────────────────────────────── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.message}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              style={{
                position: 'fixed', bottom: 32, right: 32,
                background: toast.type === 'success' ? 'rgba(188,168,142,0.97)' : 'rgba(255,80,80,0.97)',
                color: '#0a0a0a',
                padding: '14px 28px',
                fontFamily: '"Montserrat", sans-serif',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 3,
                zIndex: 10001,
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
