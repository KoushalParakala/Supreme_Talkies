import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
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
  const [customTagMode, setCustomTagMode] = useState(false);
  const [customTagValue, setCustomTagValue] = useState('');

  const toggleTag = (tag: string) => {
    if (tag === '+') {
      setCustomTagMode(true);
      return;
    }
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

  const handleCustomTagSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTagValue.trim()) {
      e.preventDefault();
      const newTag = customTagValue.trim();
      if (!single) {
        const current = selected as string[];
        if (!current.includes(newTag) && (!max || current.length < max)) {
          onChange([...current, newTag]);
        }
      } else {
        onChange(newTag);
      }
      setCustomTagMode(false);
      setCustomTagValue('');
    }
  };

  const allTags = [...tags];
  if (!single && Array.isArray(selected)) {
    selected.forEach(t => {
      if (!allTags.includes(t)) allTags.splice(allTags.length - 1, 0, t);
    });
  } else if (single && selected && !allTags.includes(selected as string)) {
    allTags.splice(allTags.length - 1, 0, selected as string);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 5, textTransform: 'uppercase' }}>
        {label} {max && !single && <span style={{ opacity: 0.4, fontSize: 8 }}> (MAX {max})</span>}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {allTags.map(tag => {
          const isSelected = single ? selected === tag : (selected as string[]).includes(tag);
          if (tag === '+') {
            if (customTagMode) {
              return (
                <input
                  key="custom-input"
                  autoFocus
                  type="text"
                  placeholder="Type & Enter"
                  value={customTagValue}
                  onChange={(e) => setCustomTagValue(e.target.value)}
                  onKeyDown={handleCustomTagSubmit}
                  onBlur={() => setCustomTagMode(false)}
                  style={{
                    padding: '6px 14px', borderRadius: 2, background: 'transparent',
                    border: '1px dashed #BCA88E', color: '#F0EBE0',
                    fontFamily: '"Montserrat", sans-serif', fontSize: 10, letterSpacing: 3,
                    outline: 'none', width: 120, textTransform: 'uppercase'
                  }}
                />
              );
            }
          }
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

const GENRE_OPTIONS = ['Drama', 'Thriller', 'Comedy', 'Romance', 'Documentary', 'Experimental', 'Horror', 'Action', 'Sci-Fi', 'Period', '+'];
const BUDGET_OPTIONS = ['Under ₹100T', '₹100T–500T', '₹500T–2000T', '₹2000T+', 'Not Disclosed'];
const TIMELINE_OPTIONS = ['< 1 Month', '1–3 Months', '3–6 Months', '6+ Months'];
const LOOKING_FOR_OPTIONS = ['Writer', 'Director', 'Technician', 'Presenter', 'Member', '+'];

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
  const [allBriefs, setAllBriefs] = useState<any[]>([]);
  const [briefSubView, setBriefSubView] = useState<'discover' | 'mine'>('discover');
  const [showNewBriefForm, setShowNewBriefForm] = useState(false);
  const [newBrief, setNewBrief] = useState({ 
    title: '', description: '', genre: [] as string[], budget_range: '', timeline: '', looking_for: [] as string[] 
  });
  const [submittingBrief, setSubmittingBrief] = useState(false);
  const [expandingBriefId, setExpandingBriefId] = useState<string | null>(null);
  const [interests, setInterests] = useState<Record<string, any[]>>({});
  const [loadingInterests, setLoadingInterests] = useState<string | null>(null);
  const [userBriefInterests, setUserBriefInterests] = useState<Set<string>>(new Set());
  const [togglingInterest, setTogglingInterest] = useState<string | null>(null);

  const fetchDataRef = useRef(0);
  const fetchBriefsRef = useRef(0);

  useEffect(() => {
    fetchData();
    if (user) {
      fetchBriefs();
      fetchAllBriefs();
      fetchMyBriefInterests();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchBriefs = async () => {
    if (!user) return;
    const fetchId = ++fetchBriefsRef.current;
    try {
      const { data, error } = await supabase
        .from('film_briefs')
        .select('*, brief_interests(count)')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (fetchId !== fetchBriefsRef.current) return;
      if (error) throw error;
      setBriefs(data || []);
    } catch (err) {
      if (fetchId !== fetchBriefsRef.current) return;
      console.error('Error fetching briefs:', err);
    }
  };

  const fetchAllBriefs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('film_briefs')
        .select('*')
        .eq('is_open', true)
        .neq('producer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch producer names
      const producerIds = [...new Set((data || []).map((b: any) => b.producer_id))];
      let producerMap = new Map();
      if (producerIds.length > 0) {
        const { data: producers } = await supabase.from('member_directory').select('id, full_name').in('id', producerIds);
        if (producers) producerMap = new Map(producers.map(p => [p.id, p]));
      }

      setAllBriefs((data || []).map((b: any) => ({
        ...b,
        producer: producerMap.get(b.producer_id) || null
      })));
    } catch (err) {
      console.error('Error fetching all briefs:', err);
    }
  };

  const fetchMyBriefInterests = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('brief_interests').select('brief_id').eq('user_id', user.id);
      setUserBriefInterests(new Set((data || []).map((i: any) => i.brief_id)));
    } catch (err) {
      console.error('Error fetching my interests:', err);
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

      const userIds = (data || []).map((interest: any) => interest.user_id);
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: dirProfiles, error: dirErr } = await supabase
          .from('member_directory')
          .select('id, full_name, avatar_symbol, st_id, role, st_verified, contact')
          .in('id', userIds);
        
        if (dirErr) console.error('Error fetching member_directory:', dirErr);
        if (dirProfiles) {
          profileMap = new Map(dirProfiles.map(p => [p.id, p]));
        }
      }

      setInterests({
        ...interests,
        [briefId]: (data || []).map((interest: any) => ({
          ...interest,
          user: profileMap.get(interest.user_id) || null
        }))
      });
    } catch (err) {
      console.error('Error fetching interests:', err);
    } finally {
      setLoadingInterests(null);
    }
  };

  const fetchData = async () => {
    const fetchId = ++fetchDataRef.current;
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        supabase.from('scripts').select('*').neq('status', 'draft'),
        supabase.from('audience_reactions').select('submission_id, user_id').eq('reaction', 'fire')
      ]);

      if (fetchId !== fetchDataRef.current) return;

      const writerProfiles = await fetchMemberDirectoryByIds((sRes.data || []).map((script: any) => script.user_id));
      if (fetchId !== fetchDataRef.current) return;
      setScripts((sRes.data || []).map((script: any) => ({
        ...script,
        user: writerProfiles.get(script.user_id) || null
      })));

      // Fetch users interested in this producer's briefs for the roster
      let rosterList: DirectoryProfile[] = [];
      if (user) {
        const { data: interestsData, error: interestsErr } = await supabase
          .from('brief_interests')
          .select('*, user:member_directory(*), film_briefs!inner(producer_id)')
          .eq('film_briefs.producer_id', user.id);

        if (interestsErr) console.error('Error fetching brief interests for roster:', interestsErr);

        if (interestsData) {
          const seen = new Set<string>();
          rosterList = (interestsData as any[])
            .map(item => item.user)
            .filter(u => {
              if (!u || seen.has(u.id)) return false;
              seen.add(u.id);
              return true;
            });
        }
      }
      setTechnicians(rosterList);
      
      const fires = new Set<string>();
      const counts: Record<string, number> = {};
      rRes.data?.forEach(r => {
        if (r.user_id === user?.id) fires.add(r.submission_id);
        counts[r.submission_id] = (counts[r.submission_id] || 0) + 1;
      });
      setUserFires(fires);
      setFireCounts(counts);
    } catch (err) {
      if (fetchId !== fetchDataRef.current) return;
      console.error(err);
    } finally {
      if (fetchId === fetchDataRef.current) setLoading(false);
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
      toast('INTEREST LOGGED ✦ The writer has been notified.');
    } catch (err: unknown) { toast(err instanceof Error ? err.message : String(err)); }
    finally { setExpressing(null); }
  };

  const handleFire = async (scriptId: string) => {
    if (!user || userFires.has(scriptId)) return;
    setUserFires(new Set([...userFires, scriptId]));
    setFireCounts({ ...fireCounts, [scriptId]: (fireCounts[scriptId] || 0) + 1 });

    try {
      await supabase.from('audience_reactions').insert({ submission_id: scriptId, user_id: user.id, reaction: 'fire' });
    } catch {
      fetchData();
    }
  };

  const handleBriefInterest = async (briefId: string) => {
    if (!user) return;
    setTogglingInterest(briefId);
    const alreadyInterested = userBriefInterests.has(briefId);
    try {
      if (alreadyInterested) {
        // Withdraw interest
        const { error } = await supabase.from('brief_interests').delete().eq('brief_id', briefId).eq('user_id', user.id);
        if (error) throw error;
        setUserBriefInterests(prev => { const next = new Set(prev); next.delete(briefId); return next; });
        setAllBriefs(prev => prev.map(b => b.id === briefId ? { ...b, brief_interests: [{ count: Math.max(0, (b.brief_interests?.[0]?.count || 1) - 1) }] } : b));
        toast('INTEREST WITHDRAWN');
      } else {
        // Log interest
        const { error } = await supabase.from('brief_interests').insert({ brief_id: briefId, user_id: user.id });
        if (error) throw error;
        setUserBriefInterests(prev => new Set([...prev, briefId]));
        setAllBriefs(prev => prev.map(b => b.id === briefId ? { ...b, brief_interests: [{ count: (b.brief_interests?.[0]?.count || 0) + 1 }] } : b));
        toast('INTEREST LOGGED ✦');
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Error updating interest');
    } finally {
      setTogglingInterest(null);
    }
  };

  const handleAcceptCollab = async (interest: any, briefTitle: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('collab_requests')
        .select('id')
        .eq('sender_id', interest.user_id)
        .eq('receiver_id', user.id)
        .eq('project_title', briefTitle)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const { error: updateError } = await supabase.from('collab_requests').update({ status: 'accepted' }).eq('id', data.id);
        if (updateError) throw updateError;
        toast('COLLAB ACCEPTED ✦');
      } else {
        // If not found, create one already accepted
        const { error: insertError } = await supabase.from('collab_requests').insert({
          sender_id: interest.user_id,
          receiver_id: user.id,
          project_title: briefTitle,
          message: 'Collab accepted by producer',
          status: 'accepted'
        });
        if (insertError) throw insertError;
        toast('COLLAB ACCEPTED ✦');
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Error accepting collab');
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
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteBrief = async (briefId: string) => {
    if (!window.confirm('Delete this brief permanently?')) return;
    try {
      const { error } = await supabase.from('film_briefs').delete().eq('id', briefId);
      if (error) throw error;
      fetchBriefs();
      fetchData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : String(err));
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
      fetchData();
      toast('BRIEF PUBLISHED ✦');
    } catch (err: unknown) { toast(err instanceof Error ? err.message : String(err)); }
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
                  <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(188,168,142,0.1)', border: '1px solid rgba(188,168,142,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                    {s.user?.full_name?.substring(0,1).toUpperCase() || '👤'}
                  </span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Sub-nav */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(188,168,142,0.12)' }}>
            {(['discover', 'mine'] as const).map(sv => (
              <button key={sv} type="button" onClick={() => setBriefSubView(sv)}
                style={{ background: 'none', border: 'none', borderBottom: briefSubView === sv ? '2px solid #BCA88E' : '2px solid transparent', padding: '10px 24px', fontFamily: 'Inter, monospace', fontSize: 9, letterSpacing: 4, color: briefSubView === sv ? '#BCA88E' : 'rgba(240,235,224,0.3)', cursor: 'pointer', transition: 'color 0.2s', marginBottom: -1, textTransform: 'uppercase' }}>
                {sv === 'discover' ? 'DISCOVER BRIEFS' : 'MY BRIEFS'}
              </button>
            ))}
          </div>

          {briefSubView === 'discover' ? (
            /* ─── DISCOVER: All open briefs from other producers ─── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {allBriefs.length === 0 ? (
                <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.25, letterSpacing: 2, fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>
                  "The stage is yours to claim." — No open briefs from other producers yet.
                </p>
              ) : (
                allBriefs.map((b) => {
                  const interestCount = b.brief_interests?.[0]?.count || 0;
                  const hasInterested = userBriefInterests.has(b.id);
                  return (
                    <div key={b.id} style={{ background: 'rgba(30,32,41,0.4)', border: `1px solid ${hasInterested ? 'rgba(188,168,142,0.4)' : 'rgba(188,168,142,0.12)'}`, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, transition: 'border-color 0.3s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ fontFamily: 'Playfair Display, sans-serif', fontStyle: 'italic', fontSize: 20, color: '#F0EBE0', margin: '0 0 6px' }}>{b.title}</h3>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: 0 }}>BY {b.producer?.full_name?.toUpperCase() || 'PRODUCER'}</p>
                        </div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 3, margin: 0, fontWeight: 700 }}>
                          {interestCount > 0 ? `🔥 ${interestCount} INTERESTED` : 'BE FIRST'}
                        </p>
                      </div>

                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.7, lineHeight: 1.7, margin: 0 }}>{b.description}</p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                        {b.genre?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', letterSpacing: 4, opacity: 0.5 }}>GENRE</span>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {b.genre.map((g: string) => <span key={g} style={{ fontSize: 9, color: '#F0EBE0', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', border: '1px solid rgba(188,168,142,0.1)' }}>{g}</span>)}
                            </div>
                          </div>
                        )}
                        {b.looking_for?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', letterSpacing: 4, opacity: 0.5 }}>LOOKING FOR</span>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {b.looking_for.map((l: string) => <span key={l} style={{ fontSize: 9, color: '#BCA88E', border: '1px solid #BCA88E', padding: '2px 8px' }}>{l.toUpperCase()}</span>)}
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', letterSpacing: 4, opacity: 0.5 }}>BUDGET & TIMELINE</span>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', margin: 0 }}>{b.budget_range} • {b.timeline}</p>
                        </div>
                      </div>

                      <div style={{ paddingTop: 16, borderTop: '1px solid rgba(188,168,142,0.1)' }}>
                        <CinemaButton
                          onClick={() => handleBriefInterest(b.id)}
                          loading={togglingInterest === b.id}
                          style={hasInterested ? { borderColor: '#BCA88E', color: '#BCA88E', background: 'rgba(188,168,142,0.08)' } : {}}
                        >
                          {togglingInterest === b.id ? '...' : hasInterested ? '✦ INTERESTED — WITHDRAW' : '+ EXPRESS INTEREST'}
                        </CinemaButton>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ─── MY BRIEFS: Producer manages their own ─── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 22, color: '#BCA88E', letterSpacing: 2, marginBottom: 6 }}>MY BRIEFS</p>
                  <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.4, letterSpacing: 3 }}>MANAGE YOUR OPEN CALLS</p>
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
                    const maxInterests = Math.max(...briefs.map(br => br.brief_interests?.[0]?.count || 0), 0);
                    const isTrending = interestCount > 0 && interestCount === maxInterests;

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
                                        <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(188,168,142,0.1)', border: '1px solid rgba(188,168,142,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, flexShrink: 0 }}>
                                          {interest.user?.full_name?.substring(0,1).toUpperCase() || '?'}
                                        </span>
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 14, color: '#F0EBE0', margin: 0 }}>{interest.user?.full_name || 'Unknown'}</p>
                                            {interest.user?.st_verified && <span style={{ color: '#BCA88E', fontSize: 10 }}>✦</span>}
                                          </div>
                                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0, letterSpacing: 2 }}>
                                            {interest.user?.role?.toUpperCase()} • {interest.user?.st_id ? (interest.user.st_id.startsWith('SUPR-') ? interest.user.st_id : `SUPR-${interest.user.st_id}`) : 'N/A'}
                                          </p>
                                          {interest.note && (
                                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F0EBE0', opacity: 0.5, fontStyle: 'italic', margin: '4px 0 0' }}>
                                              "{interest.note}"
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
                                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 8, color: '#BCA88E', opacity: 0.3, margin: 0 }}>
                                          {new Date(interest.created_at).toLocaleDateString()}
                                        </p>
                                        <CinemaButton 
                                          onClick={() => handleAcceptCollab(interest, b.title)}
                                          style={{ padding: '8px 16px', fontSize: 10, letterSpacing: 2 }}
                                        >
                                          ACCEPT COLLAB
                                        </CinemaButton>
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
          )}
        </div>
      ) : (
        /* THE ROSTER TAB */
        technicians.length === 0 ? (
          <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.25, letterSpacing: 2 }}>No interested crew members yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {technicians.map((t) => (
              <div key={t.id} style={{ border: '1px solid rgba(188,168,142,0.12)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, border: '1px solid rgba(188,168,142,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.avatar_symbol || '👤'}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 14, color: '#F0EBE0', letterSpacing: 1, margin: 0 }}>{t.full_name}</p>
                      {t.st_verified && <span style={{ color: '#BCA88E', fontSize: 10 }}>✦</span>}
                    </div>
                    <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 3 }}>{t.niche?.toUpperCase() || t.role?.toUpperCase() || 'CREW'}</p>
                  </div>
                </div>
                {t.note_to_team && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#F0EBE0', opacity: 0.6, fontStyle: 'italic', margin: '4px 0 0', lineHeight: 1.5 }}>
                    "{t.note_to_team}"
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  {t.portfolio_url ? (
                    <a href={t.portfolio_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.8, letterSpacing: 2, textDecoration: 'underline' }}>
                      VIEW SHOWREEL →
                    </a>
                  ) : (
                    <span style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.4 }}>NO PORTFOLIO</span>
                  )}
                  {t.contact && (
                    <span style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.7 }}>
                      {t.contact}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
