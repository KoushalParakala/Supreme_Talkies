import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { deriveSuprId } from '../lib/auth';
import { getVerifyProgress } from '../lib/verified';
import { IconCheck } from '../components/ReelIcons';

function RoleBadge({ role }: { role: string }) {
  const clean = role.toLowerCase() === 'amplifier' ? 'MEMBER' : role.toUpperCase();
  return (
    <span className={`profile-role ${clean === 'ADMIN' ? 'is-admin' : ''}`}>{clean}</span>
  );
}

type TabId = 'identity' | 'production' | 'account';

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

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [niche, setNiche] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [contact, setContact] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [noteToTeam, setNoteToTeam] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProfileId = useRef<string | null>(null);

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
    setNoteToTeam(profile.note_to_team || '');
    setImgError(false);
  }, [profile, displayName]);

  useEffect(() => {
    if (!profile) return;
    if (!avatarUrl && profile.avatar_url) { setAvatarUrl(profile.avatar_url); setImgError(false); }
    if (!fullName && profile.full_name) setFullName(profile.full_name);
  }, [profile?.avatar_url, profile?.full_name]); // eslint-disable-line

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

  const persistToDb = async (fields: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    if (!user) throw new Error('No active session.');
    const payload: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      const { error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr) throw new Error('Session expired — please sign in again.');
    }

    const { data, error, status } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new Error(`Save Error: ${error.message} (${status})`);
    if (!data) throw new Error('Save returned no data — your session may have expired. Try refreshing.');
    return data;
  };

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
      await supabase.rpc('evaluate_and_set_st_verified');
      await refreshProfile(user.id);
      showToast('PHOTO UPDATED', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'UPLOAD FAILED', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) { showToast('SESSION EXPIRED', 'error'); return; }
    const changes = {
      full_name: fullName.trim() || 'Anonymous Creator',
      age: age === '' ? null : parseInt(age, 10),
      phone: phone.trim(),
      avatar_url: avatarUrl,
      niche: niche.trim(),
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      experience: experience.trim(),
      portfolio_url: portfolioUrl.trim(),
      contact: contact.trim(),
      social_handle: socialHandle.trim(),
      note_to_team: noteToTeam.trim(),
    };
    setSaving(true);
    try {
      await persistToDb(changes);
      const metaChanges: Record<string, string> = {};
      if (changes.full_name) metaChanges.full_name = changes.full_name;
      if (changes.avatar_url) metaChanges.avatar_url = changes.avatar_url;
      if (Object.keys(metaChanges).length > 0) {
        const { error: metaErr } = await supabase.auth.updateUser({ data: metaChanges });
        if (metaErr) console.warn('Auth metadata sync failed:', metaErr);
      }
      const { error: verifyErr } = await supabase.rpc('evaluate_and_set_st_verified');
      if (verifyErr) console.warn('[ProfileSettings] verify eval failed:', verifyErr);
      await refreshProfile(user.id);
      showToast('PROFILE SAVED', 'success');
    } catch (err: unknown) {
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

  const emailStr = user?.email || 'member@cinema.com';
  const sampleIdx = (emailStr.charCodeAt(0) + (emailStr.charCodeAt(1) || 0)) % 6 + 1;
  const fallback = `/Sample${sampleIdx}.webp`;
  const avatarDisp = (!imgError && avatarUrl) ? avatarUrl : fallback;

  const rawId = profile?.st_id || '';
  const displayId = rawId ? (rawId.startsWith('SUPR-') ? rawId : `SUPR-${rawId}`) : (user ? deriveSuprId(user.id) : '—');
  const primaryRole = (profile?.roles?.[0] || profile?.role || 'MEMBER');
  const cleanRole = primaryRole.toLowerCase() === 'amplifier' ? 'MEMBER' : primaryRole.toUpperCase();
  const allRoles = Array.from(new Set([...(profile?.roles || []), profile?.role].filter(Boolean) as string[]));

  const copySuprId = async () => {
    try {
      await navigator.clipboard.writeText(displayId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1800);
    } catch {
      showToast('COPY FAILED', 'error');
    }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
    : '—';

  const verifyProgress = getVerifyProgress(profile, {
    full_name: fullName,
    phone,
    age,
    avatar_url: avatarUrl,
    niche,
    note_to_team: noteToTeam,
    social_handle: socialHandle,
    portfolio_url: portfolioUrl,
    skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
  });

  const tabs: { id: TabId; label: string }[] = [
    { id: 'identity', label: 'Identity' },
    { id: 'production', label: 'Production' },
    { id: 'account', label: 'Account' },
  ];

  const busy = saving || uploading;

  return (
    <div className="dash-shell site-page sub-page">
      <Nav scrolled={true} />
      <div className="dash-body">
        <div className="dash-masthead">
          <div className="section-line dash-section-line">
            <span>05 / MEMBER PROFILE</span>
            <span>YOUR FRAME <i /></span>
          </div>

          <div className="profile-identity">
            <button
              type="button"
              className="profile-photo"
              title="Change photo"
              onClick={() => fileInputRef.current?.click()}
            >
              <img src={avatarDisp} alt="" onError={() => setImgError(true)} />
              {uploading && <span className="profile-photo-spin"><i /></span>}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileUpload} />
            <div>
              <h1>{fullName || displayName || 'Member'}<br /><em>{cleanRole.toLowerCase()}.</em></h1>
              <div className="profile-id-row">
                <button type="button" className="dash-id" onClick={() => void copySuprId()}>
                  {copiedId ? 'COPIED' : displayId}
                </button>
                <RoleBadge role={cleanRole} />
                {profile?.st_verified && (
                  <span className="profile-verified"><IconCheck /> SUPR verified</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span>Member since</span>
            <b>{memberSince}</b>
          </div>
          <div className="profile-stat">
            <span>Streak</span>
            <b>{profile?.share_streak || 0}</b>
            <small>Days</small>
          </div>
          <div className="profile-stat">
            <span>Roles</span>
            <b>{Math.max(allRoles.length, 1)}</b>
            <small>Active</small>
          </div>
        </div>

        <div className="profile-stage">
          <aside className="profile-rail">
            <div className="profile-tabs">
              <span className="profile-tabs-label" style={{ padding: '12px 16px 0' }}>Settings</span>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? 'is-active' : ''}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {allRoles.length > 0 && (
              <div className="profile-rail-card">
                <span>Your roles</span>
                <div className="profile-roles">
                  {allRoles.map((r) => <RoleBadge key={r} role={r} />)}
                </div>
              </div>
            )}

            <div className="profile-rail-card">
              <span>Supreme ID</span>
              <div className="dash-id" style={{ display: 'block', textAlign: 'center', padding: '12px 8px', fontSize: 12 }}>
                {displayId}
              </div>
              <button type="button" className="dash-ghost-btn profile-id-copy" onClick={() => void copySuprId()}>
                {copiedId ? 'Copied' : 'Copy ID'}
              </button>
            </div>

            <div className="profile-rail-card">
              <span>SUPR verified</span>
              <div style={{ fontSize: 12, marginBottom: 4 }}>
                {verifyProgress.done}/{verifyProgress.total} complete
                {profile?.st_verified ? ' · verified' : ''}
              </div>
              <div className="profile-verify-bar">
                <i style={{ width: `${(verifyProgress.done / verifyProgress.total) * 100}%` }} />
              </div>
              {verifyProgress.checks.map((c) => (
                <div key={c.id} className={`profile-check ${c.done ? 'is-done' : ''}`}>
                  <span>{c.done ? '✓' : '○'}</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </aside>

          <div>
            <AnimatePresence mode="wait">
              {activeTab === 'identity' && (
                <motion.div key="identity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <div className="profile-panel">
                    <div className="profile-panel-head">
                      <strong>01 / Personal details</strong>
                      <span>Identity</span>
                    </div>
                    <div className="profile-fields profile-grid">
                      <label className="span-2">
                        <span>Full name</span>
                        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                      </label>
                      <label className="span-2">
                        <span>Supreme ID</span>
                        <input value={displayId} disabled readOnly />
                      </label>
                      <label>
                        <span>Age</span>
                        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 23" />
                      </label>
                      <label>
                        <span>Phone</span>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" />
                      </label>
                    </div>
                    <p className="profile-hint">Auto-assigned at registration · Permanent · Unique to you</p>
                    <div className="profile-actions">
                      <button type="button" className="primary-button" onClick={handleSave} disabled={busy}>
                        {saving ? 'Saving…' : 'Save details'}
                      </button>
                    </div>
                  </div>

                  <div className="profile-panel">
                    <div className="profile-panel-head">
                      <strong>02 / Avatar</strong>
                      <span>Portrait</span>
                    </div>
                    <div className="profile-avatar-row">
                      <div className="profile-photo" style={{ cursor: 'default' }}>
                        <img src={avatarDisp} alt="" onError={() => setImgError(true)} />
                      </div>
                      <div>
                        <p style={{ margin: '0 0 8px', fontSize: 14 }}>Profile photo</p>
                        <p className="profile-hint" style={{ marginBottom: 14 }}>
                          Upload a new photo or sign in with Google to auto-sync. JPG, PNG, WEBP · Max 5MB
                        </p>
                        <button type="button" className="dash-ghost-btn" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                          {uploading ? 'Uploading…' : 'Change photo'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'production' && (
                <motion.div key="production" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <div className="profile-panel">
                    <div className="profile-panel-head">
                      <strong>03 / Production profile</strong>
                      <span>Craft</span>
                    </div>
                    <div className="profile-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <label>
                        <span>Specialization / niche</span>
                        <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Cinematographer, Director, Writer" />
                      </label>
                      <label>
                        <span>Key skills (comma separated)</span>
                        <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Editing, Color Grading, Scripting" />
                      </label>
                      <label>
                        <span>Experience / bio</span>
                        <input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5+ Years · Feature Film Focus" />
                      </label>
                      <label>
                        <span>Portfolio / website</span>
                        <input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://mywork.com" />
                      </label>
                      <label>
                        <span>Contact email</span>
                        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="work@domain.com" />
                      </label>
                      <label>
                        <span>Social handle</span>
                        <input value={socialHandle} onChange={(e) => setSocialHandle(e.target.value)} placeholder="@instagram_handle" />
                      </label>
                      <label>
                        <span>Note to team</span>
                        <input value={noteToTeam} onChange={(e) => setNoteToTeam(e.target.value)} placeholder="What should producers know about you?" />
                      </label>
                    </div>
                    <div className="profile-actions">
                      <button type="button" className="primary-button" onClick={handleSave} disabled={busy}>
                        {saving ? 'Saving…' : 'Save production details'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'account' && (
                <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <div className="profile-panel">
                    <div className="profile-panel-head">
                      <strong>04 / Login & security</strong>
                      <span>Account</span>
                    </div>
                    <div className="profile-fields">
                      <label>
                        <span>Email address</span>
                        <input value={user?.email || ''} disabled readOnly />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="auth-inline-link"
                      style={{ marginTop: 10 }}
                      onClick={() => { window.location.href = `mailto:support@supremetalkies.com?subject=Email Change Request: ${profile?.full_name || ''}`; }}
                    >
                      Request email change
                    </button>
                    <div className="profile-actions" style={{ justifyContent: 'flex-start' }}>
                      <button type="button" className="dash-ghost-btn" onClick={handleResetPassword} disabled={busy}>
                        Send reset link
                      </button>
                    </div>
                  </div>

                  <div className="profile-panel">
                    <div className="profile-panel-head">
                      <strong>05 / Danger zone</strong>
                      <span>Irreversible</span>
                    </div>
                    <div className="profile-danger">
                      <h3>Permanent account deletion</h3>
                      <p>
                        This is irreversible. Your profile, credentials, and all associated data will be permanently destroyed.
                      </p>
                      <button type="button" className="primary-button danger-button" onClick={() => setShowDeleteModal(true)} disabled={busy}>
                        Delete my account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <Footer />

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div className="profile-modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="profile-modal" initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}>
              <p className="eyebrow" style={{ color: 'var(--vermilion)' }}>Irreversible action</p>
              <h2>Delete <em>account.</em></h2>
              <p>All your data — profile, SUPR ID, roles, submissions, and history — will be permanently erased.</p>
              <div className="profile-modal-actions">
                <button type="button" className="primary-button danger-button" onClick={handleDeleteAccount} disabled={saving}>
                  {saving ? 'Deleting…' : 'Yes, delete everything'}
                </button>
                <button type="button" className="dash-ghost-btn" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="profile-toast"
            key={toast.message + toast.type}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            style={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              zIndex: 10001,
              background: toast.type === 'success' ? '#171717' : 'var(--vermilion)',
              color: '#fffdf7',
              padding: '12px 20px',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
