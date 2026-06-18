import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Tabs */}

      {loading ? (
        <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3 }}>SYNCHRONIZING MISSIONS...</p>
      ) : (
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
