import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

/* ── Shared Cinema Input ── */
function CinemaInput({ label, type = 'text', placeholder, value, onChange, required }: {
  label: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 5, opacity: focused ? 1 : 0.7 }}>
        {label}{required && ' *'}
      </label>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${focused ? '#BCA88E' : 'rgba(188,168,142,0.3)'}`, paddingBottom: 10, fontFamily: 'Inter, monospace', fontSize: 14, color: '#F0EBE0', width: '100%', outline: 'none', transition: 'border-color 0.2s' }}
      />
    </div>
  );
}

function CinemaTextarea({ label, placeholder, value, onChange, rows = 3 }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 5, opacity: focused ? 1 : 0.7 }}>{label}</label>
      <textarea rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${focused ? '#BCA88E' : 'rgba(188,168,142,0.3)'}`, paddingBottom: 10, fontFamily: 'Inter, monospace', fontSize: 14, color: '#F0EBE0', width: '100%', outline: 'none', resize: 'none', lineHeight: 1.7, transition: 'border-color 0.2s' }}
      />
    </div>
  );
}

function CinemaButton({ children, onClick, disabled, loading }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      animate={{ background: hov && !disabled ? '#BCA88E' : 'transparent', color: hov && !disabled ? '#1e2029' : '#BCA88E', opacity: disabled ? 0.4 : 1 }}
      transition={{ duration: 0.2 }}
      style={{ border: '1px solid #BCA88E', padding: '13px 44px', fontFamily: 'Playfair Display, sans-serif', fontSize: 15, letterSpacing: 5, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {loading && <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />}
      {children}
    </motion.button>
  );
}

const STATUS_COLORS: Record<string, { text: string; glow: string; bg: string }> = {
  inbox:        { text: '#BCA88E',  glow: 'rgba(188,168,142,0.25)', bg: 'rgba(188,168,142,0.06)' },
  submitted:    { text: '#BCA88E',  glow: 'rgba(188,168,142,0.25)', bg: 'rgba(188,168,142,0.06)' },
  under_review: { text: '#60A5FA',  glow: 'rgba(96,165,250,0.25)',  bg: 'rgba(96,165,250,0.06)'  },
  shortlisted:  { text: '#FBBF24',  glow: 'rgba(251,191,36,0.25)',  bg: 'rgba(251,191,36,0.06)'  },
  accepted:     { text: '#34D399',  glow: 'rgba(52,211,153,0.25)',  bg: 'rgba(52,211,153,0.06)'  },
  rejected:     { text: '#F87171',  glow: 'rgba(248,113,113,0.25)', bg: 'rgba(248,113,113,0.06)' },
  archived:     { text: '#6B7280',  glow: 'rgba(107,114,128,0.2)',  bg: 'rgba(107,114,128,0.04)' },
  feedback:     { text: '#FB923C',  glow: 'rgba(251,146,60,0.25)',  bg: 'rgba(251,146,60,0.06)'  },
};

const STATUS_LABELS: Record<string, string> = {
  inbox:        'INBOX',
  submitted:    'INBOX',
  under_review: 'UNDER REVIEW',
  shortlisted:  'SHORTLISTED',
  accepted:     'ACCEPTED',
  rejected:     'REJECTED',
  archived:     'ARCHIVED',
  feedback:     'FEEDBACK',
};

const VERSION_PALETTE = ['#BCA88E','#60A5FA','#FBBF24','#34D399','#F87171','#A78BFA','#FB923C','#E879F9'];

const MOOD_TAGS = ['Dark', 'Hopeful', 'Tense', 'Melancholic', 'Surreal', 'Raw', 'Lyrical', 'Violent', 'Nostalgic', 'Comic'];
const SETTING_TAGS = ['Urban', 'Rural', 'Period', 'Future', 'Road', 'Interior', 'Festival', 'Prison', 'Hospital', 'Campus'];
const FORMAT_OPTIONS = ['Feature Film', 'Short Film', 'Web Series', 'Documentary', 'Experimental'];

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

export default function WriterDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    dnaForm: { mood: [] as string[], setting: [] as string[], format: '' },
    logline: '', 
    pdfLink: '', 
    contact: '' 
  });
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'scripts' | 'briefs' | 'challenges' | 'inspiration'>('scripts');
  
  // Revision & Versions State
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [revisionData, setRevisionData] = useState({ pdfLink: '', note: '' });
  const [submittingRev, setSubmittingRev] = useState(false);
  const [versionsExpanded, setVersionsExpanded] = useState(false);
  const [versionNote, setVersionNote] = useState('');
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [savingVersion, setSavingVersion] = useState(false);

  // Challenge State
  const [challenges, setChallenges] = useState<any[]>([]);
  const [userEntries, setUserEntries] = useState<any[]>([]);

  // Inspiration State
  const [inspirationPins, setInspirationPins] = useState<any[]>([]);
  const [pinForm, setPinForm] = useState({ title: '', url: '', note: '', type: 'LINK' });
  const [submittingPin, setSubmittingPin] = useState(false);

  // Open Briefs State
  const [openBriefs, setOpenBriefs] = useState<any[]>([]);
  const [expressingBriefId, setExpressingBriefId] = useState<string | null>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => { 
    if (!user) return;
    fetchSubmissions();
    fetchChallenges();
    fetchVersionHistory();
    fetchInspirationPins();
    fetchOpenBriefs();
    fetchUserInterests();
  }, [user]);

  const fetchUserInterestsRef = useRef(0);
  const fetchOpenBriefsRef = useRef(0);
  const fetchVersionHistoryRef = useRef(0);
  const fetchInspirationPinsRef = useRef(0);
  const fetchSubmissionsRef = useRef(0);
  const fetchChallengesRef = useRef(0);

  const fetchUserInterests = async () => {
    if (!user) return;
    const fetchId = ++fetchUserInterestsRef.current;
    try {
      const { data, error } = await supabase
        .from('brief_interests')
        .select('brief_id')
        .eq('user_id', user.id);
      if (fetchId !== fetchUserInterestsRef.current) return;
      if (!error && data) {
        setUserInterests(data.map((i: any) => i.brief_id));
      }
    } catch (err) {
      if (fetchId !== fetchUserInterestsRef.current) return;
      console.error('Error fetching user interests:', err);
    }
  };

  const fetchOpenBriefs = async () => {
    const fetchId = ++fetchOpenBriefsRef.current;
    const { data } = await supabase.from('film_briefs')
      .select('*, profiles(full_name, avatar_symbol, st_id)')
      .eq('is_open', true)
      .order('created_at', { ascending: false });
    if (fetchId !== fetchOpenBriefsRef.current) return;
    setOpenBriefs(data || []);
  };

  const handleInterestInBrief = async (brief: any) => {
    if (!user) return;
    setExpressingBriefId(brief.id);
    try {
      // 0. Check for existing interest
      const { data: existing } = await supabase.from('brief_interests')
        .select('id')
        .eq('brief_id', brief.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        alert('You have already expressed interest in this brief ✦');
        setUserInterests(prev => [...prev, brief.id]);
        return;
      }

      // 1. Record interest in brief_interests table
      const { error: interestError } = await supabase.from('brief_interests').insert({
        brief_id: brief.id,
        user_id: user.id,
        note: `Writer interest`
      });
      if (interestError) throw interestError;

      // Update local state immediately
      setUserInterests(prev => [...prev, brief.id]);

      // 2. Send a collab request notification to the producer
      await supabase.from('collab_requests').insert({
        sender_id: user.id,
        receiver_id: brief.producer_id,
        project_title: brief.title,
        message: `I am interested in your film brief: "${brief.title}". I'd love to discuss my writing services.`
      });

      alert('INTEREST LOGGED ✦ The producer has been notified.');
      fetchOpenBriefs();
    } catch (err: any) { alert(err.message); }
    finally { setExpressingBriefId(null); }
  };

  const fetchVersionHistory = async () => {
    const fetchId = ++fetchVersionHistoryRef.current;
    const { data } = await supabase.from('script_versions')
      .select('*')
      .eq('user_id', user?.id)
      .order('version_number', { ascending: false });
    if (fetchId !== fetchVersionHistoryRef.current) return;
    setVersionHistory(data || []);
  };

  const fetchInspirationPins = async () => {
    const fetchId = ++fetchInspirationPinsRef.current;
    const { data } = await supabase.from('inspiration_pins').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    if (fetchId !== fetchInspirationPinsRef.current) return;
    setInspirationPins(data || []);
  };

  const fetchSubmissions = async () => {
    if (!user) return;
    const fetchId = ++fetchSubmissionsRef.current;
    try {
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('scripts')
        .select(`*, versions:script_versions(*)`)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchId !== fetchSubmissionsRef.current) return;
      if (scriptsError) throw scriptsError;
      setSubmissions(scriptsData || []);
    } catch (err: any) {
      if (fetchId !== fetchSubmissionsRef.current) return;
      console.error('Error fetching scripts:', err);
    } finally {
      if (fetchId === fetchSubmissionsRef.current) setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    if (!user) return;
    const fetchId = ++fetchChallengesRef.current;
    const { data: c } = await supabase.from('writing_challenges').select('*').eq('is_active', true).order('deadline', { ascending: true });
    if (fetchId !== fetchChallengesRef.current) return;
    const { data: e } = await supabase.from('challenge_submissions').select('*').eq('user_id', user.id);
    if (fetchId !== fetchChallengesRef.current) return;
    setChallenges(c || []);
    setUserEntries(e || []);
  };

  const handleChallengeEnter = async (challengeId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('challenge_submissions').insert({
        challenge_id: challengeId,
        user_id: user.id,
        script_id: null
      });
      if (error) throw error;
      alert('ENTRY CONFIRMED ✦');
      fetchChallenges();
    } catch (err: any) { alert(err.message); }
  };

  const handlePinSubmit = async () => {
    if (!user || !pinForm.title) return;
    setSubmittingPin(true);
    try {
      const { error } = await supabase.from('inspiration_pins').insert({
        user_id: user.id,
        ...pinForm
      });
      if (error) throw error;
      setPinForm({ title: '', url: '', note: '', type: 'LINK' });
      fetchInspirationPins();
    } catch (err: any) { alert(err.message); }
    finally { setSubmittingPin(false); }
  };

  const handlePinDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('inspiration_pins').delete().eq('id', id);
      if (error) throw error;
      fetchInspirationPins();
    } catch (err: any) { alert(err.message); }
  };

  useEffect(() => {
    if (!user) return;      // Don't subscribe until user is available

    const channel = supabase
      .channel('writer_live_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts' }, () => fetchSubmissions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'writing_challenges' }, () => fetchChallenges())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'film_briefs' }, () => fetchOpenBriefs())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brief_interests' }, () => fetchUserInterests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!user || !formData.title || !formData.pdfLink) return;
    setSubmitting(true);
    try {
      const { data: script, error } = await supabase.from('scripts').insert({ 
        user_id: user.id, 
        title: formData.title,
        logline: formData.logline,
        pdf_url: formData.pdfLink,
        dna_mood: formData.dnaForm.mood,
        dna_setting: formData.dnaForm.setting,
        dna_format: formData.dnaForm.format,
        status: 'submitted',
        version_number: 1
      }).select().single();

      if (error) throw error;

      // Create initial version entry
      await supabase.from('script_versions').insert({
        script_id: script.id,
        user_id: user.id,
        version_number: 1,
        title: formData.title,
        logline: formData.logline,
        pdf_url: formData.pdfLink,
        version_notes: 'Initial launch'
      });

      setFormData({ 
        title: '', 
        dnaForm: { mood: [], setting: [], format: '' }, 
        logline: '', 
        pdfLink: '', 
        contact: '' 
      });
      fetchSubmissions();
      fetchVersionHistory();
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleRevision = async (script: any) => {
    if (!user || !revisionData.pdfLink) return;
    setSubmittingRev(true);
    
    const nextVersion = (script.version_number || 1) + 1;

    try {
      // 1. Create new version record
      const { error: verError } = await supabase.from('script_versions').insert({
        script_id: script.id,
        user_id: user.id,
        version_number: nextVersion,
        title: script.title,
        logline: script.logline,
        pdf_url: revisionData.pdfLink,
        version_notes: revisionData.note
      });
      if (verError) throw verError;

      // 2. Update main script record
      const { error: scriptError } = await supabase.from('scripts').update({
        pdf_url: revisionData.pdfLink,
        version_number: nextVersion,
        version_notes: revisionData.note,
        updated_at: new Date().toISOString()
      }).eq('id', script.id);
      
      if (scriptError) throw scriptError;

      setExpandingId(null);
      setRevisionData({ pdfLink: '', note: '' });
      fetchSubmissions();
      fetchVersionHistory();
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setSubmittingRev(false); 
    }
  };

  const handleSaveVersionNote = async () => {
    if (!user || !versionNote || submissions.length === 0) return;
    setSavingVersion(true);
    const latestScript = submissions[0];
    const nextVer = (latestScript.version_number || 1) + 1;

    try {
      const { error } = await supabase.from('script_versions').insert({
        script_id: latestScript.id,
        user_id: user.id,
        version_number: nextVer,
        title: latestScript.title,
        logline: latestScript.logline,
        pdf_url: latestScript.pdf_url,
        version_notes: versionNote
      });
      if (error) throw error;

      await supabase.from('scripts').update({
        version_number: nextVer,
        version_notes: versionNote,
        updated_at: new Date().toISOString()
      }).eq('id', latestScript.id);

      setVersionNote('');
      fetchVersionHistory();
      fetchSubmissions();
      alert('Version note saved ✦');
    } catch (err: any) { alert(err.message); }
    finally { setSavingVersion(false); }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, paddingBottom: 80 }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(188,168,142,0.1)', paddingBottom: 0 }}>
        {[
          { id: 'scripts', label: 'MY SCRIPTS' },
          { id: 'briefs', label: 'OPEN BRIEFS' },
          { id: 'challenges', label: 'CHALLENGES' },
          { id: 'inspiration', label: 'INSPIRATION' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: activeTab === tab.id ? 'rgba(188,168,142,0.15)' : 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #BCA88E' : '2px solid transparent',
              padding: '12px 24px',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 10,
              letterSpacing: 5,
              color: '#BCA88E',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'scripts' && (
          <motion.div
            key="scripts-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 64 }}
          >
            {/* Submit form */}
            <div>
              <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 20 }} />
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 22, color: '#BCA88E', letterSpacing: 2, marginBottom: 6 }}>THE SCRIPT PORTAL</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.35, letterSpacing: 2, marginBottom: 28 }}>STORIES THAT DEMAND TO BE TOLD</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
                <CinemaInput label="SCRIPT TITLE" placeholder="e.g. The Last Frame" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} required />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <TagPicker label="MOOD TAGS" tags={MOOD_TAGS} selected={formData.dnaForm.mood} onChange={(v) => setFormData({ ...formData, dnaForm: { ...formData.dnaForm, mood: v } })} max={3} />
                  <TagPicker label="SETTING TAGS" tags={SETTING_TAGS} selected={formData.dnaForm.setting} onChange={(v) => setFormData({ ...formData, dnaForm: { ...formData.dnaForm, setting: v } })} max={3} />
                </div>

                <TagPicker label="SCRIPT FORMAT" tags={FORMAT_OPTIONS} selected={formData.dnaForm.format} onChange={(v) => setFormData({ ...formData, dnaForm: { ...formData.dnaForm, format: v } })} single />

                <CinemaTextarea label="THE LOGLINE" placeholder="The hook in one sentence..." value={formData.logline} onChange={(v) => setFormData({ ...formData, logline: v })} rows={2} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px' }}>
                  <CinemaInput label="DRIVE / PDF LINK" type="url" placeholder="https://..." value={formData.pdfLink} onChange={(v) => setFormData({ ...formData, pdfLink: v })} required />
                  <CinemaInput label="CONTACT" placeholder="+91 ..." value={formData.contact} onChange={(v) => setFormData({ ...formData, contact: v })} />
                </div>
              </div>

              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 40 }}>
                <CinemaButton onClick={handleSubmit} loading={submitting} disabled={!formData.title || !formData.pdfLink || !formData.dnaForm.format}>
                  {submitting ? 'SENDING TO SET' : 'LAUNCH SCRIPT  →'}
                </CinemaButton>

                {/* Feature 2: Draft Versions Panel */}
                <div style={{ borderTop: '1px solid rgba(188,168,142,0.1)', paddingTop: 32 }}>
                  <button 
                    onClick={() => setVersionsExpanded(!versionsExpanded)}
                    style={{ background: 'none', border: 'none', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: 0 }}
                  >
                    {versionsExpanded ? '[-] DRAFT VERSIONS' : '[+] DRAFT VERSIONS'}
                  </button>

                  <AnimatePresence>
                    {versionsExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingTop: 28, maxWidth: 680 }}>
                          {/* A) Version Form */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <CinemaTextarea label="VERSION NOTES" placeholder="What changed in this draft?" value={versionNote} onChange={setVersionNote} rows={2} />
                            <CinemaButton onClick={handleSaveVersionNote} loading={savingVersion} disabled={!versionNote || submissions.length === 0}>
                              SAVE VERSION NOTE
                            </CinemaButton>
                          </div>

                          {/* B) Version History List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {versionHistory.slice(0, 6).map((v, i) => {
                              const vColor = VERSION_PALETTE[i % VERSION_PALETTE.length];
                              return (
                              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 12, paddingTop: 12, borderBottom: i < Math.min(versionHistory.slice(0,6).length,5) ? '1px solid rgba(188,168,142,0.05)' : 'none' }}>
                                <span style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 9, fontWeight: 700, color: '#0e0f13', background: vColor, padding: '3px 8px', letterSpacing: 1, flexShrink: 0 }}>V{v.version_number}</span>
                                <span style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: vColor, opacity: 0.7, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()}
                                </span>
                                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F0EBE0', opacity: 0.65, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {v.version_notes || '—'}
                                </p>
                              </div>
                            );})}  
                            {versionHistory.length > 6 && (
                              <button style={{ background: 'none', border: 'none', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 4, cursor: 'pointer', textAlign: 'left', padding: '8px 0 0', opacity: 0.5 }}>+ {versionHistory.length - 6} MORE VERSIONS</button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Submissions list */}
            <div>
              <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 20 }} />
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 20 }}>SCRIPT STATUS</p>
              
              {loading ? (
                <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.3, letterSpacing: 2 }}>SCANNING THE ARCHIVES...</p>
              ) : submissions.length === 0 ? (
                <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.25, letterSpacing: 2, fontStyle: 'italic' }}>
                  "The first draft is just you telling yourself the story." — No submissions yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {submissions.map((script: any, scriptIdx: number) => {
                    const stKey = script.kanban_stage || script.status || 'inbox';
                    const statusMeta = STATUS_COLORS[stKey] || STATUS_COLORS['inbox'];
                    const statusLabel = STATUS_LABELS[stKey] || stKey.replace('_',' ').toUpperCase();
                    return (
                    <div key={script.id} style={{ borderBottom: '1px solid rgba(188,168,142,0.06)', paddingBottom: 28, paddingTop: scriptIdx > 0 ? 28 : 0 }}>
                      {/* Script Row: title + status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: 18, color: '#F0EBE0', letterSpacing: 1, margin: 0, lineHeight: 1.2 }}>{script.title}</p>
                          <p style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 9, color: '#BCA88E', letterSpacing: 4, opacity: 0.45, margin: 0, textTransform: 'uppercase' }}>
                            {script.dna_format || 'SCRIPT'} · {new Date(script.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                          </p>
                        </div>
                        {/* Coloured status text */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{
                            fontFamily: '"Montserrat", sans-serif',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 4,
                            color: statusMeta.text,
                            textShadow: `0 0 12px ${statusMeta.glow}`,
                            background: statusMeta.bg,
                            padding: '5px 12px',
                            borderLeft: `2px solid ${statusMeta.text}`,
                            lineHeight: 1,
                          }}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Version + Actions */}
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ background: 'rgba(255,255,255,0.015)', padding: '14px 18px', borderLeft: '1px solid rgba(188,168,142,0.1)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{
                              fontFamily: '"Montserrat", sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: 2,
                              background: VERSION_PALETTE[(script.version_number || 1) - 1 < VERSION_PALETTE.length ? (script.version_number || 1) - 1 : 0],
                              color: '#0e0f13', padding: '3px 8px'
                            }}>
                              V{script.version_number || 1}
                            </span>
                            <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.45, letterSpacing: 2, margin: 0 }}>
                              {new Date(script.updated_at || script.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                            </p>
                          </div>
                          <a href={script.pdf_url} target="_blank" rel="noopener noreferrer"
                            style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, textDecoration: 'underline' }}>
                            READ LATEST →
                          </a>
                        </div>

                        {/* Submit Revision Expander */}
                        {(script.status === 'feedback' || script.status === 'submitted' || script.status === 'under_review') && (
                          <div style={{ marginTop: 18 }}>
                            <button
                              onClick={() => setExpandingId(expandingId === script.id ? null : script.id)}
                              style={{ background: 'none', border: 'none', fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', letterSpacing: 2, cursor: 'pointer', opacity: 0.8, padding: 0 }}
                            >
                              {expandingId === script.id ? '[-] CANCEL REVISION' : '[+] SUBMIT REVISION'}
                            </button>
                            
                            {expandingId === script.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ overflow: 'hidden', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <CinemaInput label="NEW DRIVE LINK" value={revisionData.pdfLink} onChange={(v) => setRevisionData({ ...revisionData, pdfLink: v })} required />
                                <CinemaTextarea label="REVISION NOTE" placeholder="What changed in this draft?" value={revisionData.note} onChange={(v) => setRevisionData({ ...revisionData, note: v })} rows={2} />
                                <CinemaButton onClick={() => handleRevision(script)} loading={submittingRev} disabled={!revisionData.pdfLink}>
                                  SUBMIT V{(script.version_number || 1) + 1}
                                </CinemaButton>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  );})}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'briefs' && (
          <motion.div
            key="briefs-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
          >
            <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 8 }} />
            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 22, color: '#BCA88E', letterSpacing: 2, marginBottom: 6 }}>OPEN FILM BRIEFS</p>
            <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.35, letterSpacing: 2, marginBottom: 28 }}>PROJECTS SEEKING WRITERS</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {openBriefs.length === 0 ? (
                <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.25, fontStyle: 'italic' }}>No active briefs right now.</p>
              ) : openBriefs.map(brief => (
                <div key={brief.id} style={{ background: 'rgba(30,32,41,0.6)', border: '1px solid rgba(188,168,142,0.15)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, sans-serif', fontStyle: 'italic', fontSize: 18, color: '#F0EBE0', margin: 0 }}>{brief.title}</h3>
                    <span style={{ fontSize: 20 }}>{brief.profiles?.avatar_symbol || '🎬'}</span>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.7, lineHeight: 1.6, margin: 0 }}>{brief.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {brief.genre?.map((g: string) => (
                      <span key={g} style={{ fontSize: 9, color: '#BCA88E', background: 'rgba(188,168,142,0.05)', padding: '2px 8px', border: '1px solid rgba(188,168,142,0.1)' }}>{g}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(188,168,142,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', opacity: 0.5, letterSpacing: 2 }}>PRODUCER</span>
                      <span style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0' }}>{brief.profiles?.full_name}</span>
                    </div>
                    <CinemaButton 
                      onClick={() => !userInterests.includes(brief.id) && handleInterestInBrief(brief)} 
                      disabled={userInterests.includes(brief.id)}
                      loading={expressingBriefId === brief.id}
                    >
                      {expressingBriefId === brief.id ? 'LOGGING...' : userInterests.includes(brief.id) ? 'INTEREST LOGGED ✓' : 'EXPRESS INTEREST'}
                    </CinemaButton>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'challenges' && (
          <motion.div
            key="challenges-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
          >
            <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 8 }} />
            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 22, color: '#BCA88E', letterSpacing: 2, marginBottom: 32 }}>WRITING CHALLENGES</p>
            
            {challenges.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 0', opacity: 0.5 }}>
                <span style={{ fontSize: 48 }}>🎬</span>
                <p style={{ fontFamily: 'Playfair Display, sans-serif', fontStyle: 'italic', fontSize: 16, color: '#F0EBE0', textAlign: 'center' }}>
                  No active challenges right now. Check back soon.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {challenges.map(c => {
                  const entered = userEntries.some(e => e.challenge_id === c.id);
                  const diff = new Date(c.deadline).getTime() - new Date().getTime();
                  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  const isUrgent = daysLeft > 0 && daysLeft <= 7;

                  return (
                    <div key={c.id} style={{ background: 'rgba(30,32,41,0.6)', border: '1px solid rgba(188,168,142,0.15)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontFamily: 'Playfair Display, sans-serif', fontStyle: 'italic', fontSize: 20, color: '#F0EBE0', margin: 0 }}>{c.title}</h3>
                        {c.prize && (
                          <span style={{ padding: '4px 10px', background: 'rgba(188,168,142,0.1)', border: '1px solid #BCA88E', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 2 }}>{c.prize.toUpperCase()}</span>
                        )}
                      </div>
                      
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.7, lineHeight: 1.7, margin: 0 }}>{c.description}</p>
                      
                      {c.prompt && (
                        <blockquote style={{ borderLeft: '2px solid #BCA88E', paddingLeft: 16, margin: 0, fontStyle: 'italic', color: '#BCA88E', fontSize: 13 }}>
                          "{c.prompt}"
                        </blockquote>
                      )}

                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 4, color: '#BCA88E', margin: 0 }}>
                            DEADLINE: {new Date(c.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                          </p>
                          {isUrgent && (
                            <motion.span 
                              animate={{ opacity: [0.4, 1, 0.4] }} 
                              transition={{ duration: 1.5, repeat: Infinity }}
                              style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', fontWeight: 700 }}
                            >
                              {daysLeft === 1 ? '1 DAY LEFT' : `${daysLeft} DAYS LEFT`}
                            </motion.span>
                          )}
                        </div>

                        <button
                          onClick={() => !entered && handleChallengeEnter(c.id)}
                          disabled={entered}
                          style={{
                            width: '100%',
                            background: entered ? 'none' : 'rgba(188,168,142,0.1)',
                            border: '1px solid #BCA88E',
                            color: '#BCA88E',
                            fontFamily: 'Montserrat, sans-serif',
                            fontSize: 10,
                            letterSpacing: 4,
                            padding: '12px',
                            cursor: entered ? 'default' : 'pointer',
                            opacity: entered ? 0.6 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {entered ? 'ENTERED ✓' : 'ENTER CHALLENGE'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'inspiration' && (
          <motion.div
            key="inspiration-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
          >
            {/* Pin Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(188,168,142,0.1)' }}>
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, margin: 0 }}>ADD TO PINBOARD</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <CinemaInput label="TITLE" value={pinForm.title} onChange={(v) => setPinForm({ ...pinForm, title: v })} required />
                <CinemaInput label="URL (OPTIONAL)" value={pinForm.url} onChange={(v) => setPinForm({ ...pinForm, url: v })} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#BCA88E', letterSpacing: 4, margin: 0 }}>TYPE</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['LINK', 'QUOTE', 'FILM REF'].map(t => (
                    <button
                      key={t}
                      onClick={() => setPinForm({ ...pinForm, type: t })}
                      style={{
                        padding: '8px 16px',
                        background: pinForm.type === t ? 'rgba(188,168,142,0.15)' : 'none',
                        border: '1px solid',
                        borderColor: pinForm.type === t ? '#BCA88E' : 'rgba(188,168,142,0.2)',
                        color: '#BCA88E',
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: 8,
                        letterSpacing: 3,
                        cursor: 'pointer'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <CinemaTextarea label="NOTE (OPTIONAL)" value={pinForm.note} onChange={(v) => setPinForm({ ...pinForm, note: v })} rows={2} />
              
              <CinemaButton onClick={handlePinSubmit} loading={submittingPin} disabled={!pinForm.title}>
                PIN IT
              </CinemaButton>
            </div>

            {/* Pins Grid */}
            <div>
              {inspirationPins.length === 0 ? (
                <p style={{ fontFamily: 'Playfair Display, sans-serif', fontStyle: 'italic', fontSize: 16, color: '#F0EBE0', textAlign: 'center', opacity: 0.3, padding: '40px 0' }}>
                  Your inspiration board is empty. Start pinning.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                  {inspirationPins.map(pin => (
                    <motion.div
                      key={pin.id}
                      whileHover={{ y: -4, borderColor: 'rgba(188,168,142,0.3)' }}
                      style={{
                        background: 'rgba(14,15,20,0.9)',
                        border: '1px solid rgba(188,168,142,0.1)',
                        padding: 16,
                        minHeight: 120,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        transition: 'border-color 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 8, fontFamily: 'Montserrat, sans-serif', letterSpacing: 3, color: '#BCA88E', opacity: 0.6 }}>{pin.type}</span>
                        <button
                          onClick={() => handlePinDelete(pin.id)}
                          style={{
                            background: 'none', border: 'none', color: '#BCA88E', cursor: 'pointer', padding: 4,
                            opacity: 0, transition: 'opacity 0.2s ease'
                          }}
                          className="delete-pin-btn"
                        >✕</button>
                      </div>
                      
                      <h4 style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 15, color: '#F0EBE0', margin: 0 }}>{pin.title}</h4>
                      
                      {pin.note && (
                        <p style={{ 
                          fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F0EBE0', opacity: 0.6, 
                          lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, 
                          WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                        }}>{pin.note}</p>
                      )}

                      {pin.url && (
                        <a 
                          href={pin.url} target="_blank" rel="noopener noreferrer"
                          style={{ 
                            fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', 
                            textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap', marginTop: 'auto' 
                          }}
                        >
                          {pin.url.replace(/^https?:\/\//, '')}
                        </a>
                      )}

                      <style>{`
                        div:hover > div > .delete-pin-btn { opacity: 1 !important; }
                      `}</style>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
