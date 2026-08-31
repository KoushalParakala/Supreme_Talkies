import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

/* ── Shared UI Components ── */
function CinemaInput({ label, type = 'text', placeholder, value, onChange }: { label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void; }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'DM Serif Display, serif', fontSize: 11, color: '#e8472a', letterSpacing: 5, opacity: focused ? 1 : 0.7, textTransform: 'uppercase' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${focused ? '#e8472a' : 'rgba(232,71,42,0.28)'}`, paddingBottom: 10, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: '#171717', width: '100%', outline: 'none', transition: 'border-color 0.2s' }}
      />
    </div>
  );
}

function CinemaTextarea({ label, placeholder, value, onChange, rows = 3 }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number; }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'DM Serif Display, serif', fontSize: 11, color: '#e8472a', letterSpacing: 5, opacity: focused ? 1 : 0.7, textTransform: 'uppercase' }}>{label}</label>
      <textarea rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${focused ? '#e8472a' : 'rgba(232,71,42,0.28)'}`, paddingBottom: 10, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: '#171717', width: '100%', outline: 'none', resize: 'none', lineHeight: 1.7, transition: 'border-color 0.2s' }}
      />
    </div>
  );
}

function CinemaButton({ children, onClick, loading, style, disabled }: { children: React.ReactNode; onClick?: () => void; loading?: boolean; style?: any; disabled?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button type="button" onClick={onClick} disabled={loading || disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      animate={{ background: hov && !loading && !disabled ? '#e8472a' : 'transparent', color: hov && !loading && !disabled ? '#fffdf7' : '#e8472a', opacity: disabled ? 0.4 : 1 }}
      transition={{ duration: 0.2 }}
      style={{ border: '1px solid #e8472a', padding: '13px 44px', fontFamily: 'DM Serif Display, serif', fontSize: 15, letterSpacing: 5, display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {loading && <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />}
      {children}
    </motion.button>
  );
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  submitted: { bg: 'rgba(232,71,42,0.1)', color: '#e8472a', label: 'IN REVIEW' },
  approved:  { bg: 'rgba(74,222,128,0.1)', color: '#4ade80', label: 'APPROVED' },
  rejected:  { bg: 'rgba(255,80,80,0.1)', color: '#ff5050', label: 'REJECTED' },
  archived:  { bg: 'rgba(100,100,100,0.1)', color: '#888', label: 'ARCHIVED' },
};

export default function PresenterDashboard() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  
  /* Form State */
  const [form, setForm] = useState({ 
    title: '', synopsis: '', link: '', contact: '', note: '' 
  });
  const [myScreenings, setMyScreenings] = useState<any[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  const fetchScreenings = async () => {
    if (!user) return;
    const { data } = await supabase.from('presentations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const list = data || [];
    setMyScreenings(list);

    if (list.length > 0) {
      try {
        const ids = list.map((p: any) => p.id);
        const { data: reactions } = await supabase
          .from('presentation_reactions')
          .select('presentation_id')
          .in('presentation_id', ids);
        const counts: Record<string, number> = {};
        (reactions || []).forEach((r: any) => {
          counts[r.presentation_id] = (counts[r.presentation_id] || 0) + 1;
        });
        setReactionCounts(counts);
      } catch {
        // table may be unavailable — skip quietly
      }
    } else {
      setReactionCounts({});
    }
  };

  useEffect(() => {
    fetchScreenings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !form.title) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('presentations').insert({ 
        user_id: user.id, 
        title: form.title,
        synopsis: form.synopsis,
        link: form.link,
        contact: form.contact,
        note: form.note,
        status: 'submitted' 
      });
      if (error) throw error;
      setForm({ title: '', synopsis: '', link: '', contact: '', note: '' });
      toast('PRESENTATION SUBMITTED ✦');
      fetchScreenings();
    } catch (err: unknown) { toast(err instanceof Error ? err.message : String(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
        <div id="presenter-form" ref={formRef}>
          <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#e8472a', letterSpacing: 2, marginBottom: 28 }}>NEW SCREENING SUBMISSION</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 680 }}>
            <CinemaInput label="FILM TITLE" placeholder="e.g. The Midnight Echo" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <CinemaInput label="SCREENING LINK (OPTIONAL)" placeholder="e.g. https://youtube.com/watch?v=..." value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <CinemaInput label="CONTACT DETAILS" placeholder="e.g. email or phone" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
              <CinemaInput label="NOTE TO TEAM" placeholder="e.g. Available dates, special request" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
            </div>
            <CinemaTextarea label="SYNOPSIS" placeholder="Brief description of the screening..." value={form.synopsis} onChange={(v) => setForm({ ...form, synopsis: v })} rows={3} />
            
            <CinemaButton onClick={handleSubmit} loading={submitting} disabled={!form.title}>
              {submitting ? 'PROCESSING' : 'BOOK SCREENING  →'}
            </CinemaButton>
          </div>
        </div>

        <div id="presenter-list" style={{ paddingTop: 32, borderTop: '1px solid rgba(23,23,23,0.12)' }}>
          <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#e8472a', letterSpacing: 2, marginBottom: 28 }}>MY SUBMISSIONS</p>
          {myScreenings.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, color: '#171717', opacity: 0.3, letterSpacing: 2, fontStyle: 'italic', margin: 0 }}>
                No presentations yet. Propose a screening to get on the slate.
              </p>
              <CinemaButton
                onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{ padding: '10px 28px', fontSize: 13, letterSpacing: 3 }}
              >
                PROPOSE A SCREENING →
              </CinemaButton>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {myScreenings.map(s => {
                const st = STATUS_STYLE[s.status] || { bg: 'rgba(100,100,100,0.1)', color: '#888', label: (s.status || 'UNKNOWN').toUpperCase() };
                const reactions = reactionCounts[s.id] || 0;
                return (
                  <div key={s.id} style={{ padding: 24, border: '1px solid rgba(23,23,23,0.12)', background: 'rgba(247,245,239,1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <h4 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#171717', margin: '0 0 8px' }}>{s.title}</h4>
                      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 11, color: '#e8472a', opacity: 0.6, margin: 0 }}>
                        SUBMITTED ON: {new Date(s.created_at).toLocaleDateString()}
                        {reactions > 0 ? ` · ${reactions} REACTION${reactions === 1 ? '' : 'S'}` : ''}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 10, padding: '6px 14px', background: st.bg, color: st.color,
                      border: '1px solid currentColor', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, letterSpacing: 3,
                    }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
