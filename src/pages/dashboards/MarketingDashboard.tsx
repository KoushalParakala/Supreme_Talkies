import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { fetchMemberDirectoryByIds } from '../../lib/directory';

function CinemaButton({ children, onClick, disabled, loading, style }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean; style?: React.CSSProperties; }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      animate={{ background: hov && !disabled ? '#BCA88E' : 'transparent', color: hov && !disabled ? '#1e2029' : '#BCA88E', opacity: disabled ? 0.4 : 1 }}
      transition={{ duration: 0.2 }}
      style={{ border: '1px solid #BCA88E', padding: '13px 44px', fontFamily: 'Playfair Display, sans-serif', fontSize: 15, letterSpacing: 5, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {loading && <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />}
      {children}
    </motion.button>
  );
}

/* ── Shared UI Components ── */
function CinemaInput({ label, type = 'text', placeholder, value, onChange }: { label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void; }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 5, opacity: focused ? 1 : 0.7, textTransform: 'uppercase' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${focused ? '#BCA88E' : 'rgba(188,168,142,0.3)'}`, paddingBottom: 10, fontFamily: 'Inter, monospace', fontSize: 14, color: '#F0EBE0', width: '100%', outline: 'none', transition: 'border-color 0.2s' }}
      />
    </div>
  );
}

function CinemaTextarea({ label, placeholder, value, onChange, rows = 3 }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number; }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 5, opacity: focused ? 1 : 0.7, textTransform: 'uppercase' }}>{label}</label>
      <textarea rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${focused ? '#BCA88E' : 'rgba(188,168,142,0.3)'}`, paddingBottom: 10, fontFamily: 'Inter, monospace', fontSize: 14, color: '#F0EBE0', width: '100%', outline: 'none', resize: 'none', lineHeight: 1.7, transition: 'border-color 0.2s' }}
      />
    </div>
  );
}


const PLATFORMS = ['Instagram', 'Twitter/X', 'YouTube', 'LinkedIn', 'WhatsApp', 'Other'];

export default function MarketingDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'campaigns' | 'kit' | 'leaderboard'>('campaigns');
  
  /* Campaign States */
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ 
    title: '', platform: [] as string[], niche: '', start_date: '', end_date: '', reach_target: '' 
  });
  const [editingReach, setEditingReach] = useState<string | null>(null);
  const [reachUpdateValue, setReachUpdateValue] = useState('');
  const [myAssignments, setMyAssignments] = useState<Record<string, any>>({});

  /* Collab Brief States */
  const [collabForm, setCollabForm] = useState({
    platform: '',
    follower_count: '',
    collab_idea: ''
  });
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  /* Content Kit States */
  const [expandedHashtags, setExpandedHashtags] = useState(false);

  /* Leaderboard States */
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchIdRef = useRef(0);

  const fetchData = async () => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const { data: allCampaigns } = await supabase
        .from('campaigns')
        .select('*')
        .or(`status.eq.active,created_by.eq.${user?.id}`)
        .order('created_at', { ascending: false });
      
      if (fetchId !== fetchIdRef.current) return;
      setCampaigns(allCampaigns || []);

      const { data: assigns } = await supabase
        .from('campaign_assignments')
        .select('*')
        .eq('user_id', user?.id);
        
      if (fetchId !== fetchIdRef.current) return;
      const assignMap: Record<string, any> = {};
      assigns?.forEach(a => { assignMap[a.campaign_id] = a; });
      setMyAssignments(assignMap);

      // 2. Fetch Leaderboard (Top 20)
      const { data: lbData } = await supabase
        .from('campaign_leaderboard')
        .select('*')
        .order('points', { ascending: false })
        .limit(20);

      if (fetchId !== fetchIdRef.current) return;
      const leaderboardProfiles = await fetchMemberDirectoryByIds((lbData || []).map((row: any) => row.user_id));
      if (fetchId !== fetchIdRef.current) return;
      const lb = (lbData || []).map((row: any) => ({
        ...row,
        profiles: leaderboardProfiles.get(row.user_id) || null
      }));
      setLeaderboard(lb);

      // 3. Find Current User Rank
      const myIndex = lb.findIndex(r => r.user_id === user?.id);
      if (myIndex !== -1) {
        setUserRank({ rank: myIndex + 1, ...lb[myIndex] });
      } else {
        setUserRank(null);
      }

    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  };

  const handleCollabSubmit = async () => {
    if (!user) {
      toast('You must be logged in to submit a proposal.');
      return;
    }
    if (!collabForm.platform || !collabForm.collab_idea) {
      toast('Please fill out your platform and collab idea.');
      return;
    }
    setCollabSubmitting(true);
    try {
      const { error } = await supabase.from('submissions').insert({
        user_id: user.id,
        type: 'collab',
        data: {
          platform: collabForm.platform,
          follower_count: collabForm.follower_count,
          collab_idea: collabForm.collab_idea
        },
        status: 'submitted'
      });
      if (error) throw error;
      setCollabForm({ platform: '', follower_count: '', collab_idea: '' });
      toast('Proposal submitted to database! Our marketing lead will reach out. ✦');
    } catch (err: any) {
      console.error('Error submitting collab brief:', err);
      toast(`FAILED TO SUBMIT: ${err.message}`);
    } finally {
      setCollabSubmitting(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!user || !newCampaign.title) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('campaigns').insert({ 
        ...newCampaign, 
        created_by: user.id,
        status: 'active',
        actual_reach: 0
      });
      if (error) throw error;
      setNewCampaign({ title: '', platform: [], niche: '', start_date: '', end_date: '', reach_target: '' });
      setShowNewCampaign(false);
      fetchData();
      toast('CAMPAIGN LAUNCHED ✦');
    } catch (err: any) { toast(err.message); }
    finally { setSubmitting(false); }
  };

  const handleUpdateReach = async (id: string) => {
    try {
      const { error } = await supabase.from('campaigns').update({ actual_reach: parseInt(reachUpdateValue) }).eq('id', id);
      if (error) throw error;
      setEditingReach(null);
      fetchData();
    } catch (err: any) { toast(err.message); }
  };

  const handleCloseCampaign = async (id: string) => {
    if (!window.confirm('Mark this campaign as completed?')) return;
    try {
      const { error } = await supabase.from('campaigns').update({ status: 'completed' }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { toast(err.message); }
  };

  const handleJoinCampaign = async (campaignId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('campaign_assignments').insert({
        campaign_id: campaignId,
        user_id: user.id,
        posts_count: 0
      });
      if (error) throw error;
      fetchData();
      toast('JOINED CAMPAIGN ✦');
    } catch (err: any) { toast(err.message); }
  };

  const handleLogPost = async (campaignId: string) => {
    if (!user) return;
    const assignment = myAssignments[campaignId];
    if (!assignment) return;
    
    try {
      const { error } = await supabase.from('campaign_assignments').update({
        posts_count: (assignment.posts_count || 0) + 1,
        points: (assignment.points || 0) + 10,
        reach: (assignment.reach || 0) + 100
      }).eq('id', assignment.id);
      if (error) throw error;
      
      fetchData();
      toast('POST LOGGED ✦');
    } catch (err: any) { toast(err.message); }
  };

  const TABS = [
    { id: 'campaigns', label: 'CAMPAIGNS' },
    { id: 'kit', label: 'CONTENT KIT' },
    { id: 'leaderboard', label: 'LEADERBOARD' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(188,168,142,0.12)' }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setView(t.id as any)}
            style={{ 
              background: view === t.id ? 'rgba(188,168,142,0.15)' : 'none', 
              border: 'none', borderBottom: view === t.id ? '2px solid #BCA88E' : '2px solid transparent', 
              padding: '12px 28px', fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 5, 
              color: view === t.id ? '#BCA88E' : 'rgba(240,235,224,0.3)', cursor: 'pointer', transition: 'all 0.2s', marginBottom: -1 
            }}
          >{t.label}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3 }}>SYNCHRONIZING MISSIONS...</p>
      ) : view === 'campaigns' ? (
        /* CAMPAIGNS TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          {/* New Campaign Form */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 4 }}>CAMPAIGN CENTER</p>
                <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.4, letterSpacing: 3 }}>STRATEGIZE AND DEPLOY</p>
              </div>
              <button onClick={() => setShowNewCampaign(!showNewCampaign)} style={{ background: 'none', border: '1px solid #BCA88E', color: '#BCA88E', padding: '10px 24px', fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 4, cursor: 'pointer' }}>
                {showNewCampaign ? 'CANCEL' : '+ NEW CAMPAIGN'}
              </button>
            </div>

            <AnimatePresence>
              {showNewCampaign && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', background: 'rgba(188,168,142,0.03)', border: '1px solid rgba(188,168,142,0.1)', padding: 32, marginBottom: 48 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 680 }}>
                    <CinemaInput label="CAMPAIGN TITLE" placeholder="e.g. Summer Blockbuster Premiere" value={newCampaign.title} onChange={(v) => setNewCampaign({ ...newCampaign, title: v })} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 5, textTransform: 'uppercase', margin: 0 }}>TARGET PLATFORMS</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {PLATFORMS.map(p => (
                          <button key={p} onClick={() => {
                            const next = newCampaign.platform.includes(p) ? newCampaign.platform.filter(x => x !== p) : [...newCampaign.platform, p];
                            setNewCampaign({ ...newCampaign, platform: next });
                          }}
                            style={{ padding: '6px 12px', border: '1px solid rgba(188,168,142,0.2)', background: newCampaign.platform.includes(p) ? 'rgba(188,168,142,0.12)' : 'transparent', borderColor: newCampaign.platform.includes(p) ? '#BCA88E' : 'rgba(188,168,142,0.2)', color: newCampaign.platform.includes(p) ? '#BCA88E' : 'rgba(240,235,224,0.4)', fontFamily: 'Inter, monospace', fontSize: 9, letterSpacing: 2, cursor: 'pointer' }}
                          >{p.toUpperCase()}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                      <CinemaInput label="START DATE" type="date" value={newCampaign.start_date} onChange={(v) => setNewCampaign({ ...newCampaign, start_date: v })} />
                      <CinemaInput label="END DATE" type="date" value={newCampaign.end_date} onChange={(v) => setNewCampaign({ ...newCampaign, end_date: v })} />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                      <CinemaInput label="REACH TARGET" type="number" placeholder="e.g. 50000" value={newCampaign.reach_target} onChange={(v) => setNewCampaign({ ...newCampaign, reach_target: v })} />
                      <CinemaInput label="NICHE" placeholder="e.g. Thriller Fans" value={newCampaign.niche} onChange={(v) => setNewCampaign({ ...newCampaign, niche: v })} />
                    </div>

                    <motion.button onClick={handleLaunchCampaign} disabled={submitting || !newCampaign.title} whileHover={{ background: '#BCA88E', color: '#0a0a0a' }} style={{ background: 'transparent', border: '1px solid #BCA88E', color: '#BCA88E', padding: '14px 40px', fontFamily: 'Montserrat, sans-serif', fontSize: 12, letterSpacing: 6, cursor: 'pointer', alignSelf: 'flex-start' }}>
                      {submitting ? 'DEPLOYING...' : 'LAUNCH CAMPAIGN  →'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {campaigns.length === 0 ? (
                <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.25 }}>No active missions detected.</p>
              ) : (
                campaigns.map((c) => {
                  const target = parseInt(c.reach_target) || 1;
                  const actual = c.actual_reach || 0;
                  const progress = Math.min((actual / target) * 100, 100);
                  const isOwner = c.created_by === user?.id;

                  return (
                    <div key={c.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(188,168,142,0.1)', padding: 32 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <span style={{ 
                              width: 8, height: 8, borderRadius: '50%', background: c.status === 'active' ? '#BCA88E' : '#666',
                              boxShadow: c.status === 'active' ? '0 0 10px #BCA88E' : 'none',
                              animation: c.status === 'active' ? 'pulse 2s infinite' : 'none'
                            }} />
                            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#F0EBE0', margin: 0 }}>{c.title}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {c.platform?.map((p: string) => (
                              <span key={p} style={{ fontFamily: 'Inter, monospace', fontSize: 8, color: '#BCA88E', opacity: 0.6, letterSpacing: 2 }}>
                                {p === 'Instagram' ? '📸' : p === 'Twitter/X' ? '🐦' : '🔗'} {p.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 3, border: '1px solid rgba(188,168,142,0.3)', padding: '4px 10px', color: '#BCA88E' }}>{c.status.toUpperCase()}</span>
                      </div>

                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#F0EBE0', opacity: 0.4 }}>ACTUAL REACH: {actual.toLocaleString()} / {target.toLocaleString()}</p>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E' }}>{Math.round(progress)}%</p>
                        </div>
                        <div style={{ height: 2, background: 'rgba(188,168,142,0.1)', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', background: '#BCA88E' }} />
                        </div>
                      </div>

                      {isOwner && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(188,168,142,0.05)' }}>
                          {editingReach === c.id ? (
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <input type="number" value={reachUpdateValue} onChange={(e) => setReachUpdateValue(e.target.value)} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #BCA88E', color: '#F0EBE0', fontFamily: 'Inter, monospace', fontSize: 12, width: 100, outline: 'none' }} placeholder="Update reach..." />
                              <button onClick={() => handleUpdateReach(c.id)} style={{ background: '#BCA88E', border: 'none', color: '#0a0a0a', fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>UPDATE</button>
                              <button onClick={() => setEditingReach(null)} style={{ background: 'none', border: 'none', color: '#F0EBE0', opacity: 0.4, cursor: 'pointer' }}>✕</button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingReach(c.id); setReachUpdateValue(actual.toString()); }} style={{ background: 'none', border: 'none', color: '#BCA88E', opacity: 0.6, fontSize: 10, letterSpacing: 2, cursor: 'pointer' }}>✎ UPDATE REACH</button>
                          )}
                          <button onClick={() => handleCloseCampaign(c.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', opacity: 0.5, fontSize: 9, letterSpacing: 3, cursor: 'pointer' }}>CLOSE CAMPAIGN</button>
                        </div>
                      )}
                      
                      {!isOwner && c.status === 'active' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(188,168,142,0.05)' }}>
                          {myAssignments[c.id] ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#4ade80', letterSpacing: 2 }}>
                                JOINED ({myAssignments[c.id].posts_count || 0} POSTS)
                              </span>
                              <button onClick={() => handleLogPost(c.id)} style={{ background: 'transparent', border: '1px solid #BCA88E', color: '#BCA88E', padding: '6px 16px', fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 3, cursor: 'pointer' }}>
                                + LOG POST
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => handleJoinCampaign(c.id)} style={{ background: '#BCA88E', border: 'none', color: '#0a0a0a', padding: '8px 24px', fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: 4, cursor: 'pointer' }}>
                              JOIN MISSION
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Original Collab Brief Form (JOIN THE SQUAD) */}
          <div style={{ paddingTop: 64, borderTop: '1px solid rgba(188,168,142,0.1)' }}>
            <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 20 }} />
            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 22, color: '#BCA88E', letterSpacing: 2, marginBottom: 6 }}>THE COLLAB BRIEF</p>
            <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.35, letterSpacing: 2, marginBottom: 28 }}>AMPLIFY THE SIGNAL. MOVE THE CROWD.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 680 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <CinemaInput label="YOUR PLATFORM" placeholder="Instagram / YouTube / X" value={collabForm.platform} onChange={(v) => setCollabForm({ ...collabForm, platform: v })} />
                <CinemaInput label="FOLLOWER COUNT" placeholder="e.g. 12,000" value={collabForm.follower_count} onChange={(v) => setCollabForm({ ...collabForm, follower_count: v })} />
              </div>
              <CinemaTextarea label="YOUR COLLAB IDEA" placeholder="Tell us what you have in mind..." value={collabForm.collab_idea} onChange={(v) => setCollabForm({ ...collabForm, collab_idea: v })} rows={4} />
              <CinemaButton onClick={handleCollabSubmit} loading={collabSubmitting} disabled={collabSubmitting}>SUBMIT PROPOSAL  →</CinemaButton>
            </div>
          </div>
        </div>
      ) : view === 'kit' ? (
        /* CONTENT KIT TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          <div>
            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 22, color: '#BCA88E', letterSpacing: 2, marginBottom: 8 }}>CONTENT KIT</p>
            <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.4, letterSpacing: 3 }}>READY-TO-USE TEMPLATES AND ASSETS</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {/* Kit Cards */}
            {[
              { id: 'captions', icon: '✍️', title: 'CAPTION TEMPLATES', desc: 'Pre-written captions for all major social platforms.' },
              { id: 'hashtags', icon: '🏷️', title: 'HASHTAG BANKS', desc: 'Genre-specific hashtag sets for maximum visibility.', expandable: true },
              { id: 'visuals', icon: '🎨', title: 'VISUAL GUIDELINES', desc: 'Brand colors, typography, and logo usage assets.', swatches: true },
              { id: 'stories', icon: '📸', title: 'STORY TEMPLATES', desc: 'High-fidelity templates for Instagram and WhatsApp stories.' },
              { id: 'email', icon: '📧', title: 'EMAIL TEMPLATES', desc: 'Outreach templates for influencers and partners.' },
              { id: 'calendar', icon: '🗓️', title: 'CAMPAIGN CALENDAR', desc: 'Synchronized schedule for upcoming platform drops.' }
            ].map(item => (
              <div key={item.id} style={{ background: 'rgba(30,32,41,0.6)', border: '1px solid rgba(188,168,142,0.12)', padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 16, color: '#F0EBE0', margin: 0, letterSpacing: 1 }}>{item.title}</p>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F0EBE0', opacity: 0.6, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                
                {item.expandable && (
                  <div>
                    <button onClick={() => setExpandedHashtags(!expandedHashtags)} style={{ background: 'none', border: 'none', color: '#BCA88E', fontSize: 10, letterSpacing: 2, cursor: 'pointer', padding: 0 }}>{expandedHashtags ? 'HIDE BANKS' : 'VIEW BANKS'}</button>
                    <AnimatePresence>
                      {expandedHashtags && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ overflow: 'hidden', marginTop: 12, background: 'rgba(0,0,0,0.2)', padding: 12 }}>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', margin: 0 }}>#IndianCinema #IndieFilm #SupremeTalkies #NewWaveCinema #FilmFestival #CreativeProduction</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {item.swatches && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {['#BCA88E', '#F0EBE0', '#0a0a0a'].map(c => (
                      <div key={c} style={{ width: 24, height: 24, background: c, border: '1px solid rgba(188,168,142,0.3)' }} title={c} />
                    ))}
                  </div>
                )}

                <button style={{ alignSelf: 'flex-start', background: 'none', border: '1px solid rgba(188,168,142,0.4)', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 3, padding: '8px 20px', cursor: 'pointer', marginTop: 8 }}>ACCESS</button>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a href="mailto:marketing@supremetalkies.com" style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, textDecoration: 'underline' }}>REQUEST A RESOURCE</a>
          </div>
        </div>
      ) : (
        /* LEADERBOARD TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {userRank && (
            <div style={{ background: 'rgba(188,168,142,0.08)', border: '1px solid rgba(188,168,142,0.3)', padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 6, color: '#BCA88E', marginBottom: 8 }}>YOUR CURRENT STANDING</p>
                <h2 style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 32, color: '#F0EBE0', margin: 0 }}>RANK #{userRank.rank}</h2>
              </div>
              <div style={{ display: 'flex', gap: 48 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 24, color: '#BCA88E', margin: 0 }}>{userRank.points}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 3, opacity: 0.4, margin: 0 }}>POINTS</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 24, color: '#BCA88E', margin: 0 }}>{userRank.posts_count}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 3, opacity: 0.4, margin: 0 }}>POSTS</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 80px 100px', padding: '0 24px 16px', borderBottom: '1px solid rgba(188,168,142,0.1)' }}>
              {['RANK', 'MEMBER', 'POINTS', 'POSTS', 'REACH'].map(h => (
                <span key={h} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 4, color: '#BCA88E', opacity: 0.5 }}>{h}</span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {leaderboard.length === 0 ? (
                <p style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.3 }}>Leaderboard populates as campaigns run. Start a campaign to appear here.</p>
              ) : (
                leaderboard.map((row, i) => {
                  const isGold = i === 0;
                  const isSilver = i === 1;
                  const isBronze = i === 2;
                  const isMe = row.user_id === user?.id;

                  return (
                    <div key={row.user_id} style={{ 
                      display: 'grid', gridTemplateColumns: '80px 1fr 100px 80px 100px', alignItems: 'center', padding: '20px 24px',
                      background: isGold ? 'rgba(188,168,142,0.15)' : isSilver ? 'rgba(200,200,200,0.08)' : isBronze ? 'rgba(160,100,40,0.08)' : 'transparent',
                      border: isMe ? '1px solid rgba(188,168,142,0.3)' : 'none'
                    }}>
                      <span style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 20, color: isGold || isSilver || isBronze ? '#BCA88E' : 'rgba(240,235,224,0.4)' }}>{i + 1}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 24 }}>{row.profiles?.avatar_symbol}</span>
                        <div>
                          <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 14, color: '#F0EBE0', margin: 0 }}>{row.profiles?.full_name}</p>
                          <span style={{ fontFamily: 'Inter, monospace', fontSize: 8, color: '#BCA88E', opacity: 0.4, background: 'rgba(188,168,142,0.1)', padding: '1px 6px', letterSpacing: 2 }}>{row.profiles?.st_id ? (row.profiles.st_id.startsWith('SUPR-') ? row.profiles.st_id : 'SUPR-' + row.profiles.st_id) : 'NO-ID'}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 16, color: '#BCA88E', fontWeight: 700 }}>{row.points}</span>
                      <span style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.6 }}>{row.posts_count}</span>
                      <span style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.6 }}>{(row.reach >= 1000 ? (row.reach / 1000).toFixed(1) + 'K' : row.reach)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Pulse Animation for active status */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
