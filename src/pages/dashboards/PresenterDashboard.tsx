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

function CinemaButton({ children, onClick, loading, style, disabled }: { children: React.ReactNode; onClick?: () => void; loading?: boolean; style?: any; disabled?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button type="button" onClick={onClick} disabled={loading || disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      animate={{ background: hov && !loading && !disabled ? '#BCA88E' : 'transparent', color: hov && !loading && !disabled ? '#1e2029' : '#BCA88E', opacity: disabled ? 0.4 : 1 }}
      transition={{ duration: 0.2 }}
      style={{ border: '1px solid #BCA88E', padding: '13px 44px', fontFamily: 'Playfair Display, sans-serif', fontSize: 15, letterSpacing: 5, display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {loading && <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />}
      {children}
    </motion.button>
  );
}

export default function PresenterDashboard() {
  const { user } = useAuth();
  const [films, setFilms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  /* Form State */
  const [form, setForm] = useState({ 
    title: '', synopsis: '', link: '', contact: '', note: '' 
  });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchIdRef = useRef(0);

  const fetchData = async () => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      if (!user) return;
      const { data: presData } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (fetchId !== fetchIdRef.current) return;
      setFilms(presData || []);
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      console.error(err);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  };

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
      fetchData();
      toast('PRESENTATION SUBMITTED ✦');
    } catch (err: any) { toast(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {loading ? (
        <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3 }}>SYNCHRONIZING PROJECTORS...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          <div>
            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 28 }}>NEW SCREENING SUBMISSION</p>
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

          {films.length > 0 && (
            <div>
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 32 }}>SCREENING STATUS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {films.map((f) => (
                  <div key={f.id} style={{ border: '1px solid rgba(188,168,142,0.1)', padding: '24px 32px', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#F0EBE0', margin: 0 }}>{f.title}</p>
                        <span style={{ 
                          fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 2, padding: '3px 8px', border: '1px solid #BCA88E', color: '#BCA88E',
                          background: 'transparent'
                        }}>{f.status?.toUpperCase() || 'SUBMITTED'}</span>
                      </div>
                      {f.synopsis && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.6, margin: 0, lineHeight: 1.5 }}>{f.synopsis}</p>}
                      {f.link && (
                        <a href={f.link} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start', fontFamily: 'Inter, monospace', fontSize: 11, color: '#c9a84c', textDecoration: 'underline', marginTop: 4 }}>
                          SCREENING LINK →
                        </a>
                      )}
                      {(f.contact || f.note) && (
                        <div style={{ display: 'flex', gap: 24, fontSize: 11, fontFamily: 'Inter, monospace', color: '#BCA88E', opacity: 0.5, marginTop: 4 }}>
                          {f.contact && <span>CONTACT: {f.contact}</span>}
                          {f.note && <span>NOTE: {f.note}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
