import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

export default function MarketingDashboard() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  
  /* Campaign States */
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<Record<string, any>>({});

  /* Idea Board States */
  const [ideas, setIdeas] = useState<any[]>([]);
  const [newIdeaText, setNewIdeaText] = useState('');
  const [postingIdea, setPostingIdea] = useState(false);

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
        .eq('status', 'active')
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

      const { data: allIdeas } = await supabase
        .from('submissions')
        .select('*, profiles(full_name, role, roles)')
        .eq('type', 'marketing_idea')
        .order('created_at', { ascending: false });

      if (fetchId !== fetchIdRef.current) return;
      setIdeas(allIdeas || []);

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

  const handlePostIdea = async () => {
    if (!user || !newIdeaText.trim()) return;
    setPostingIdea(true);
    try {
      const colors = ['#fef08a', '#bbf7d0', '#fbcfe8', '#bfdbfe', '#fed7aa', '#e9d5ff'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const { error } = await supabase.from('submissions').insert({
        user_id: user.id,
        type: 'marketing_idea',
        data: { text: newIdeaText, color },
        status: 'submitted'
      });
      if (error) throw error;
      setNewIdeaText('');
      fetchData();
      toast('IDEA PINNED TO BOARD 📌');
    } catch (err: any) {
      toast(err.message);
    } finally {
      setPostingIdea(false);
    }
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

  const handleDeleteIdea = async (ideaId: string) => {
    if (!window.confirm('Delete this idea?')) return;
    try {
      const { error } = await supabase.from('submissions').delete().eq('id', ideaId);
      if (error) throw error;
      fetchData();
      toast('IDEA DELETED ✕');
    } catch (err: any) {
      toast(err.message);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
      {loading ? (
        <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3 }}>SYNCHRONIZING MISSIONS...</p>
      ) : (
        <>
          {/* CAMPAIGNS SECTION */}
          <div>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 4 }}>CAMPAIGN CENTER</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.4, letterSpacing: 3 }}>JOIN ACTIVE MISSIONS AND TRACK PROGRESS</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {campaigns.length === 0 ? (
                <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.25 }}>No active missions detected.</p>
              ) : (
                campaigns.map((c) => {
                  const target = parseInt(c.reach_target) || 1;
                  const actual = c.actual_reach || 0;
                  const progress = Math.min((actual / target) * 100, 100);

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
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* IDEA BOARD SECTION */}
          <div style={{ paddingTop: 32, borderTop: '1px solid rgba(188,168,142,0.1)' }}>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 4 }}>CAMPAIGN IDEA BOARD</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.4, letterSpacing: 3 }}>PIN YOUR IDEAS FOR THE TEAM</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(188,168,142,0.2)', padding: 32, marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <CinemaTextarea label="NEW IDEA" placeholder="What's your campaign idea?" value={newIdeaText} onChange={setNewIdeaText} rows={3} />
              <CinemaButton onClick={handlePostIdea} loading={postingIdea} disabled={postingIdea || !newIdeaText.trim()} style={{ fontSize: 12, padding: '10px 24px' }}>
                PIN IDEA 📌
              </CinemaButton>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24, padding: 20 }}>
              {(() => {
                const marketingIdeas = ideas;

                if (marketingIdeas.length === 0) {
                  return <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.25, gridColumn: '1 / -1' }}>No ideas pinned yet.</p>;
                }

                return marketingIdeas.map((idea) => {
                  const isOwner = idea.user_id === user?.id;
                  const canDelete = isOwner || isAdmin;
                  return (
                    <motion.div key={idea.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                      style={{
                        background: idea.data?.color || '#fef08a',
                        color: '#1a1a1a',
                        padding: '24px 20px',
                        position: 'relative',
                        boxShadow: '4px 6px 12px rgba(0,0,0,0.15)',
                        transform: `rotate(${Math.random() * 4 - 2}deg)`,
                        minHeight: 150,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {canDelete && (
                        <button 
                          onClick={() => handleDeleteIdea(idea.id)}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'none',
                            border: 'none',
                            color: 'rgba(0,0,0,0.4)',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 'bold',
                            zIndex: 10,
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            lineHeight: 1,
                            transition: 'color 0.2s, background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(0,0,0,0.4)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          ✕
                        </button>
                      )}

                      {/* The pin */}
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 12,
                        height: 12,
                        background: '#ef4444',
                        borderRadius: '50%',
                        boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.3), 1px 1px 2px rgba(0,0,0,0.2)',
                        zIndex: 2
                      }} />
                      {/* Pin reflection */}
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-80%)',
                        width: 3,
                        height: 3,
                        background: 'rgba(255,255,255,0.8)',
                        borderRadius: '50%',
                        zIndex: 3
                      }} />

                      <div style={{ flex: 1, marginTop: 12, fontFamily: 'Inter, monospace', fontSize: 13, lineHeight: 1.6, wordWrap: 'break-word', fontWeight: 500 }}>
                        {idea.data?.text || ''}
                      </div>
                      
                      <div style={{ fontSize: 9, opacity: 0.6, marginTop: 16, textAlign: 'right', fontFamily: 'Montserrat, sans-serif', letterSpacing: 1 }}>
                        — {idea.profiles?.full_name || 'Member'} ({idea.profiles?.role === 'admin' || (Array.isArray(idea.profiles?.roles) && idea.profiles.roles.includes('admin')) ? 'Admin' : 'Marketing'})
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </div>

          {/* THE COLLAB BRIEF SECTION */}
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
        </>
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
