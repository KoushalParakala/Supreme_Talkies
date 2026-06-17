import toast from 'react-hot-toast';
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

function CinemaButton({ children, onClick, disabled, loading, style }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean; style?: any;
}) {
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

const MOOD_TAGS = ['Dark', 'Hopeful', 'Tense', 'Melancholic', 'Surreal', 'Raw', 'Lyrical', 'Violent', 'Nostalgic', 'Comic', '+'];
const SETTING_TAGS = ['Urban', 'Rural', 'Period', 'Future', 'Road', 'Interior', 'Festival', '+'];
const FORMAT_OPTIONS = ['Feature Film', 'Short Film', 'Web Series', 'Documentary', 'Experimental'];

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
      if (!allTags.includes(t)) allTags.splice(allTags.length - 1, 0, t); // Insert before '+'
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

  const [revisionScriptId, setRevisionScriptId] = useState<string | null>(null);
  const [revisionForm, setRevisionForm] = useState({ note: '', link: '' });
  const [submittingRevision, setSubmittingRevision] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'scripts' | 'briefs' | 'challenges' | 'inspiration'>('scripts');
  
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
    fetchInspirationPins();
    fetchOpenBriefs();
    fetchUserInterests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserInterestsRef = useRef(0);
  const fetchOpenBriefsRef = useRef(0);

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
        toast('You have already expressed interest in this brief ✦');
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

      toast('INTEREST LOGGED ✦ The producer has been notified.');
      fetchOpenBriefs();
    } catch (err: any) { toast(err.message); }
    finally { setExpressingBriefId(null); }
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
      toast('ENTRY CONFIRMED ✦');
      fetchChallenges();
    } catch (err: any) { toast(err.message); }
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
    } catch (err: any) { toast(err.message); }
    finally { setSubmittingPin(false); }
  };

  const handlePinDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('inspiration_pins').delete().eq('id', id);
      if (error) throw error;
      fetchInspirationPins();
    } catch (err: any) { toast(err.message); }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('writer_live_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts' }, () => fetchSubmissions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'writing_challenges' }, () => fetchChallenges())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'film_briefs' }, () => fetchOpenBriefs())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brief_interests' }, () => fetchUserInterests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); 

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

    } catch (err: any) { 
      toast(err.message); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleRevisionSubmit = async (scriptId: string, currentVersion: number) => {
    if (!user || !revisionForm.link) return;
    setSubmittingRevision(true);
    try {
      const newVersion = currentVersion + 1;
      
      const { error: versionError } = await supabase.from('script_versions').insert({
        script_id: scriptId,
        user_id: user.id,
        version_number: newVersion,
        pdf_url: revisionForm.link,
        version_notes: revisionForm.note || 'New revision submitted',
      });
      if (versionError) throw versionError;

      const { error: updateError } = await supabase.from('scripts').update({
        version_number: newVersion,
        pdf_url: revisionForm.link,
        status: 'under_review',
        updated_at: new Date().toISOString()
      }).eq('id', scriptId);
      if (updateError) throw updateError;

      toast('NEW REVISION SUBMITTED ✦');
      setRevisionScriptId(null);
      setRevisionForm({ note: '', link: '' });
      fetchSubmissions();
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!window.confirm('Are you sure you want to delete this script?')) return;
    try {
      const { error } = await supabase.from('scripts').delete().eq('id', scriptId);
      if (error) throw error;
      toast('SCRIPT DELETED ✕');
      fetchSubmissions();
    } catch (err: any) {
      toast(err.message);
    }
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

                {/* Feature 2: Submitted Scripts */}
                <div style={{ borderTop: '1px solid rgba(188,168,142,0.1)', paddingTop: 32 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 5, color: '#BCA88E', marginBottom: 20 }}>SUBMITTED SCRIPTS</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {loading ? (
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.3, letterSpacing: 2 }}>SCANNING THE ARCHIVES...</p>
                    ) : submissions.length === 0 ? (
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.25, letterSpacing: 2, fontStyle: 'italic' }}>
                        "The first draft is just you telling yourself the story." — No submissions yet.
                      </p>
                    ) : (
                      submissions.map((script: any) => {
                        const stKey = script.kanban_stage || script.status || 'inbox';
                        const statusMeta = STATUS_COLORS[stKey] || STATUS_COLORS['inbox'];
                        const statusLabel = STATUS_LABELS[stKey] || stKey.replace('_',' ').toUpperCase();
                        const vColor = VERSION_PALETTE[(script.version_number || 1) - 1 < VERSION_PALETTE.length ? (script.version_number || 1) - 1 : 0];
                        return (
                          <div key={script.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(188,168,142,0.1)', borderLeft: `4px solid ${vColor}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 10, fontWeight: 700, color: '#0e0f13', background: vColor, padding: '4px 10px', letterSpacing: 1 }}>V{script.version_number || 1}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#F0EBE0', margin: 0 }}>{script.title}</p>
                                  <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.5, margin: 0 }}>
                                    {new Date(script.updated_at || script.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                {script.pdf_url && (
                                  <a href={script.pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', textDecoration: 'none', letterSpacing: 2 }}>
                                    READ SCRIPT
                                  </a>
                                )}
                                <button
                                  onClick={() => setRevisionScriptId(revisionScriptId === script.id ? null : script.id)}
                                  style={{ background: 'none', border: '1px solid rgba(188,168,142,0.3)', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 10, padding: '4px 8px', cursor: 'pointer', letterSpacing: 1 }}
                                >
                                  NEW REVISION
                                </button>
                                <span style={{
                                  fontFamily: '"Montserrat", sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 4,
                                  color: statusMeta.text, textShadow: `0 0 12px ${statusMeta.glow}`, background: statusMeta.bg,
                                  padding: '5px 12px', borderLeft: `2px solid ${statusMeta.text}`, lineHeight: 1
                                }}>
                                  {statusLabel}
                                </span>
                                <button onClick={() => handleDeleteScript(script.id)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 14, opacity: 0.7 }} title="Delete Script">✕</button>
                              </div>
                            </div>
                            
                            {/* Revision Form */}
                            <AnimatePresence>
                              {revisionScriptId === script.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(188,168,142,0.1)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                      <CinemaInput label="NEW PDF LINK" type="url" placeholder="https://..." value={revisionForm.link} onChange={(v) => setRevisionForm({ ...revisionForm, link: v })} required />
                                      <CinemaTextarea label="REVISION NOTES" placeholder="What changed in this version?" value={revisionForm.note} onChange={(v) => setRevisionForm({ ...revisionForm, note: v })} rows={2} />
                                    </div>
                                    <CinemaButton onClick={() => handleRevisionSubmit(script.id, script.version_number || 1)} loading={submittingRevision} disabled={!revisionForm.link} style={{ padding: '8px 24px', fontSize: 12, marginTop: 16 }}>
                                      SUBMIT
                                    </CinemaButton>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
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
                    <span style={{ fontSize: 14, color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', letterSpacing: 2, opacity: 0.5 }}>{brief.profiles?.st_id ? (brief.profiles.st_id.startsWith('SUPR-') ? brief.profiles.st_id : 'SUPR-' + brief.profiles.st_id) : 'PRODUCER'}</span>
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
                      style={{ padding: '10px 24px', fontSize: 12, letterSpacing: 3, whiteSpace: 'nowrap' }}
                    >
                      {expressingBriefId === brief.id ? 'LOGGING...' : userInterests.includes(brief.id) ? 'LOGGED ✓' : 'EXPRESS INTEREST'}
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
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#BCA88E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2H3a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V9l-6-7H7z"/><polyline points="13 2 13 9 20 9"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
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
                          {entered ? 'ENTERED' : 'ENTER CHALLENGE'}
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
