import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { DirectoryProfile, fetchMemberDirectoryByIds } from '../../lib/directory';

/* ── Shared UI Components ── */
function CinemaInput({ label, placeholder, value, onChange, type = 'text' }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 5, opacity: focused ? 1 : 0.7, textTransform: 'uppercase' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${focused ? '#BCA88E' : 'rgba(188,168,142,0.3)'}`, paddingBottom: 10, fontFamily: 'Inter, monospace', fontSize: 13, color: '#F0EBE0', width: '100%', outline: 'none', transition: 'border-color 0.2s' }}
      />
    </div>
  );
}

function CinemaTextarea({ label, placeholder, value, onChange, rows = 3 }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 5, opacity: focused ? 1 : 0.7, textTransform: 'uppercase' }}>{label}</label>
      <textarea rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${focused ? '#BCA88E' : 'rgba(188,168,142,0.3)'}`, paddingBottom: 10, fontFamily: 'Inter, monospace', fontSize: 13, color: '#F0EBE0', width: '100%', outline: 'none', resize: 'none', lineHeight: 1.7, transition: 'border-color 0.2s' }}
      />
    </div>
  );
}

function CinemaButton({ children, onClick, loading, style, disabled }: { children: React.ReactNode; onClick?: () => void; loading?: boolean; style?: any; disabled?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button type="button" onClick={onClick} disabled={loading || disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      animate={{ background: (hov && !loading && !disabled) ? '#BCA88E' : 'transparent', color: (hov && !loading && !disabled) ? '#1e2029' : '#BCA88E', opacity: (loading || disabled) ? 0.5 : 1 }}
      transition={{ duration: 0.2 }}
      style={{ border: '1px solid #BCA88E', padding: '10px 28px', fontFamily: 'Playfair Display, sans-serif', fontSize: 12, letterSpacing: 4, display: 'flex', alignItems: 'center', gap: 8, cursor: (loading || disabled) ? 'not-allowed' : 'pointer', ...style }}
    >
      {loading && <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />}
      {children}
    </motion.button>
  );
}

function TagPicker({ label, tags, selected, onChange, max, single }: {
  label: string; tags: string[]; selected: string | string[]; onChange: (v: any) => void; max?: number; single?: boolean;
}) {
  const toggleTag = (tag: string) => {
    if (single) {
      onChange(tag);
      return;
    }
    const current = selected as string[];
    if (current.includes(tag)) {
      onChange(current.filter(t => t !== tag));
    } else if (!max || current.length < max) {
      onChange([...current, tag]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 5, textTransform: 'uppercase' }}>
        {label} {max && !single && <span style={{ opacity: 0.4, fontSize: 8 }}> (MAX {max})</span>}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map(tag => {
          const isSelected = single ? selected === tag : (selected as string[]).includes(tag);
          return (
            <motion.button
              key={tag} type="button" whileTap={{ scale: 0.97 }}
              onClick={() => toggleTag(tag)}
              style={{
                padding: '6px 14px', borderRadius: 2,
                background: isSelected ? 'rgba(188,168,142,0.12)' : 'transparent',
                border: `1px solid ${isSelected ? '#BCA88E' : 'rgba(188,168,142,0.2)'}`,
                color: isSelected ? '#F0EBE0' : 'rgba(188,168,142,0.5)',
                fontFamily: '"Montserrat", sans-serif', fontSize: 10, letterSpacing: 3,
                cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase'
              }}
            >
              {tag}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

const GENRE_OPTIONS = ['Drama', 'Thriller', 'Comedy', 'Romance', 'Documentary', 'Experimental', 'Horror', 'Action', 'Sci-Fi', 'Period'];
const BUDGET_OPTIONS = ['Under ₹1L', '₹1L–5L', '₹5L–20L', '₹20L+', 'Not Disclosed'];
const TIMELINE_OPTIONS = ['< 1 Month', '1–3 Months', '3–6 Months', '6+ Months'];
const LOOKING_FOR_OPTIONS = ['Writer', 'Director', 'Technician', 'Presenter', 'Member'];

export default function ProducerDashboard() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<DirectoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'scripts' | 'crew' | 'briefs'>('scripts');
  const [expressing, setExpressing] = useState<string | null>(null);

  const [userFires, setUserFires] = useState<Set<string>>(new Set());
  const [fireCounts, setFireCounts] = useState<Record<string, number>>({});

  // Briefs State
  const [briefs, setBriefs] = useState<any[]>([]);
  const [showNewBriefForm, setShowNewBriefForm] = useState(false);
  const [newBrief, setNewBrief] = useState({ 
    title: '', description: '', genre: [] as string[], budget_range: '', timeline: '', looking_for: [] as string[] 
  });
  const [submittingBrief, setSubmittingBrief] = useState(false);
  const [expandingBriefId, setExpandingBriefId] = useState<string | null>(null);
  const [interests, setInterests] = useState<Record<string, any[]>>({});
  const [loadingInterests, setLoadingInterests] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    if (user) fetchBriefs();
  }, [user]);

  const fetchBriefs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('film_briefs')
        .select('*, brief_interests(count)')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBriefs(data || []);
    } catch (err) {
      console.error('Error fetching briefs:', err);
    }
  };

  const fetchInterests = async (briefId: string) => {
    setLoadingInterests(briefId);
    try {
      const { data, error } = await supabase
        .from('brief_interests')
        .select('*')
        .eq('brief_id', briefId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      const interestProfiles = await fetchMemberDirectoryByIds((data || []).map((interest: any) => interest.user_id));
      setInterests({
        ...interests,
        [briefId]: (data || []).map((interest: any) => ({
          ...interest,
          user: interestProfiles.get(interest.user_id) || null
        }))
      });
    } catch (err) {
      console.error('Error fetching interests:', err);
    } finally {
      setLoadingInterests(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, tRes, rRes] = await Promise.all([
        supabase.from('scripts').select('*').neq('status', 'draft'),
        supabase.from('member_directory').select('*').contains('roles', ['technician']).eq('availability', true),
        supabase.from('audience_reactions').select('submission_id, user_id').eq('reaction', 'fire')
      ]);

      const writerProfiles = await fetchMemberDirectoryByIds((sRes.data || []).map((script: any) => script.user_id));
      setScripts((sRes.data || []).map((script: any) => ({
        ...script,
        user: writerProfiles.get(script.user_id) || null
      })));
      setTechnicians(tRes.data || []);
      
      const fires = new Set<string>();
      const counts: Record<string, number> = {};
      rRes.data?.forEach(r => {
        if (r.user_id === user?.id) fires.add(r.submission_id);
        counts[r.submission_id] = (counts[r.submission_id] || 0) + 1;
      });
      setUserFires(fires);
      setFireCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInterest = async (scriptId: string) => {
    if (!user) return;
    setExpressing(scriptId);
    try {
      // Create a collab request or interest entry
      await supabase.from('collab_requests').insert({
        sender_id: user.id,
        receiver_id: scripts.find(s => s.id === scriptId)?.user_id,
        project_title: scripts.find(s => s.id === scriptId)?.title,
        message: "A Producer has expressed interest in your script and would like to discuss potential development."
      });
      alert('INTEREST LOGGED ✦ The writer has been notified.');
    } catch (err: any) { alert(err.message); }
    finally { setExpressing(null); }
  };

  const handleFire = async (scriptId: string) => {
    if (!user || userFires.has(scriptId)) return;
    setUserFires(new Set([...userFires, scriptId]));
    setFireCounts({ ...fireCounts, [scriptId]: (fireCounts[scriptId] || 0) + 1 });

    try {
      await supabase.from('audience_reactions').insert({ submission_id: scriptId, user_id: user.id, reaction: 'fire' });
    } catch (err) {
      fetchData();
    }
  };

  const handleToggleBriefStatus = async (briefId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('film_briefs')
        .update({ is_open: !currentStatus })
        .eq('id', briefId);
      
      if (error) throw error;
      fetchBriefs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteBrief = async (briefId: string) => {
    if (!window.confirm('Delete this brief permanently?')) return;
    try {
      const { error } = await supabase.from('film_briefs').delete().eq('id', briefId);
      if (error) throw error;
      fetchBriefs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const submitBrief = async () => {
    if (!user || !newBrief.title) return;
    setSubmittingBrief(true);
    try {
      const { error } = await supabase.from('film_briefs').insert({ 
        producer_id: user.id, 
        ...newBrief,
        is_open: true
      });
      if (error) throw error;
      setNewBrief({ title: '', description: '', genre: [], budget_range: '', timeline: '', looking_for: [] });
      setShowNewBriefForm(false);
      fetchBriefs();
      alert('BRIEF PUBLISHED ✦');
    } catch (err: any) { alert(err.message); }
    finally { setSubmittingBrief(false); }
  };

  const TABS = [
    { id: 'scripts', label: 'MY SCRIPTS' },
    { id: 'briefs', label: 'FILM BRIEFS' },
    { id: 'crew', label: 'ROSTER' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(188,168,142,0.12)' }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setView(t.id as any)}
            style={{ background: 'none', border: 'none', borderBottom: view === t.id ? '2px solid #BCA88E' : '2px solid transparent', padding: '12px 28px', fontFamily: 'Inter, monospace', fontSize: 10, letterSpacing: 4, color: view === t.id ? '#BCA88E' : 'rgba(240,235,224,0.3)', cursor: 'pointer', transition: 'color 0.2s', marginBottom: -1 }}
          >{t.label}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3 }}>FILTERING THE VAULT...</p>
      ) : view === 'scripts' ? (
        scripts.length === 0 ? (
          <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.25, letterSpacing: 2 }}>The vault is locked. No scripts available for production yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
            {scripts.map((s) => (
              <div key={s.id} style={{ padding: '24px 0', borderBottom: '1px solid rgba(188,168,142,0.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 1 }}>{s.title}</p>
                  <span style={{ fontSize: 18 }}>{s.user?.avatar_symbol}</span>
                </div>
                <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.4, fontStyle: 'italic', lineHeight: 1.6, minHeight: 60 }}>"{s.logline}"</p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {s.dna_mood?.map((m: string) => (
                    <span key={m} style={{ fontSize: 8, background: 'rgba(188,168,142,0.05)', border: '1px solid rgba(188,168,142,0.1)', padding: '2px 8px', color: '#BCA88E', letterSpacing: 2, borderRadius: 10 }}>{m.toUpperCase()}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(188,168,142,0.06)' }}>
                  <span style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3 }}>{s.dna_format?.toUpperCase()}</span>
                  
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <button onClick={() => handleFire(s.id)}
                        style={{ 
                          padding: '6px 12px', border: '1px solid rgba(188,168,142,0.15)', background: userFires.has(s.id) ? 'rgba(188,168,142,0.1)' : 'transparent',
                          borderColor: userFires.has(s.id) ? '#BCA88E' : 'rgba(188,168,142,0.15)', color: '#BCA88E', fontFamily: 'Inter, monospace', fontSize: 11, cursor: userFires.has(s.id) ? 'default' : 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        🔥 {fireCounts[s.id] || 0}
                      </button>
                    </div>

                    <CinemaButton onClick={() => handleInterest(s.id)} loading={expressing === s.id}>
                      {expressing === s.id ? 'SENDING' : 'EXPRESS INTEREST  →'}
                    </CinemaButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : view === 'briefs' ? (
        /* FILM BRIEFS TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 22, color: '#BCA88E', letterSpacing: 2, marginBottom: 6 }}>FILM BRIEFS</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.4, letterSpacing: 3 }}>CALLING THE CREW TO THE SET</p>
            </div>
            <CinemaButton onClick={() => setShowNewBriefForm(!showNewBriefForm)}>
              {showNewBriefForm ? 'CANCEL' : '+ NEW BRIEF'}
            </CinemaButton>
          </div>

          <AnimatePresence>
            {showNewBriefForm && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', background: 'rgba(188,168,142,0.03)', border: '1px solid rgba(188,168,142,0.1)', padding: 32 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 680 }}>
                  <CinemaInput label="PROJECT TITLE" placeholder="e.g. The Midnight Heist" value={newBrief.title} onChange={(v) => setNewBrief({ ...newBrief, title: v })} />
                  <CinemaTextarea label="DESCRIPTION" placeholder="What's this project about?" value={newBrief.description} onChange={(v) => setNewBrief({ ...newBrief, description: v })} rows={4} />
                  
                  <TagPicker label="GENRE" tags={GENRE_OPTIONS} selected={newBrief.genre} onChange={(v) => setNewBrief({ ...newBrief, genre: v })} max={3} />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                    <TagPicker label="BUDGET RANGE" tags={BUDGET_OPTIONS} selected={newBrief.budget_range} onChange={(v) => setNewBrief({ ...newBrief, budget_range: v })} single />
                    <TagPicker label="TIMELINE" tags={TIMELINE_OPTIONS} selected={newBrief.timeline} onChange={(v) => setNewBrief({ ...newBrief, timeline: v })} single />
                  </div>

                  <TagPicker label="LOOKING FOR" tags={LOOKING_FOR_OPTIONS} selected={newBrief.looking_for} onChange={(v) => setNewBrief({ ...newBrief, looking_for: v })} max={5} />

                  <div style={{ marginTop: 16 }}>
                    <CinemaButton onClick={submitBrief} loading={submittingBrief} style={{ padding: '14px 44px', fontSize: 14 }} disabled={!newBrief.title}>
                      PUBLISH BRIEF
                    </CinemaButton>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {briefs.length === 0 ? (
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.25, letterSpacing: 2, fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>
                "Every great film starts with a clear vision." — No briefs published yet.
              </p>
            ) : (
              briefs.map((b) => {
                const interestCount = b.brief_interests?.[0]?.count || 0;
                // Trending logic simplified: For now, if we had first_interest_at, we'd use it.
                // As a fallback, we'll mark as trending if it has interests and is relatively new.
                const isNew = (new Date().getTime() - new Date(b.created_at).getTime()) < (48 * 60 * 60 * 1000);
                const isTrending = interestCount > 0 && isNew;

                return (
                  <div key={b.id} style={{ background: 'rgba(30,32,41,0.4)', border: '1px solid rgba(188,168,142,0.12)', padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <h3 style={{ fontFamily: 'Playfair Display, sans-serif', fontStyle: 'italic', fontSize: 20, color: '#F0EBE0', margin: 0 }}>{b.title}</h3>
                        <span style={{ 
                          fontFamily: 'Inter, monospace', fontSize: 9, letterSpacing: 2, padding: '3px 10px', 
                          background: b.is_open ? 'rgba(100,200,120,0.15)' : 'rgba(255,100,100,0.15)', 
                          color: b.is_open ? '#64c878' : '#ff6464', border: `1px solid ${b.is_open ? '#64c878' : '#ff6464'}` 
                        }}>
                          {b.is_open ? 'OPEN' : 'CLOSED'}
                        </span>
                        {isTrending && (
                          <motion.span 
                            animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                            style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 800, color: '#BCA88E', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            🔥 TRENDING
                          </motion.span>
                        )}
                      </div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 3, margin: 0, fontWeight: 700 }}>
                        {interestCount > 0 ? `🔥 ${interestCount} INTERESTED` : 'NO INTERESTS YET'}
                      </p>
                    </div>

                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.7, lineHeight: 1.7, margin: 0 }}>{b.description}</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', letterSpacing: 4, opacity: 0.5 }}>GENRE</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {b.genre?.map((g: string) => (
                            <span key={g} style={{ fontSize: 9, color: '#F0EBE0', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', border: '1px solid rgba(188,168,142,0.1)' }}>{g}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', letterSpacing: 4, opacity: 0.5 }}>LOOKING FOR</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {b.looking_for?.map((l: string) => (
                            <span key={l} style={{ fontSize: 9, color: '#BCA88E', border: '1px solid #BCA88E', padding: '2px 8px' }}>{l.toUpperCase()}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', letterSpacing: 4, opacity: 0.5 }}>BUDGET & TIMELINE</span>
                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', margin: 0 }}>{b.budget_range} • {b.timeline}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(188,168,142,0.1)' }}>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <CinemaButton onClick={() => {
                          if (expandingBriefId === b.id) setExpandingBriefId(null);
                          else { setExpandingBriefId(b.id); fetchInterests(b.id); }
                        }}>
                          {expandingBriefId === b.id ? 'HIDE INTERESTS' : 'VIEW INTERESTS'}
                        </CinemaButton>
                        <button 
                          onClick={() => handleToggleBriefStatus(b.id, b.is_open)}
                          style={{ background: 'none', border: '1px solid rgba(188,168,142,0.3)', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 3, padding: '10px 20px', cursor: 'pointer' }}
                        >
                          {b.is_open ? 'CLOSE BRIEF' : 'REOPEN BRIEF'}
                        </button>
                      </div>
                      <button 
                        onClick={() => handleDeleteBrief(b.id)}
                        style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: 18, cursor: 'pointer', opacity: 0.6 }}
                        title="Delete Brief"
                      >✕</button>
                    </div>

                    {/* Interest Signals Expansion */}
                    <AnimatePresence>
                      {expandingBriefId === b.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden', marginTop: 12, borderTop: '1px solid rgba(188,168,142,0.05)', paddingTop: 20 }}
                        >
                          {loadingInterests === b.id ? (
                            <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.4 }}>SCANNING SIGNALS...</p>
                          ) : !interests[b.id] || interests[b.id].length === 0 ? (
                            <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.3 }}>No interests recorded yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {interests[b.id].map((interest) => (
                                <div key={interest.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderLeft: '2px solid #BCA88E' }}>
                                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    <span style={{ fontSize: 24 }}>{interest.user?.avatar_symbol}</span>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 14, color: '#F0EBE0', margin: 0 }}>{interest.user?.full_name}</p>
                                        {interest.user?.st_verified && <span style={{ color: '#BCA88E', fontSize: 10 }}>✦</span>}
                                      </div>
                                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0, letterSpacing: 2 }}>
                                        {interest.user?.role?.toUpperCase()} • SUPR ID: {interest.user?.st_id}
                                      </p>
                                      {interest.note && (
                                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F0EBE0', opacity: 0.5, fontStyle: 'italic', margin: '4px 0 0' }}>
                                          "{interest.note}"
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontFamily: 'Inter, monospace', fontSize: 8, color: '#BCA88E', opacity: 0.3, marginBottom: 8 }}>
                                      {new Date(interest.created_at).toLocaleDateString()}
                                    </p>
                                    <a 
                                      href={`mailto:admin@supremetalkies.com?subject=Interest Signal: ${interest.user?.full_name} for Brief ${b.title}`}
                                      style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#BCA88E', letterSpacing: 2, textDecoration: 'underline', fontWeight: 600 }}
                                    >
                                      REACH OUT
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* THE ROSTER TAB */
        technicians.length === 0 ? (
          <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.25, letterSpacing: 2 }}>No verified technicians yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {technicians.map((t) => (
              <div key={t.id} style={{ border: '1px solid rgba(188,168,142,0.12)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, border: '1px solid rgba(188,168,142,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.avatar_symbol}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 14, color: '#F0EBE0', letterSpacing: 1, margin: 0 }}>{t.full_name}</p>
                      {t.st_verified && <span style={{ color: '#BCA88E', fontSize: 10 }}>✦</span>}
                    </div>
                    <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 3 }}>{t.niche?.toUpperCase() || 'TECHNICIAN'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {t.skills?.slice(0, 3).map((sk: string) => (
                    <span key={sk} style={{ fontSize: 7, border: '1px solid rgba(188,168,142,0.2)', padding: '1px 5px', color: '#BCA88E' }}>{sk.toUpperCase()}</span>
                  ))}
                </div>
                <a href={t.portfolio_url || undefined} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, textDecoration: 'underline' }}>
                  VIEW SHOWREEL →
                </a>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
