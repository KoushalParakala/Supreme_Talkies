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

function CountdownDisplay({ date, title, territory }: { date: string; title: string; territory?: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(date).getTime() - new Date().getTime();
      if (diff <= 0) { setTimeLeft(null); clearInterval(timer); return; }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [date]);

  if (!timeLeft) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{ background: 'rgba(30,32,41,0.8)', border: '1px solid rgba(188,168,142,0.2)', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, transparent, #BCA88E, transparent)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 6, color: '#BCA88E', margin: '0 0 8px' }}>NEXT SCREENING</p>
          <h2 style={{ fontFamily: 'Playfair Display, sans-serif', fontStyle: 'italic', fontSize: 28, color: '#F0EBE0', margin: 0 }}>{title}</h2>
        </div>
        {territory && (
          <span style={{ fontFamily: 'Inter, monospace', fontSize: 9, background: 'rgba(188,168,142,0.1)', color: '#BCA88E', padding: '4px 12px', border: '1px solid rgba(188,168,142,0.2)', letterSpacing: 2 }}>{territory.toUpperCase()}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 40 }}>
        {[
          { v: timeLeft.d, l: 'DAYS' },
          { v: timeLeft.h, l: 'HRS' },
          { v: timeLeft.m, l: 'MIN' },
          { v: timeLeft.s, l: 'SEC' }
        ].map(unit => (
          <div key={unit.l}>
            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 40, color: '#BCA88E', margin: 0, lineHeight: 1 }}>{unit.v.toString().padStart(2, '0')}</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 4, color: '#F0EBE0', opacity: 0.4, margin: '4px 0 0' }}>{unit.l}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function PresenterDashboard() {
  const { user } = useAuth();
  const [films, setFilms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'screenings' | 'reach' | 'reactions'>('screenings');
  
  /* Form State */
  const [form, setForm] = useState({ 
    title: '', synopsis: '', screening_date: '', territory: '', expected_reach: '' 
  });

  /* Countdown State */
  const [upcoming, setUpcoming] = useState<any>(null);

  /* Reach Report State */
  const [stats, setStats] = useState({ totalScreenings: 0, totalReach: 0, avgReach: 0, topTerritory: '' });
  const [editingActual, setEditingActual] = useState<string | null>(null);
  const [actualValue, setActualValue] = useState('');

  /* Reactions State */
  const [reactionGrid, setReactionGrid] = useState<Record<string, number>>({ '🔥': 0, '👏': 0, '😮': 0, '❤️': 0 });
  const [timeline, setTimeline] = useState<any[]>([]);

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
        .order('screening_date', { ascending: false });
      
      if (fetchId !== fetchIdRef.current) return;
      const allPresentations = presData || [];
      setFilms(allPresentations);

      const upcomingOne = allPresentations
        .filter(p => new Date(p.screening_date) > new Date())
        .sort((a, b) => new Date(a.screening_date).getTime() - new Date(b.screening_date).getTime())[0];
      setUpcoming(upcomingOne);

      const totalScreenings = allPresentations.length;
      const totalReach = allPresentations.reduce((acc, curr) => acc + (curr.actual_reach || 0), 0);
      const avgReach = totalScreenings > 0 ? Math.round(totalReach / totalScreenings) : 0;
      
      const territoryCounts: Record<string, number> = {};
      allPresentations.forEach(p => {
        if (p.territory) territoryCounts[p.territory] = (territoryCounts[p.territory] || 0) + 1;
      });
      const topTerritory = Object.entries(territoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      
      setStats({ totalScreenings, totalReach, avgReach, topTerritory });

      if (!user) return;
      const { data: reactData } = await supabase
        .from('presentation_reactions')
        .select('*, presentations!inner(user_id, title)')
        .eq('presentations.user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchId !== fetchIdRef.current) return;

      if (reactData) {
        const counts: Record<string, number> = { '🔥': 0, '👏': 0, '😮': 0, '❤️': 0 };
        reactData.forEach(r => {
          if (r.reaction && counts[r.reaction] !== undefined) {
            counts[r.reaction]++;
          }
        });
        setReactionGrid(counts);
        setTimeline(reactData.slice(0, 20));
      }
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      console.error(err);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !form.title || !form.screening_date) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('presentations').insert({ 
        user_id: user.id, 
        ...form,
        status: 'submitted' 
      });
      if (error) throw error;
      setForm({ title: '', synopsis: '', screening_date: '', territory: '', expected_reach: '' });
      fetchData();
      alert('PRESENTATION SUBMITTED ✦');
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const updateActualReach = async (id: string) => {
    try {
      const { error } = await supabase.from('presentations').update({ actual_reach: parseInt(actualValue) }).eq('id', id);
      if (error) throw error;
      setEditingActual(null);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const TABS = [
    { id: 'screenings', label: 'MY SCREENINGS' },
    { id: 'reach', label: 'REACH REPORT' },
    { id: 'reactions', label: 'REACTIONS' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Countdown Card */}
      {upcoming && (
        <CountdownDisplay date={upcoming.screening_date} title={upcoming.title} territory={upcoming.territory} />
      )}

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
        <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3 }}>SYNCHRONIZING PROJECTORS...</p>
      ) : view === 'screenings' ? (
        /* MY SCREENINGS TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          <div>
            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 28 }}>NEW SCREENING SUBMISSION</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 680 }}>
              <CinemaInput label="FILM TITLE" placeholder="e.g. The Midnight Echo" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <CinemaInput label="SCREENING DATE" type="datetime-local" value={form.screening_date} onChange={(v) => setForm({ ...form, screening_date: v })} />
                <CinemaInput label="TERRITORY" placeholder="e.g. Mumbai, Online" value={form.territory} onChange={(v) => setForm({ ...form, territory: v })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <CinemaInput label="EXPECTED REACH" type="number" placeholder="Estimated audience" value={form.expected_reach} onChange={(v) => setForm({ ...form, expected_reach: v })} />
              </div>
              <CinemaTextarea label="SYNOPSIS" placeholder="Brief description of the screening..." value={form.synopsis} onChange={(v) => setForm({ ...form, synopsis: v })} rows={3} />
              
              <CinemaButton onClick={handleSubmit} loading={submitting} disabled={!form.title || !form.screening_date}>
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
                    <div>
                      <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#F0EBE0', margin: '0 0 4px' }}>{f.title}</p>
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 2 }}>{new Date(f.screening_date).toLocaleDateString().toUpperCase()} • {f.territory?.toUpperCase()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 3, padding: '4px 12px', border: '1px solid #BCA88E', color: '#BCA88E',
                        background: f.status === 'screened' ? 'rgba(188,168,142,0.15)' : 'transparent'
                      }}>{f.status?.toUpperCase() || 'SUBMITTED'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : view === 'reach' ? (
        /* REACH REPORT TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {[
              { label: 'TOTAL SCREENINGS', value: stats.totalScreenings },
              { label: 'TOTAL REACH', value: stats.totalReach.toLocaleString() },
              { label: 'AVG REACH / SCREEN', value: stats.avgReach.toLocaleString() },
              { label: 'TOP TERRITORY', value: stats.topTerritory }
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(30,32,41,0.5)', border: '1px solid rgba(188,168,142,0.1)', padding: 24 }}>
                <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 36, color: '#BCA88E', margin: '0 0 8px' }}>{s.value}</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 5, color: '#F0EBE0', opacity: 0.3, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {films.map(f => {
              const expected = parseInt(f.expected_reach) || 1;
              const actual = f.actual_reach || 0;
              const ratio = Math.min((actual / expected) * 100, 100);
              const exceeded = actual > expected;

              return (
                <div key={f.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(188,168,142,0.05)', padding: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 20, color: '#F0EBE0', margin: '0 0 6px' }}>{f.title}</h3>
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.5, letterSpacing: 2 }}>{new Date(f.screening_date).toLocaleDateString()} • {f.territory}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', margin: 0 }}>{actual} / {expected}</p>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 3, opacity: 0.4, margin: 0 }}>ACTUAL / EXPECTED</p>
                      </div>
                      {exceeded && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#64c878', border: '1px solid #64c878', padding: '2px 6px', letterSpacing: 2 }}>↑ EXCEEDED</span>}
                      {!exceeded && actual < expected && actual > 0 && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#ff6b6b', opacity: 0.5, letterSpacing: 2 }}>↓</span>}
                    </div>
                  </div>

                  <div style={{ height: 2, background: 'rgba(188,168,142,0.1)', marginBottom: 24 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${ratio}%` }} style={{ height: '100%', background: '#BCA88E' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {editingActual === f.id ? (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <input type="number" value={actualValue} onChange={(e) => setActualValue(e.target.value)} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #BCA88E', color: '#F0EBE0', fontFamily: 'Inter, monospace', fontSize: 12, width: 80, outline: 'none' }} placeholder="Actual..." />
                        <button onClick={() => updateActualReach(f.id)} style={{ background: '#BCA88E', border: 'none', color: '#0a0a0a', fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>UPDATE</button>
                        <button onClick={() => setEditingActual(null)} style={{ background: 'none', border: 'none', color: '#F0EBE0', opacity: 0.4, fontSize: 10, cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingActual(f.id); setActualValue(actual.toString()); }} style={{ background: 'none', border: 'none', color: '#BCA88E', opacity: 0.6, fontSize: 10, letterSpacing: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>✎</span> UPDATE REACH
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* REACTIONS TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {Object.entries(reactionGrid).map(([emoji, count]) => (
              <div key={emoji} style={{ background: 'rgba(30,32,41,0.5)', border: '1px solid rgba(188,168,142,0.1)', padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 32, margin: '0 0 12px' }}>{emoji}</p>
                <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 24, color: '#BCA88E', margin: 0 }}>{count}</p>
              </div>
            ))}
          </div>

          <div>
            <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 24 }}>AUDIENCE SIGNALS</p>
            {timeline.length === 0 ? (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F0EBE0', opacity: 0.3, fontStyle: 'italic' }}>No reactions yet. Promote your screening to gather audience response.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {timeline.map((r, i) => (
                  <motion.div key={i} whileHover={{ background: 'rgba(188,168,142,0.03)' }} style={{ padding: '16px 24px', borderLeft: '2px solid rgba(188,168,142,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>{r.reaction}</span>
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', margin: 0 }}>
                          <span style={{ opacity: 0.4 }}>from audience on </span>
                          <span style={{ color: '#BCA88E' }}>{r.presentations?.title}</span>
                        </p>
                      </div>
                    </div>
                    <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.3 }}>{new Date(r.created_at).toLocaleTimeString()}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
