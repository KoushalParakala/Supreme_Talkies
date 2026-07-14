import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { DirectoryProfile, fetchMemberByStId, fetchMemberDirectoryByIds } from '../../lib/directory';

const SPECIALIZATIONS = ['Camera', 'Lighting', 'Sound', 'Editing', 'VFX', 'Production Design', 'Other'];


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
export default function TechnicianDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'briefs' | 'collab'>('portfolio');
  const [formData, setFormData] = useState({ 
    specialization: profile?.niche || '', 
    experience: profile?.experience || '', 
    portfolioLink: profile?.portfolio_url || '', 
    noteToTeam: profile?.note_to_team || '',
    contact: (profile as any)?.contact || '',
    socialHandle: profile?.social_handle || ''
  });
  
  const [available, setAvailable] = useState(profile?.availability ?? true);
  const [otherCrew, setOtherCrew] = useState<DirectoryProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [expandingNewCollab, setExpandingNewCollab] = useState(false);
  const [newCollab, setNewCollab] = useState({ stId: '', title: '', message: '' });
  const [sendingCollab, setSendingCollab] = useState(false);
  const [openBriefs, setOpenBriefs] = useState<any[]>([]);
  const [expressingBriefId, setExpressingBriefId] = useState<string | null>(null);
  const [userBriefInterests, setUserBriefInterests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetchOtherCrew();
    fetchRequests();
    fetchOpenBriefs();
    fetchMyBriefInterests();
    if (profile) {
      setAvailable(profile.availability ?? true);
      setFormData({
        specialization: profile.niche || '',
        experience: (profile as any).experience || '',
        portfolioLink: profile.portfolio_url || '',
        noteToTeam: profile.note_to_team || '',
        contact: (profile as any).contact || '',
        socialHandle: (profile as any).social_handle || ''
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const fetchOtherCrewRef = useRef(0);
  const fetchOpenBriefsRef = useRef(0);
  const fetchRequestsRef = useRef(0);

  const fetchOtherCrew = async () => {
    const fetchId = ++fetchOtherCrewRef.current;
    const { data } = await supabase.from('member_directory')
      .select('id, full_name, avatar_symbol, st_id, st_verified, role, roles, skills, niche')
      .eq('availability', true)
      .contains('roles', ['technician'])
      .neq('id', user?.id);
    if (fetchId !== fetchOtherCrewRef.current) return;
    setOtherCrew(data || []);
  };

  const fetchOpenBriefs = async () => {
    const fetchId = ++fetchOpenBriefsRef.current;
    try {
      const { data, error } = await supabase.from('film_briefs')
        .select('*')
        .eq('is_open', true)
        .order('created_at', { ascending: false });
      if (fetchId !== fetchOpenBriefsRef.current) return;
      if (error) { console.error('Error fetching briefs:', error); return; }

      // Manual join: fetch producer profiles separately
      const producerIds = [...new Set((data || []).map((b: any) => b.producer_id).filter(Boolean))];
      let producerMap = new Map();
      if (producerIds.length > 0) {
        const { data: producers } = await supabase.from('member_directory').select('id, full_name, avatar_symbol, st_id').in('id', producerIds);
        if (producers) producerMap = new Map(producers.map(p => [p.id, p]));
      }
      if (fetchId !== fetchOpenBriefsRef.current) return;

      setOpenBriefs((data || []).map((b: any) => ({
        ...b,
        producer: producerMap.get(b.producer_id) || null
      })));
    } catch (err) {
      if (fetchId !== fetchOpenBriefsRef.current) return;
      console.error('Error fetching open briefs:', err);
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

  const handleInterestInBrief = async (brief: any) => {
    if (!user) return;
    setExpressingBriefId(brief.id);
    const alreadyInterested = userBriefInterests.has(brief.id);
    try {
      if (alreadyInterested) {
        const { error } = await supabase.from('brief_interests')
          .delete().eq('brief_id', brief.id).eq('user_id', user.id);
        if (error) throw error;
        setUserBriefInterests(prev => { const next = new Set(prev); next.delete(brief.id); return next; });
        toast('INTEREST WITHDRAWN');
      } else {
        const { error: interestError } = await supabase.from('brief_interests').insert({
          brief_id: brief.id,
          user_id: user.id,
          note: `Technician interest`
        });
        if (interestError) throw interestError;
        setUserBriefInterests(prev => new Set([...prev, brief.id]));
        await supabase.from('collab_requests').insert({
          sender_id: user.id,
          receiver_id: brief.producer_id,
          project_title: brief.title,
          message: `I am interested in your film brief: "${brief.title}". I'd love to discuss my technical services.`
        });
        toast('INTEREST LOGGED ✦ The producer has been notified.');
        fetchOpenBriefs();
      }
    } catch (err: unknown) { toast(err instanceof Error ? err.message : String(err)); }
    finally { setExpressingBriefId(null); }
  };

  const fetchRequests = async () => {
    if (!user) return;
    const fetchId = ++fetchRequestsRef.current;
    // Received
    const { data: rec } = await supabase.from('collab_requests')
      .select('*')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    // Sent
    const { data: sent } = await supabase.from('collab_requests')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchId !== fetchRequestsRef.current) return;
    const profileMap = await fetchMemberDirectoryByIds([
      ...(rec || []).map((request: any) => request.sender_id),
      ...(sent || []).map((request: any) => request.receiver_id)
    ]);

    if (fetchId !== fetchRequestsRef.current) return;
    setReceivedRequests((rec || []).map((request: any) => ({
      ...request,
      sender: profileMap.get(request.sender_id) || null
    })));
    setSentRequests((sent || []).map((request: any) => ({
      ...request,
      receiver: profileMap.get(request.receiver_id) || null
    })));
  };

  const toggleAvailability = async () => {
    const newVal = !available;
    setAvailable(newVal);
    try {
      await supabase.from('profiles').update({ availability: newVal }).eq('id', user?.id);
      refreshProfile();
    } catch { setAvailable(!newVal); }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ 
        niche: formData.specialization,
        portfolio_url: formData.portfolioLink,
        note_to_team: formData.noteToTeam,
        experience: formData.experience,
        contact: formData.contact,
        social_handle: formData.socialHandle
      }).eq('id', user.id);
      
      if (error) throw error;
      refreshProfile();
      toast('Crew Card updated.');
    } catch (err: unknown) { toast(err instanceof Error ? err.message : String(err)); }
    finally { setSaving(false); }
  };

  const handleSendCollab = async () => {
    if (!user || !newCollab.stId) return;
    setSendingCollab(true);
    try {
      // Resolve receiver_id from stId
      const target = await fetchMemberByStId(newCollab.stId);
      if (!target) throw new Error('Could not find crew member with that ID.');

      const { error } = await supabase.from('collab_requests').insert({
        sender_id: user.id,
        receiver_id: target.id,
        project_title: newCollab.title,
        message: newCollab.message
      });
      if (error) throw error;
      
      setNewCollab({ stId: '', title: '', message: '' });
      setExpandingNewCollab(false);
      fetchRequests();
      toast('Collaboration request sent! ✦');
    } catch (err: unknown) { toast(err instanceof Error ? err.message : String(err)); }
    finally { setSendingCollab(false); }
  };

  const handleRequestAction = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      await supabase.from('collab_requests').update({ status }).eq('id', requestId);
      fetchRequests();
    } catch (err) { console.error(err); }
  };


  useEffect(() => {
    const channel = supabase
      .channel('tech_live_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collab_requests' }, () => fetchRequests())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'film_briefs' }, () => fetchOpenBriefs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, paddingBottom: 80 }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(188,168,142,0.1)', paddingBottom: 0 }}>
        {[
          { id: 'portfolio', label: 'MY PORTFOLIO' },
          { id: 'briefs', label: 'OPEN BRIEFS' },
          { id: 'collab', label: 'COLLABORATIONS' }
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
        {activeTab === 'portfolio' && (
          <motion.div
            key="portfolio-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 64 }}
          >
            {/* Feature 1: Availability Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 8 }}>AVAILABILITY STATUS</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div 
                  onClick={toggleAvailability}
                  style={{ 
                    cursor: 'pointer', position: 'relative', width: 64, height: 32, 
                    background: available ? 'rgba(188,168,142,0.4)' : 'rgba(188,168,142,0.15)', 
                    borderRadius: 16, border: `1px solid ${available ? '#BCA88E' : 'rgba(188,168,142,0.3)'}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <motion.div 
                    animate={{ x: available ? 34 : 4 }} 
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    style={{ position: 'absolute', top: 3, width: 24, height: 24, borderRadius: '50%', background: '#F0EBE0', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                  />
                </div>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, letterSpacing: 3, color: '#BCA88E', opacity: available ? 1 : 0.4 }}>
                  {available ? 'AVAILABLE FOR PROJECTS' : 'NOT AVAILABLE'}
                </span>
              </div>
            </div>

            {/* Portfolio Form */}
            <div>
              <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 20 }} />
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 22, color: '#BCA88E', letterSpacing: 2, marginBottom: 6 }}>YOUR CREW CARD</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.35, letterSpacing: 2, marginBottom: 40 }}>THE CRAFT BEHIND EVERY FRAME</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 680 }}>
                {/* Specialization Toggle Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 5, textTransform: 'uppercase' }}>NICHE / SPECIALISATION</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {SPECIALIZATIONS.map(s => {
                      const val = s.toUpperCase();
                      const isSelected = formData.specialization === val || (s === 'Other' && formData.specialization !== '' && !SPECIALIZATIONS.slice(0,-1).map(x => x.toUpperCase()).includes(formData.specialization));
                      return (
                        <motion.button
                          key={s} type="button" whileTap={{ scale: 0.97 }}
                          onClick={() => setFormData({ ...formData, specialization: val })}
                          style={{
                            padding: '7px 16px', borderRadius: 2,
                            background: isSelected ? 'rgba(188,168,142,0.18)' : 'transparent',
                            border: `1px solid ${isSelected ? '#BCA88E' : 'rgba(188,168,142,0.2)'}`,
                            color: isSelected ? '#F0EBE0' : 'rgba(188,168,142,0.5)',
                            fontFamily: '"Montserrat", sans-serif', fontSize: 10, letterSpacing: 3,
                            cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase'
                          }}
                        >
                          {s}
                        </motion.button>
                      );
                    })}
                  </div>
                  {/* Show text input when 'Other' is selected */}
                  {formData.specialization === 'OTHER' && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 8 }}>
                      <CinemaInput
                        label="SPECIFY YOUR CRAFT"
                        placeholder="e.g. Drone Operator, Colourist..."
                        value={formData.specialization === 'OTHER' ? '' : formData.specialization}
                        onChange={(v) => setFormData({ ...formData, specialization: v.toUpperCase() || 'OTHER' })}
                      />
                    </motion.div>
                  )}
                  {formData.specialization !== '' && formData.specialization !== 'OTHER' && !SPECIALIZATIONS.slice(0,-1).map(x => x.toUpperCase()).includes(formData.specialization) && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 8 }}>
                      <CinemaInput
                        label="SPECIFY YOUR CRAFT"
                        placeholder="e.g. Drone Operator, Colourist..."
                        value={formData.specialization}
                        onChange={(v) => setFormData({ ...formData, specialization: v.toUpperCase() })}
                      />
                    </motion.div>
                  )}
                </div>

                <CinemaTextarea label="NOTE TO SUPREME TEAM (WILL SHOW ON CREW CARD)" placeholder="Any specific notes or preferences for the supreme team..." value={formData.noteToTeam} onChange={(v) => setFormData({ ...formData, noteToTeam: v })} rows={3} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <CinemaInput label="EXPERIENCE" placeholder="e.g. 5 Years / 10 Short Films" value={formData.experience} onChange={(v) => setFormData({ ...formData, experience: v })} />
                  <CinemaInput label="PORTFOLIO / SHOWREEL LINK" type="url" placeholder="https://..." value={formData.portfolioLink} onChange={(v) => setFormData({ ...formData, portfolioLink: v })} />
                  <CinemaInput label="CONTACT" placeholder="+91 ..." value={formData.contact} onChange={(v) => setFormData({ ...formData, contact: v })} />
                  <CinemaInput label="SOCIAL HANDLE" placeholder="@username" value={formData.socialHandle} onChange={(v) => setFormData({ ...formData, socialHandle: v })} />
                </div>

                <div style={{ marginTop: 8 }}>
                  <CinemaButton onClick={handleSave} loading={saving}>
                    {saving ? 'COMMITTING' : 'COMMIT PORTFOLIO'}
                  </CinemaButton>
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
            <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.35, letterSpacing: 2, marginBottom: 28 }}>PROJECTS SEEKING CREW</p>            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {openBriefs.length === 0 ? (
                <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.25, fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>No active briefs right now.</p>
              ) : openBriefs.map(brief => {
                const hasInterested = userBriefInterests.has(brief.id);
                const acceptedRequest = sentRequests.find(req => req.project_title === brief.title && req.status === 'accepted');

                return (
                  <div key={brief.id} style={{ background: 'rgba(30,32,41,0.4)', border: `1px solid ${acceptedRequest ? 'rgba(74,222,128,0.4)' : hasInterested ? 'rgba(188,168,142,0.4)' : 'rgba(188,168,142,0.12)'}`, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, transition: 'border-color 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontFamily: 'Playfair Display, sans-serif', fontStyle: 'italic', fontSize: 20, color: '#F0EBE0', margin: '0 0 6px' }}>{brief.title}</h3>
                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: 0 }}>BY {brief.producer?.full_name?.toUpperCase() || 'PRODUCER'}</p>
                      </div>
                      {acceptedRequest ? (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#4ade80', letterSpacing: 3, margin: '0 0 4px', fontWeight: 700 }}>
                            ✦ ACCEPTED
                          </p>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.8, margin: 0 }}>
                            {acceptedRequest.receiver?.contact || 'Check Mutual Connections'}
                          </p>
                        </div>
                      ) : hasInterested ? (
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#BCA88E', letterSpacing: 3, margin: 0, fontWeight: 700 }}>
                          ✦ INTERESTED
                        </p>
                      ) : null}
                    </div>

                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.7, lineHeight: 1.7, margin: 0 }}>{brief.description}</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                      {brief.genre?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', letterSpacing: 4, opacity: 0.5 }}>GENRE</span>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {brief.genre.map((g: string) => <span key={g} style={{ fontSize: 9, color: '#F0EBE0', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', border: '1px solid rgba(188,168,142,0.1)' }}>{g}</span>)}
                          </div>
                        </div>
                      )}
                      {brief.looking_for?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', letterSpacing: 4, opacity: 0.5 }}>LOOKING FOR</span>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {brief.looking_for.map((l: string) => <span key={l} style={{ fontSize: 9, color: '#BCA88E', border: '1px solid #BCA88E', padding: '2px 8px' }}>{l.toUpperCase()}</span>)}
                          </div>
                        </div>
                      )}
                      {(brief.budget_range || brief.timeline) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', letterSpacing: 4, opacity: 0.5 }}>BUDGET & TIMELINE</span>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', margin: 0 }}>{[brief.budget_range, brief.timeline].filter(Boolean).join(' • ')}</p>
                        </div>
                      )}
                    </div>

                    <div style={{ paddingTop: 16, borderTop: '1px solid rgba(188,168,142,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, color: '#BCA88E', opacity: 0.5, letterSpacing: 2 }}>PRODUCER</span>
                        <span style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0' }}>{brief.producer?.full_name || 'Unknown'}</span>
                      </div>
                      <CinemaButton 
                        onClick={() => handleInterestInBrief(brief)} 
                        loading={expressingBriefId === brief.id}
                        disabled={!!acceptedRequest}
                        style={acceptedRequest ? { borderColor: '#4ade80', color: '#4ade80', background: 'rgba(74,222,128,0.08)' } : hasInterested ? { borderColor: '#BCA88E', background: 'rgba(188,168,142,0.08)' } : {}}
                      >
                        {expressingBriefId === brief.id ? '...' : acceptedRequest ? 'COLLABORATION ACTIVE' : hasInterested ? '✦ INTERESTED — WITHDRAW' : 'EXPRESS INTEREST'}
                      </CinemaButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'collab' && (
          <motion.div
            key="collab-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 64 }}
          >
            {/* New Request Button & Form */}
            <div>
              <CinemaButton onClick={() => setExpandingNewCollab(!expandingNewCollab)}>
                {expandingNewCollab ? '[-] CANCEL REQUEST' : '+ SEND COLLAB REQUEST'}
              </CinemaButton>
              
              <AnimatePresence>
                {expandingNewCollab && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 32, maxWidth: 680, padding: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(188,168,142,0.1)', marginTop: 24 }}>
                      <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, margin: 0 }}>NEW CONNECTION</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <CinemaInput label="RECEIVER SUPR ID" placeholder="SUPR-XXXX" value={newCollab.stId} onChange={(v) => setNewCollab({ ...newCollab, stId: v })} required />
                        <CinemaInput label="PROJECT TITLE" placeholder="The name of your film..." value={newCollab.title} onChange={(v) => setNewCollab({ ...newCollab, title: v })} />
                      </div>
                      <CinemaTextarea label="MESSAGE" placeholder="Why do you want to collaborate?" value={newCollab.message} onChange={(v) => setNewCollab({ ...newCollab, message: v })} rows={2} />
                      <CinemaButton onClick={handleSendCollab} loading={sendingCollab} disabled={!newCollab.stId}>
                        SEND REQUEST →
                      </CinemaButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Received Requests */}
            <div>
              <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 20 }} />
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 4 }}>RECEIVED</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3, marginBottom: 28 }}>INCOMING CONNECTIONS ({receivedRequests.filter(req => req.status === 'pending').length})</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
                {receivedRequests.filter(req => req.status === 'pending').length === 0 ? (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.2, fontStyle: 'italic' }}>No pending requests.</p>
                ) : receivedRequests.filter(req => req.status === 'pending').map(req => (
                  <div key={req.id} style={{ background: 'rgba(30,32,41,0.6)', border: '1px solid rgba(188,168,142,0.1)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 24 }}>{req.sender?.avatar_symbol || req.sender?.full_name?.substring(0,1).toUpperCase() || '?'}</span>
                        <div>
                          <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 16, color: '#F0EBE0', margin: '0 0 4px' }}>{req.sender?.full_name}</p>
                          <span style={{ padding: '2px 8px', background: 'rgba(188,168,142,0.1)', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 2 }}>{req.sender?.role?.toUpperCase()}</span>
                        </div>
                      </div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', opacity: 0.4, margin: 0 }}>{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <p style={{ fontFamily: 'Playfair Display, sans-serif', fontStyle: 'italic', fontSize: 16, color: '#BCA88E', margin: '0 0 8px' }}>{req.project_title || 'Untitled Project'}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.7, lineHeight: 1.6, margin: 0 }}>{req.message}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <CinemaButton onClick={() => handleRequestAction(req.id, 'accepted')}>ACCEPT</CinemaButton>
                        <button 
                          onClick={() => handleRequestAction(req.id, 'declined')}
                          style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: 'rgba(255,120,120,0.8)', padding: '13px 32px', fontFamily: 'Playfair Display, sans-serif', fontSize: 14, letterSpacing: 4, cursor: 'pointer' }}
                        >DECLINE</button>
                      </div>
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.3, margin: 0 }}>{req.sender?.st_id ? (req.sender.st_id.startsWith('SUPR-') ? req.sender.st_id : `SUPR-${req.sender.st_id}`) : 'Pending'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sent Requests */}
            <div>
              <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 20 }} />
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 4 }}>SENT</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3, marginBottom: 28 }}>YOUR OUTGOING PINGS ({sentRequests.filter(req => req.status === 'pending').length})</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
                {sentRequests.filter(req => req.status === 'pending').length === 0 ? (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.2, fontStyle: 'italic' }}>No pending sent requests.</p>
                ) : sentRequests.filter(req => req.status === 'pending').map(req => (
                  <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(188,168,142,0.1)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: 20 }}>{req.receiver?.avatar_symbol || req.receiver?.full_name?.substring(0,1).toUpperCase() || '?'}</span>
                      <div>
                        <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 14, color: '#F0EBE0', margin: '0 0 2px' }}>{req.receiver?.full_name}</p>
                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, margin: 0, letterSpacing: 2 }}>{req.receiver?.st_id ? (req.receiver.st_id.startsWith('SUPR-') ? req.receiver.st_id : `SUPR-${req.receiver.st_id}`) : 'Pending'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ 
                        fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, padding: '4px 10px',
                        background: 'rgba(188,168,142,0.1)', color: '#BCA88E'
                      }}>PENDING</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mutual Connections */}
            <div>
              <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 20 }} />
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 4 }}>MUTUAL CONNECTIONS</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3, marginBottom: 28 }}>ACTIVE COLLABORATORS</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                {(() => {
                  const seen = new Set();
                  return [
                    ...receivedRequests.filter(req => req.status === 'accepted').map(req => ({ id: req.id, peer: req.sender })),
                    ...sentRequests.filter(req => req.status === 'accepted').map(req => ({ id: req.id, peer: req.receiver }))
                  ].filter(collab => {
                    if (!collab.peer) return false;
                    const key = collab.peer.st_id || collab.peer.id;
                    if (!key) return false;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                })().map(collab => (
                  <div key={collab.id} style={{ border: '1px solid rgba(188,168,142,0.2)', background: 'rgba(188,168,142,0.05)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{collab.peer?.avatar_symbol || collab.peer?.full_name?.substring(0,1).toUpperCase() || '?'}</span>
                        <div>
                          <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 14, color: '#F0EBE0', margin: '0 0 2px' }}>{collab.peer?.full_name}</p>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, margin: 0, letterSpacing: 2 }}>{collab.peer?.st_id ? (collab.peer.st_id.startsWith('SUPR-') ? collab.peer.st_id : `SUPR-${collab.peer.st_id}`) : 'Pending'}</p>
                        </div>
                      </div>
                    </div>
                    {collab.peer?.portfolio_url ? (
                      <a href={collab.peer.portfolio_url} target="_blank" rel="noreferrer" style={{ alignSelf: 'flex-start', fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 2, color: '#c9a84c', textDecoration: 'underline', marginTop: 8 }}>
                        VIEW WORK →
                      </a>
                    ) : (
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#BCA88E', opacity: 0.4, margin: '8px 0 0', letterSpacing: 2 }}>NO PORTFOLIO</p>
                    )}
                  </div>
                ))
              }
              </div>
            </div>

            {/* Find Crew */}
            <div>
              <div style={{ width: 28, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 20 }} />
              <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 18, color: '#BCA88E', letterSpacing: 2, marginBottom: 4 }}>DISCOVER CREW</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.3, letterSpacing: 3, marginBottom: 28 }}>AVAILABLE TECHNICIANS</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {otherCrew.map(tech => (
                  <div key={tech.id} style={{ border: '1px solid rgba(188,168,142,0.1)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16 }}>{tech.avatar_symbol || tech.full_name?.substring(0,1).toUpperCase() || '?'}</span>
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.3, margin: 0 }}>{tech.st_id ? (tech.st_id.startsWith('SUPR-') ? tech.st_id : `SUPR-${tech.st_id}`) : 'Pending'}</p>
                    </div>
                    <p style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 14, color: '#F0EBE0', margin: 0 }}>{tech.full_name}</p>
                    <button 
                      onClick={() => { setNewCollab({ ...newCollab, stId: tech.st_id || '' }); setExpandingNewCollab(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{ background: 'none', border: '1px solid rgba(188,168,142,0.2)', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 3, padding: '6px', cursor: 'pointer' }}
                    >CONNECT</button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
