import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { fetchMemberByStId, fetchMemberDirectoryByIds } from '../../lib/directory';

/* ── Shared UI Components ── */
function CinemaButton({ children, onClick, disabled, loading, style }: { 
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean; style?: any 
}) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      animate={{ background: hov && !disabled ? '#BCA88E' : 'transparent', color: hov && !disabled ? '#0e0f13' : '#BCA88E', opacity: disabled ? 0.4 : 1 }}
      transition={{ duration: 0.2 }}
      style={{ border: '1px solid #BCA88E', padding: '13px 44px', fontFamily: 'Playfair Display, sans-serif', fontSize: 14, letterSpacing: 5, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', ...style }}
    >
      {loading && <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />}
      {children}
    </motion.button>
  );
}

export default function AmplifierDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'impact' | 'shoutouts' | 'groups'>('impact');
  
  // MY IMPACT state
  const [loggingShare, setLoggingShare] = useState(false);
  
  // SHOUTOUT WALL state
  const [shoutouts, setShoutouts] = useState<any[]>([]);
  const [shoutoutMsg, setShoutoutMsg] = useState('');
  const [shoutoutLink, setShoutoutLink] = useState('');
  const [postingShoutout, setPostingShoutout] = useState(false);

  // GROUPS state
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [inviteId, setInviteId] = useState<Record<string, string>>({}); // {groupId: stId}

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'impact') {
      // Nothing extra to fetch yet, uses profile
    } else if (activeTab === 'shoutouts') {
      fetchShoutouts();
    } else if (activeTab === 'groups') {
      fetchGroups();
    }
  }, [user, activeTab]);

  const fetchIdRef = useRef(0);

  const fetchShoutouts = async () => {
    const fetchId = ++fetchIdRef.current;
    const { data } = await supabase.from('shoutout_wall')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (fetchId !== fetchIdRef.current) return;
    const profileMap = await fetchMemberDirectoryByIds((data || []).map((shoutout: any) => shoutout.user_id));
    if (fetchId !== fetchIdRef.current) return;
    setShoutouts((data || []).map((shoutout: any) => ({
      ...shoutout,
      profiles: profileMap.get(shoutout.user_id) || null
    })));
  };

  const fetchGroups = async () => {
    if (!user) return;
    const fetchId = ++fetchIdRef.current;
    const { data } = await supabase.from('amplifier_groups')
      .select('*')
      .contains('member_ids', [user.id]);
    if (fetchId !== fetchIdRef.current) return;
    const profileMap = await fetchMemberDirectoryByIds((data || []).flatMap((group: any) => group.member_ids || []));
    if (fetchId !== fetchIdRef.current) return;
    setGroups((data || []).map((group: any) => ({
      ...group,
      members: (group.member_ids || []).map((memberId: string) => profileMap.get(memberId)).filter(Boolean)
    })));
  };

  const handleLogShare = async () => {
    if (!user || !profile) return;
    const lastShare = profile.last_share_at ? new Date(profile.last_share_at) : null;
    const isToday = lastShare && lastShare.toDateString() === new Date().toDateString();
    
    if (isToday) {
      alert('Already logged today ✦');
      return;
    }

    setLoggingShare(true);
    try {
      const { error } = await supabase.from('profiles').update({
        share_streak: (profile.share_streak || 0) + 1,
        last_share_at: new Date().toISOString()
      }).eq('id', user.id);
      
      if (error) throw error;
      await refreshProfile();
      fetchGroups();
    } catch (err: any) { alert(err.message); }
    finally { setLoggingShare(false); }
  };

  const handleShoutout = async () => {
    if (!user || !shoutoutMsg) return;
    setPostingShoutout(true);
    try {
      const { error } = await supabase.from('shoutout_wall').insert({
        user_id: user.id,
        message: shoutoutMsg,
        link: shoutoutLink
      });
      if (error) throw error;
      setShoutoutMsg('');
      setShoutoutLink('');
      fetchShoutouts();
    } catch (err: any) { alert(err.message); }
    finally { setPostingShoutout(false); }
  };

  const handleLike = async (id: string, currentLikes: number) => {
    const { error } = await supabase.from('shoutout_wall').update({ likes: (currentLikes || 0) + 1 }).eq('id', id);
    if (!error) setShoutouts(prev => prev.map(s => s.id === id ? { ...s, likes: (currentLikes || 0) + 1 } : s));
  };

  const handleDeleteShoutout = async (id: string) => {
    if (!confirm('Discard this signal?')) return;
    const { error } = await supabase.from('shoutout_wall').delete().eq('id', id);
    if (!error) setShoutouts(prev => prev.filter(s => s.id !== id));
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroup.name) return;
    setCreatingGroup(true);
    try {
      const { error } = await supabase.from('amplifier_groups').insert({
        name: newGroup.name,
        description: newGroup.description,
        created_by: user.id,
        member_ids: [user.id]
      });
      if (error) throw error;
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } catch (err: any) { alert(err.message); }
    finally { setCreatingGroup(false); }
  };

  const handleInvite = async (groupId: string, stId: string, existingMembers: string[]) => {
    if (!stId) return;
    try {
      const target = await fetchMemberByStId(stId);
      if (!target) throw new Error('Member not found.');
      if (existingMembers.includes(target.id)) throw new Error('Already in group.');

      const { error } = await supabase.from('amplifier_groups').update({
        member_ids: [...existingMembers, target.id]
      }).eq('id', groupId);
      
      if (error) throw error;
      alert('Member added! ✦');
      setInviteId({ ...inviteId, [groupId]: '' });
      fetchGroups();
    } catch (err: any) { alert(err.message); }
  };

  const streak = profile?.share_streak || 0;
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, paddingBottom: 100 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid rgba(188,168,142,0.1)', paddingBottom: 0 }}>
        {[
          { id: 'impact', label: 'MY IMPACT' },
          { id: 'shoutouts', label: 'SHOUTOUT WALL' },
          { id: 'groups', label: 'GROUPS' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{ 
              background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #BCA88E' : '2px solid transparent',
              padding: '16px 0', fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 5,
              color: activeTab === tab.id ? '#BCA88E' : 'rgba(188,168,142,0.3)', cursor: 'pointer', transition: 'all 0.3s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'impact' && (
          <motion.div key="impact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            
            {/* Story Streak */}
            <div style={{ textAlign: 'center', padding: '60px 40px', border: '1px solid rgba(188,168,142,0.15)', background: 'rgba(188,168,142,0.02)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                {streak > 0 ? (
                  <>
                    <span style={{ fontSize: 60 }}>🔥</span>
                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 72, color: '#BCA88E', margin: 0, lineHeight: 1 }}>{streak}</h2>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 8, margin: 0 }}>DAY STREAK</p>
                    {profile?.last_share_at && <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#BCA88E', opacity: 0.4, margin: 0 }}>Last share: {timeAgo(profile.last_share_at)}</p>}
                  </>
                ) : (
                  <div style={{ opacity: 0.3 }}>
                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, color: '#BCA88E', margin: '0 0 12px' }}>0 DAYS</h2>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0' }}>Share something today to start your streak!</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[
                    { days: 3, label: '🔥 3 Days' },
                    { days: 7, label: '🔥🔥 7 Days' },
                    { days: 30, label: '🔥🔥🔥 30 Days' },
                    { days: 100, label: '⚡ 100 Days' }
                  ].map(m => (
                    <span key={m.days} style={{ 
                      padding: '6px 14px', border: '1px solid', borderColor: streak >= m.days ? '#BCA88E' : 'rgba(188,168,142,0.1)',
                      color: streak >= m.days ? '#F0EBE0' : '#BCA88E', opacity: streak >= m.days ? 1 : 0.2,
                      fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 2
                    }}>
                      {m.label}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 40 }}>
                  <CinemaButton onClick={handleLogShare} loading={loggingShare}>LOG A SHARE →</CinemaButton>
                </div>
              </div>
            </div>

            {/* Early Access */}
            <div>
              <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 20 }} />
              {profile?.is_early_access ? (
                <div style={{ border: '1px solid #BCA88E', background: 'rgba(188,168,142,0.05)', padding: 40 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 8, color: '#BCA88E', marginBottom: 12 }}>⚡ EARLY ACCESS MEMBER</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#F0EBE0', opacity: 0.7, marginBottom: 40 }}>You get first look at new films, challenges, and features.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {['Script DNA Marketplace', 'Live Screening Rooms', 'Director Matchmaking'].map(f => (
                      <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(188,168,142,0.1)', paddingBottom: 12 }}>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EBE0' }}>{f}</span>
                        <span style={{ fontFamily: 'Inter, monospace', fontSize: 8, letterSpacing: 2, background: 'rgba(188,168,142,0.1)', padding: '2px 8px', color: '#BCA88E' }}>COMING SOON</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(188,168,142,0.2)', padding: 40, opacity: 0.8 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 8, color: '#BCA88E', marginBottom: 12 }}>APPLY FOR EARLY ACCESS</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#F0EBE0', opacity: 0.6, marginBottom: 32 }}>Join our inner circle for first access to new features and unreleased films.</p>
                  <CinemaButton onClick={() => window.location.href='mailto:early@supremetalkies.com'}>APPLY NOW</CinemaButton>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'shoutouts' && (
          <motion.div key="shoutouts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {/* Post Form */}
            <div style={{ border: '1px solid rgba(188,168,142,0.15)', padding: 32, background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 5 }}>MESSAGE</label>
                <textarea 
                  rows={2} placeholder="Shout out a film, a crew member, or share an update..."
                  value={shoutoutMsg} onChange={e => setShoutoutMsg(e.target.value)}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(188,168,142,0.3)', color: '#F0EBE0', fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 5 }}>LINK (OPTIONAL)</label>
                <input 
                  type="text" placeholder="Attach a link" value={shoutoutLink} onChange={e => setShoutoutLink(e.target.value)}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(188,168,142,0.3)', color: '#F0EBE0', fontFamily: 'Inter, monospace', fontSize: 13, outline: 'none' }}
                />
              </div>
              <CinemaButton onClick={handleShoutout} loading={postingShoutout} disabled={!shoutoutMsg}>POST SHOUTOUT</CinemaButton>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {shoutouts.map(sh => (
                <div key={sh.id} style={{ background: 'rgba(14,15,20,0.8)', border: '1px solid rgba(188,168,142,0.08)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>{sh.profiles?.avatar_symbol || '👤'}</span>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#BCA88E', margin: 0, fontWeight: 700 }}>{sh.profiles?.full_name?.toUpperCase()}</p>
                      <span style={{ fontFamily: 'Inter, monospace', fontSize: 8, color: '#BCA88E', opacity: 0.4, background: 'rgba(188,168,142,0.1)', padding: '2px 6px' }}>{sh.profiles?.st_id ? (sh.profiles.st_id.startsWith('SUPR-') ? sh.profiles.st_id : 'SUPR-' + sh.profiles.st_id) : 'NO-ID'}</span>
                    </div>
                    <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.3, margin: 0 }}>{timeAgo(sh.created_at)}</p>
                  </div>
                  
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#F0EBE0', lineHeight: 1.7, margin: 0 }}>{sh.message}</p>
                  
                  {sh.link && (
                    <a href={sh.link} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start', background: 'rgba(188,168,142,0.1)', color: '#BCA88E', textDecoration: 'none', fontSize: 9, padding: '4px 10px', fontFamily: 'Inter, monospace', letterSpacing: 1 }}>{sh.link.substring(0, 30)}...</a>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#BCA88E' }}>{sh.likes || 0}</span>
                      <button onClick={() => handleLike(sh.id, sh.likes)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>❤️</button>
                    </div>
                    {sh.user_id === user?.id && (
                      <button onClick={() => handleDeleteShoutout(sh.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: 14, opacity: 0.6 }}>✕</button>
                    )}
                  </div>
                </div>
              ))}
              {shoutouts.length === 50 && <CinemaButton onClick={() => {}} style={{ alignSelf: 'center' }}>LOAD MORE</CinemaButton>}
            </div>
          </motion.div>
        )}

        {activeTab === 'groups' && (
          <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {/* Create Group */}
            <div style={{ border: '1px solid rgba(188,168,142,0.15)', padding: 32, background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#BCA88E', margin: 0 }}>NEW AMPLIFIER GROUP</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 5 }}>GROUP NAME</label>
                  <input 
                    type="text" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(188,168,142,0.3)', color: '#F0EBE0', fontFamily: 'Inter, monospace', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 5 }}>DESCRIPTION</label>
                  <textarea 
                    rows={2} value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(188,168,142,0.3)', color: '#F0EBE0', fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none', resize: 'none' }}
                  />
                </div>
              </div>
              <CinemaButton onClick={handleCreateGroup} loading={creatingGroup} disabled={!newGroup.name}>CREATE GROUP</CinemaButton>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
              {groups.map(g => (
                <div key={g.id} style={{ background: 'rgba(14,15,20,0.8)', border: '1px solid rgba(188,168,142,0.1)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontStyle: 'italic', color: '#BCA88E', margin: '0 0 8px' }}>{g.name}</h3>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F0EBE0', opacity: 0.6, lineHeight: 1.6, margin: 0 }}>{g.description}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: -8 }}>
                      {g.members?.slice(0, 5).map((m: any, idx: number) => (
                        <span key={m.st_id} title={m.full_name} style={{ width: 28, height: 28, borderRadius: '50%', background: '#0e0f13', border: '1px solid #BCA88E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginLeft: idx > 0 ? -10 : 0 }}>{m.avatar_symbol}</span>
                      ))}
                    </div>
                    <span style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E' }}>
                      {g.members?.length > 5 ? `+${g.members.length - 5} MORE` : `${g.members?.length} MEMBERS`}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(188,168,142,0.1)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        type="text" placeholder="SUPR-12345" 
                        value={inviteId[g.id] || ''} onChange={e => setInviteId({ ...inviteId, [g.id]: e.target.value })}
                        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(188,168,142,0.3)', color: '#F0EBE0', fontFamily: 'Inter, monospace', fontSize: 11, outline: 'none' }}
                      />
                      <button onClick={() => handleInvite(g.id, inviteId[g.id], g.member_ids)} style={{ background: 'none', border: '1px solid #BCA88E', color: '#BCA88E', padding: '4px 12px', fontSize: 9, fontFamily: 'Montserrat, sans-serif', letterSpacing: 2, cursor: 'pointer' }}>INVITE</button>
                    </div>
                    <button onClick={() => alert('Group sync coming soon. Stay tuned.')} style={{ background: '#BCA88E', color: '#0e0f13', border: 'none', padding: '10px', fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 4, cursor: 'pointer' }}>SYNC</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
