import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface CinemaInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}

function CinemaInput({ label, placeholder, value, onChange, type = "text" }: CinemaInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>{label}</label>
      <input 
        type={type}
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(188,168,142,0.1)', padding: '12px 16px', color: '#F0EBE0', fontFamily: 'Inter, monospace', fontSize: 13, outline: 'none' }}
      />
    </div>
  );
}

interface CinemaTextareaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
}

function CinemaTextarea({ label, placeholder, value, onChange, rows = 3 }: CinemaTextareaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>{label}</label>
      <textarea 
        rows={rows}
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(188,168,142,0.1)', padding: '12px 16px', color: '#F0EBE0', fontFamily: 'Inter, monospace', fontSize: 13, outline: 'none', resize: 'vertical' }}
      />
    </div>
  );
}
const KANBAN_STAGES = [
  { id: 'inbox', label: 'INBOX', color: 'rgba(188,168,142,0.3)' },
  { id: 'under_review', label: 'UNDER REVIEW', color: 'rgba(100,160,255,0.3)' },
  { id: 'shortlisted', label: 'SHORTLISTED', color: 'rgba(255,200,80,0.3)' },
  { id: 'accepted', label: 'ACCEPTED', color: 'rgba(100,200,120,0.3)' },
  { id: 'rejected', label: 'REJECTED', color: 'rgba(255,80,80,0.2)' },
  { id: 'archived', label: 'ARCHIVED', color: 'rgba(100,100,100,0.2)' }
];

export default function AdminDashboard() {
  const { user: adminUser, loading: authLoading, isAdmin } = useAuth();
  const [section, setSection] = useState<'INBOX' | 'SCRIPTS' | 'BRIEFS' | 'PROJECT ROOMS' | 'CAMPAIGNS' | 'CREW' | 'TEMPLATES' | 'FILMS'>('INBOX');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setDebugStep] = useState<string>('Init');
  
  // INBOX state
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [typeFilter, setTypeFilter] = useState('all');
  const [submissions, setSubmissions] = useState<any[]>([]);

  // SCRIPTS / PIPELINE state
  const [scriptViewMode, setScriptViewMode] = useState<'list' | 'kanban'>('list');
  const [scripts, setScripts] = useState<any[]>([]);
  const [draggingScriptId, setDraggingScriptId] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<any[]>([]);

  // PROJECT ROOMS state
  const [projectRooms, setProjectRooms] = useState<any[]>([]);
  const [newRoom, setNewRoom] = useState({ title: '', script_id: '', brief: '' });
  const [replyState, setReplyState] = useState<{ id: string | null, text: string }>({ id: null, text: '' });

  // CAMPAIGNS state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [newCampaign, setNewCampaign] = useState({ title: '', goal: '', deadline: '', status: 'active', kit_captions: '', kit_hashtags: '', kit_drive_link: '', group_sync_at: '' });

  // CREW state
  const [crew, setCrew] = useState<any[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<any>(null);
  // FILMS state
  const [films, setFilms] = useState<any[]>([]);
  const [editingFilm, setEditingFilm] = useState<any>(null);
  const [newFilm, setNewFilm] = useState<any>({
    title: '', logline: '', rating: 'UA', duration: '',
    director: '', producer: '', cast_members: '', synopsis: '', special_note: '',
    video_link: '', reel_image: '', poster_image: '', coming_soon: false, stills: []
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [reelFile, setReelFile] = useState<File | null>(null);
  const [still1File, setStill1File] = useState<File | null>(null);
  const [still2File, setStill2File] = useState<File | null>(null);
  const [still3File, setStill3File] = useState<File | null>(null);
  const [uploadingFilm, setUploadingFilm] = useState(false);

  // TEMPLATES state
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({ label: '', type: 'REPLY', subject: '', body: '' });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [useTemplateModal, setUseTemplateModal] = useState<any>(null);
  const [templateVars, setTemplateVars] = useState({ writer_name: '', script_title: '', reviewer_name: '' });

  // PROJECT ROOMS upgrades
  const [roomStatusFilter, setRoomStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'>('ALL');
  const [acceptedScripts, setAcceptedScripts] = useState<any[]>([]);
  const [roomMemberId, setRoomMemberId] = useState<Record<string, string>>({}); // {roomId: stId}
  const [creatingRoom, setCreatingRoom] = useState(false);

  const fetchIdRef = useRef(0);

  const fetchData = async () => {
    const fetchId = ++fetchIdRef.current;
    try {
      setDebugStep('Started fetchData');
      setLoading(true);
      setError(null);

      if (section === 'INBOX') {
        setDebugStep('Fetching INBOX submissions...');
        const { data, error: err } = await supabase.from('submissions').select('*, profiles(full_name, avatar_symbol)').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        setDebugStep('INBOX fetch complete');
        if (err) throw err;
        setSubmissions(data || []);
      } else if (section === 'SCRIPTS') {
        const { data, error: err } = await supabase.from('scripts').select('*, user:profiles(full_name, avatar_symbol, st_id, role)').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) throw err;
        setScripts(data || []);
      } else if (section === 'BRIEFS') {
        const { data, error: err } = await supabase.from('film_briefs').select('*, producer:profiles(full_name, avatar_symbol)').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) throw err;
        setBriefs(data || []);
      } else if (section === 'PROJECT ROOMS') {
        const { data, error: err } = await supabase.from('project_rooms').select('*, project_room_members(*, profiles(id, full_name, avatar_symbol, avatar_url, st_id))').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) throw err;
        setProjectRooms(data || []);
      } else if (section === 'CAMPAIGNS') {
        const { data, error: err } = await supabase.from('campaigns').select('*, campaign_assignments(count)').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) {
          const { data: fallbackData } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
          if (fetchId !== fetchIdRef.current) return;
          setCampaigns(fallbackData || []);
        } else {
          setCampaigns(data || []);
        }
      } else if (section === 'CREW') {
        const { data, error: err } = await supabase.from('profiles').select('*, submissions(*)').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) throw err;
        const sortedCrew = (data || []).sort((a, b) => {
          const aRecent = a.submissions?.length ? new Date(a.submissions[0].created_at).getTime() : 0;
          const bRecent = b.submissions?.length ? new Date(b.submissions[0].created_at).getTime() : 0;
          return bRecent - aRecent;
        });
        setCrew(sortedCrew);
      } else if (section === 'FILMS') {
        const { data, error: err } = await supabase.from('films').select('*').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) throw err;
        setFilms(data || []);
      } else if (section === 'TEMPLATES') {
        const { data, error: err } = await supabase.from('admin_templates').select('*').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) throw err;
        setDbTemplates(data || []);
      }

      setDebugStep('Checking PROJECT ROOMS secondary fetch');
      if (section === 'PROJECT ROOMS') {
        const { data: scripts } = await supabase.from('scripts').select('id, title').eq('kanban_stage', 'accepted');
        if (fetchId !== fetchIdRef.current) return;
        setAcceptedScripts(scripts || []);
      }
      setDebugStep('Try block complete');
    } catch (err: any) {
      if (fetchId !== fetchIdRef.current) return;
      setDebugStep('Caught error: ' + err.message);
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setDebugStep(prev => prev + ' -> Finally block');
        setLoading(false);
      }
    }
  };

  useEffect(() => { 
    if (adminUser && isAdmin) fetchData(); 
    else if (!authLoading) setLoading(false);
  }, [section, adminUser, authLoading, isAdmin]);

  // Actions
  const moveScriptStage = async (scriptId: string, newStage: string) => {
    // Optimistic Update
    const oldScripts = [...scripts];
    setScripts(prev => prev.map(s => s.id === scriptId ? { ...s, kanban_stage: newStage } : s));

    const { error } = await supabase.from('scripts').update({ kanban_stage: newStage }).eq('id', scriptId);
    if (error) {
      alert(`Error moving script: ${error.message}`);
      setScripts(oldScripts);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel(`admin_live_updates_${section}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // fetchData is stable within the section's scope; section is the key dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);


  const toggleVerification = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ st_verified: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      setCrew(prev => prev.map(c => c.id === memberId ? { ...c, st_verified: !currentStatus } : c));
      if (selectedCrew?.id === memberId) {
        setSelectedCrew((prev: any) => prev ? { ...prev, st_verified: !currentStatus } : null);
      }
    } catch (err: any) {
      console.error('Failed to toggle verification:', err);
      alert(`VERIFICATION ERROR: ${err.message}`);
    }
  };

  const updateSubStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('submissions').update({ status }).eq('id', id);
    if (error) alert(`Error: ${error.message}`);
    fetchData();
  };

  const toggleBriefStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('film_briefs').update({ is_open: !currentStatus }).eq('id', id);
    if (error) alert(`Error: ${error.message}`);
    else fetchData();
  };

  const createRoom = async () => {
    if (!newRoom.title || !adminUser) return;
    setCreatingRoom(true);
    try {
      let scriptWriterId: string | null = null;
      const scriptId = (newRoom as any).script_id;
      if (scriptId) {
        const { data: scriptData } = await supabase
          .from('scripts')
          .select('user_id')
          .eq('id', scriptId)
          .single();
        if (scriptData && scriptData.user_id) {
          scriptWriterId = scriptData.user_id;
        }
      }

      const memberIds = [adminUser.id];
      if (scriptWriterId && scriptWriterId !== adminUser.id) {
        memberIds.push(scriptWriterId);
      }

      const { data: insertedRoom, error } = await supabase
        .from('project_rooms')
        .insert({ 
          title: newRoom.title,
          script_id: scriptId || null,
          notes: newRoom.brief,
          status: 'active', 
          created_by: adminUser.id,
          member_ids: memberIds
        })
        .select()
        .single();
      
      if (error) throw error;

      if (insertedRoom) {
        // Insert member rows into project_room_members join table
        const memberRows = memberIds.map(uid => ({
          room_id: insertedRoom.id,
          user_id: uid
        }));
        const { error: membersErr } = await supabase
          .from('project_room_members')
          .insert(memberRows);
        if (membersErr) {
          console.error("Failed to insert project room members:", membersErr);
        }
      }

      setNewRoom({ title: '', script_id: '', brief: '' }); 
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setCreatingRoom(false); }
  };

  const updateRoomStatus = async (roomId: string, status: string) => {
    const { error } = await supabase.from('project_rooms').update({ status }).eq('id', roomId);
    if (!error) fetchData();
  };

  const updateRoomNote = async (roomId: string, notes: string) => {
    const { error } = await supabase.from('project_rooms').update({ notes }).eq('id', roomId);
    if (!error) fetchData();
  };

  const awardBadge = async (roomId: string) => {
    const { error } = await supabase.from('project_rooms').update({ completion_badge_awarded: true }).eq('id', roomId);
    if (!error) {
      alert("🎖 Completion badge awarded to all members");
      fetchData();
    }
  };

  const addMemberToRoom = async (roomId: string, stId: string, existingMembers: string[]) => {
    if (!stId) return;
    try {
      let cleanedId = stId.trim().toUpperCase();
      if (cleanedId.startsWith('ST-')) {
        cleanedId = cleanedId.substring(3);
      }
      if (!cleanedId.startsWith('SUPR-')) {
        cleanedId = `SUPR-${cleanedId}`;
      }
      const { data: profile, error } = await supabase.from('profiles').select('id').eq('st_id', cleanedId).single();
      if (error || !profile) throw new Error("Member not found.");
      if (existingMembers.includes(profile.id)) throw new Error("Already a member.");

      const { error: updErr } = await supabase.from('project_rooms').update({ 
        member_ids: [...existingMembers, profile.id] 
      }).eq('id', roomId);
      
      if (updErr) throw updErr;

      // Also insert into project_room_members join table
      const { error: joinErr } = await supabase.from('project_room_members').insert({
        room_id: roomId,
        user_id: profile.id
      });
      if (joinErr) {
        console.error("Failed to insert member into project_room_members join table:", joinErr);
      }

      setRoomMemberId({ ...roomMemberId, [roomId]: '' });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const saveTemplate = async () => {
    if (!newTemplate.label || !newTemplate.body) return;
    try {
      if (editingTemplateId) {
        await supabase.from('admin_templates').update(newTemplate).eq('id', editingTemplateId);
      } else {
        await supabase.from('admin_templates').insert(newTemplate);
      }
      setNewTemplate({ label: '', type: 'REPLY', subject: '', body: '' });
      setEditingTemplateId(null);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Discard this template?')) return;
    const { error } = await supabase.from('admin_templates').delete().eq('id', id);
    if (!error) fetchData();
  };

  const createCampaign = async () => {
    if (!newCampaign.title || !adminUser) return;
    const payload = {
      ...newCampaign,
      created_by: adminUser.id,
      deadline: newCampaign.deadline || null,
      group_sync_at: newCampaign.group_sync_at || null,
    };
    const { error } = await supabase.from('campaigns').insert([payload]);
    if (error) alert(error.message);
    else { setNewCampaign({ title: '', goal: '', deadline: '', status: 'active', kit_captions: '', kit_hashtags: '', kit_drive_link: '', group_sync_at: '' }); fetchData(); }
  };

  const saveCampaignEdit = async () => {
    if (!editingCampaign) return;
    const { error } = await supabase.from('campaigns').update(editingCampaign).eq('id', editingCampaign.id);
    if (error) alert(error.message);
    else { setEditingCampaign(null); fetchData(); }
  };

  const TEMPLATES = [
    { label: 'ACKNOWLEDGED', text: 'Thank you for submitting to Supreme Talkies. We have received your submission and will review it within 7 days.' },
    { label: 'SHORTLISTED', text: 'Your submission has been shortlisted. We are seriously considering it for development. Expect to hear from us within 3 days.' },
    { label: 'IN DEVELOPMENT', text: 'Exciting news — your submission is now officially in development with Supreme Talkies. Welcome to the family.' },
    { label: 'MORE INFO', text: 'We loved your submission and would like to learn more. Could you share additional details or arrange a call?' },
    { label: 'NOT THIS TIME', text: 'Thank you for trusting us with your work. While this one is not the right fit right now, we encourage you to submit again.' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard. Send via your preferred channel (email/DM).");
  };

  
  const saveFilm = async () => {
    try {
      setUploadingFilm(true);
      
      let finalPosterUrl = newFilm.poster_image;
      let finalReelUrl = newFilm.reel_image;
      let finalStills = newFilm.stills || [];

      // Helper function for uploading
      const uploadFile = async (file: File, folder: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('cinematic_assets').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('cinematic_assets').getPublicUrl(filePath);
        return publicUrl;
      };

      if (posterFile) finalPosterUrl = await uploadFile(posterFile, 'posters');
      if (reelFile) finalReelUrl = await uploadFile(reelFile, 'reels');
      
      const newStills = [...finalStills];
      if (still1File) newStills[0] = await uploadFile(still1File, 'stills');
      if (still2File) newStills[1] = await uploadFile(still2File, 'stills');
      if (still3File) newStills[2] = await uploadFile(still3File, 'stills');

      const filmPayload = { ...newFilm, poster_image: finalPosterUrl, reel_image: finalReelUrl, stills: newStills.filter(Boolean) };

      if (editingFilm) {
        const { error } = await supabase.from('films').update(filmPayload).eq('id', editingFilm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('films').insert([filmPayload]);
        if (error) throw error;
      }
      
      setEditingFilm(null);
      setPosterFile(null);
      setReelFile(null);
      setStill1File(null);
      setStill2File(null);
      setStill3File(null);
      setNewFilm({ title: '', logline: '', rating: 'UA', duration: '', director: '', producer: '', cast_members: '', synopsis: '', special_note: '', video_link: '', reel_image: '', poster_image: '', coming_soon: false, stills: [] });
      fetchData();
    } catch (e: any) { 
      alert(e.message); 
    } finally {
      setUploadingFilm(false);
    }
  };

  const filteredSubmissions = useMemo(() => 
    submissions.filter(s => typeFilter === 'all' || s.type === typeFilter)
  , [submissions, typeFilter]);

  if (!authLoading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Removed blocking loading screen to prevent hang.
  // The UI will now render even if fetchData is hanging, allowing the user to navigate tabs.

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* Top Section Tabs */}
      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid rgba(188,168,142,0.1)', paddingBottom: 0, overflowX: 'auto' }}>
        {['INBOX', 'SCRIPTS', 'BRIEFS', 'PROJECT ROOMS', 'CAMPAIGNS', 'CREW', 'TEMPLATES', 'FILMS'].map(s => (
          <button key={s} onClick={() => setSection(s as any)}
            style={{ 
              background: 'none', border: 'none', borderBottom: section === s ? '2px solid #BCA88E' : '2px solid transparent',
              padding: '16px 0', fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 5, whiteSpace: 'nowrap',
              color: section === s ? '#BCA88E' : 'rgba(188,168,142,0.3)', cursor: 'pointer', transition: 'all 0.3s'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: 20, border: '1px solid rgba(255,0,0,0.2)', background: 'rgba(255,0,0,0.05)', color: 'rgba(255,0,0,0.7)', fontSize: 10, fontFamily: 'Inter, monospace' }}>
          ERROR: {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {section === 'INBOX' && (
          <motion.div key="inbox" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Inbox Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
                {['all', 'script', 'portfolio', 'film', 'collab', 'producer_interest'].map(type => (
                  <button key={type} onClick={() => setTypeFilter(type)}
                    style={{
                      background: typeFilter === type ? 'rgba(188,168,142,0.1)' : 'none',
                      border: '1px solid rgba(188,168,142,0.1)',
                      padding: '6px 12px', fontFamily: 'Inter, monospace', fontSize: 9, letterSpacing: 2,
                      color: typeFilter === type ? '#BCA88E' : 'rgba(188,168,142,0.5)', cursor: 'pointer'
                    }}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {['LIST', 'KANBAN'].map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode.toLowerCase() as any)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'Inter, monospace', fontSize: 9, letterSpacing: 3,
                      color: viewMode === mode.toLowerCase() ? '#BCA88E' : 'rgba(188,168,142,0.4)',
                      padding: '8px 0', borderBottom: viewMode === mode.toLowerCase() ? '1px solid #BCA88E' : '1px solid transparent'
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {viewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {filteredSubmissions.length === 0 && !loading && (
                  <p style={{ textAlign: 'center', opacity: 0.3, fontSize: 11, padding: 40 }}>NO SUBMISSIONS FOUND</p>
                )}
                {filteredSubmissions.map(sub => (
                  <div key={sub.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span style={{ fontSize: 24 }}>{sub.profiles?.avatar_symbol}</span>
                        <div>
                          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EBE0', margin: 0 }}>
                            {sub.type === 'collab' ? sub.data?.platform : sub.data?.title || sub.data?.genre || 'Untitled'}
                          </p>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: 0 }}>
                            {sub.type?.toUpperCase()} · {sub.profiles?.full_name} · {sub.status?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => updateSubStatus(sub.id, 'accepted')} style={{ background: 'none', border: '1px solid #BCA88E', color: '#BCA88E', fontSize: 9, padding: '4px 12px', cursor: 'pointer' }}>ACCEPT</button>
                        <button onClick={() => updateSubStatus(sub.id, 'archived')} style={{ background: 'none', border: '1px solid rgba(255,0,0,0.3)', color: 'rgba(255,0,0,0.5)', fontSize: 9, padding: '4px 12px', cursor: 'pointer' }}>ARCHIVE</button>
                      </div>
                    </div>
                    
                    <pre style={{ margin: '0 0 20px', fontSize: 10, color: '#BCA88E', opacity: 0.4, whiteSpace: 'pre-wrap' }}>{JSON.stringify(sub.data, null, 2)}</pre>

                    {/* Quick Reply */}
                    <div style={{ borderTop: '1px solid rgba(188,168,142,0.05)', paddingTop: 16 }}>
                      <button onClick={() => setReplyState({ id: replyState.id === sub.id ? null : sub.id, text: '' })} 
                        style={{ background: 'none', border: 'none', color: '#BCA88E', fontSize: 9, letterSpacing: 2, cursor: 'pointer', padding: 0, opacity: 0.6 }}>
                        {replyState.id === sub.id ? '✕ CLOSE' : '↶ SEND TEMPLATE'}
                      </button>
                      
                      {replyState.id === sub.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {TEMPLATES.map(t => (
                              <button key={t.label} onClick={() => setReplyState({ ...replyState, text: t.text })}
                                style={{ background: 'none', border: '1px solid rgba(188,168,142,0.15)', padding: '4px 10px', color: '#BCA88E', fontFamily: 'Inter, monospace', fontSize: 8, letterSpacing: 3, cursor: 'pointer' }}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                          <CinemaTextarea value={replyState.text} onChange={(v: string) => setReplyState({ ...replyState, text: v })} placeholder="Type your reply here..." />
                          <button onClick={() => copyToClipboard(replyState.text)} 
                            style={{ alignSelf: 'flex-start', background: '#BCA88E', color: '#0e0f13', border: 'none', padding: '8px 24px', fontFamily: 'Inter, monospace', fontSize: 10, fontWeight: 700, letterSpacing: 2, cursor: 'pointer' }}>
                            COPY TO CLIPBOARD
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20 }}>
                {['submitted', 'under_review', 'accepted', 'archived'].map(status => (
                  <div key={status} style={{ width: 260, flexShrink: 0, background: 'rgba(0,0,0,0.2)', minHeight: 400 }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(188,168,142,0.1)', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 5 }}>
                      {status.toUpperCase()}
                    </div>
                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {filteredSubmissions.filter(s => s.status === status).map(sub => (
                        <div key={sub.id} style={{ background: 'rgba(188,168,142,0.03)', border: '1px solid rgba(188,168,142,0.1)', padding: 12 }}>
                          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, color: '#F0EBE0', margin: '0 0 4px' }}>{sub.data?.title || 'Untitled'}</p>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.4, margin: 0 }}>{sub.profiles?.full_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {section === 'SCRIPTS' && (
          <motion.div key="scripts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Status Summary Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, padding: '24px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(188,168,142,0.15)' }}>
              {KANBAN_STAGES.filter(st => st.id !== 'archived').map(stage => {
                const count = scripts.filter(s => (s.kanban_stage || 'inbox') === stage.id).length;
                return (
                  <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4, fontWeight: 700 }}>{stage.label}</span>
                    <span style={{ fontFamily: 'Inter, monospace', fontSize: 24, color: '#F0EBE0', fontWeight: 300 }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* View Toggle */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
              {['LIST', 'KANBAN'].map(mode => (
                <button key={mode} onClick={() => setScriptViewMode(mode.toLowerCase() as any)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter, monospace', fontSize: 9, letterSpacing: 3,
                    color: scriptViewMode === mode.toLowerCase() ? '#BCA88E' : 'rgba(188,168,142,0.4)',
                    padding: '8px 0', borderBottom: scriptViewMode === mode.toLowerCase() ? '1px solid #BCA88E' : '1px solid transparent'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {scriptViewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {scripts.map(s => (
                  <div key={s.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <span style={{ fontSize: 24 }}>{s.user?.avatar_symbol}</span>
                      <div>
                        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EBE0', margin: '0 0 4px' }}>{s.title}</p>
                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: '0 0 12px' }}>
                          BY {s.user?.full_name} · V{s.version_number} · {s.kanban_stage?.toUpperCase() || 'INBOX'}
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {s.dna_mood?.map((m: string) => <span key={m} style={{ fontSize: 8, background: 'rgba(188,168,142,0.05)', border: '1px solid rgba(188,168,142,0.1)', padding: '2px 8px', color: '#BCA88E', letterSpacing: 1 }}>{m.toUpperCase()}</span>)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
                      <a href={s.pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#BCA88E', textDecoration: 'underline', letterSpacing: 2 }}>READ SCRIPT →</a>
                      
                      {/* Stage Selector */}
                      <select
                        value={s.kanban_stage || 'inbox'}
                        onChange={(e) => moveScriptStage(s.id, e.target.value)}
                        style={{
                          background: 'rgba(14,15,20,0.95)',
                          border: '1px solid rgba(188,168,142,0.25)',
                          color: '#BCA88E',
                          fontFamily: '"Montserrat", sans-serif',
                          fontSize: 9,
                          letterSpacing: 3,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          outline: 'none',
                          marginTop: 4
                        }}
                      >
                        {KANBAN_STAGES.map(st => (
                          <option key={st.id} value={st.id}>{st.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* KANBAN VIEW */
              <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20, minHeight: '600px' }}>
                {KANBAN_STAGES.map((stage) => {
                  const stageScripts = scripts.filter(s => (s.kanban_stage || 'inbox') === stage.id);
                  return (
                    <div key={stage.id} 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => draggingScriptId && moveScriptStage(draggingScriptId, stage.id)}
                      style={{ minWidth: 280, maxWidth: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}
                    >
                      {/* Column Header */}
                      <div style={{ borderTop: `2px solid ${stage.color}`, paddingTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 6, color: '#BCA88E', margin: 0 }}>{stage.label}</p>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(188,168,142,0.15)', color: '#BCA88E', fontSize: 11, fontFamily: 'Inter, monospace' }}>
                            {stageScripts.length}
                          </span>
                        </div>
                      </div>

                      {/* Card Container */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stageScripts.map(script => (
                          <div key={script.id} 
                            draggable="true"
                            onDragStart={() => setDraggingScriptId(script.id)}
                            onDragEnd={() => setDraggingScriptId(null)}
                            style={{ 
                              background: 'rgba(14,15,20,0.95)', border: '1px solid rgba(188,168,142,0.1)', padding: 14, cursor: 'grab',
                              boxShadow: draggingScriptId === script.id ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
                              opacity: draggingScriptId === script.id ? 0.4 : 1
                            }}
                          >
                            <h4 style={{ fontFamily: 'Playfair Display, sans-serif', fontSize: 14, color: '#F0EBE0', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {script.title}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <span style={{ fontSize: 16 }}>{script.user?.avatar_symbol || '👤'}</span>
                              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', margin: 0 }}>{script.user?.full_name}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontFamily: 'Inter, monospace', fontSize: 8, color: '#BCA88E', opacity: 0.6, background: 'rgba(188,168,142,0.1)', padding: '2px 6px', letterSpacing: 1 }}>
                                {script.user?.role?.toUpperCase() || 'WRITER'}
                              </span>
                              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: 'rgba(188,168,142,0.4)' }}>
                                {new Date(script.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Stage Selector */}
                            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(188,168,142,0.05)' }}>
                              <select
                                value={script.kanban_stage || 'inbox'}
                                onChange={(e) => moveScriptStage(script.id, e.target.value)}
                                style={{
                                  width: '100%',
                                  background: 'rgba(14,15,20,0.95)',
                                  border: '1px solid rgba(188,168,142,0.2)',
                                  color: '#BCA88E',
                                  fontFamily: '"Montserrat", sans-serif',
                                  fontSize: 9,
                                  letterSpacing: 2,
                                  padding: '7px 10px',
                                  cursor: 'pointer',
                                  outline: 'none',
                                }}
                              >
                                {KANBAN_STAGES.map(st => (
                                  <option key={st.id} value={st.id}>{st.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {section === 'BRIEFS' && (
          <motion.div key="briefs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {briefs.map(b => (
              <div key={b.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{b.producer?.avatar_symbol}</span>
                    <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EBE0', margin: 0 }}>{b.title}</p>
                  </div>
                  <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: '0 0 12px' }}>
                    PRODUCER: {b.producer?.full_name} · BUDGET: {b.budget_range}
                  </p>
                  <p style={{ fontSize: 11, color: '#F0EBE0', opacity: 0.7, maxWidth: 500, lineHeight: 1.5 }}>{b.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => toggleBriefStatus(b.id, b.is_open)} style={{ background: 'none', border: `1px solid ${b.is_open ? '#4ade80' : '#BCA88E'}`, color: b.is_open ? '#4ade80' : '#BCA88E', fontSize: 9, padding: '4px 12px', letterSpacing: 2, cursor: 'pointer' }}>
                    {b.is_open ? 'OPEN' : 'CLOSED'}
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {section === 'PROJECT ROOMS' && (
          <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Filter */}
            <div style={{ display: 'flex', gap: 12 }}>
              {['ALL', 'ACTIVE', 'COMPLETED', 'ARCHIVED'].map(s => (
                <button key={s} onClick={() => setRoomStatusFilter(s as any)}
                  style={{
                    background: roomStatusFilter === s ? 'rgba(188,168,142,0.1)' : 'none',
                    border: '1px solid rgba(188,168,142,0.15)', padding: '6px 14px',
                    color: roomStatusFilter === s ? '#BCA88E' : 'rgba(188,168,142,0.4)',
                    fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 3, cursor: 'pointer'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Create Room Form */}
            <div style={{ padding: 32, border: '1px solid rgba(188,168,142,0.2)', background: 'rgba(188,168,142,0.03)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#BCA88E', margin: 0 }}>NEW PROJECT ROOM</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <CinemaInput label="ROOM TITLE" value={newRoom.title} onChange={(v: string) => setNewRoom({ ...newRoom, title: v })} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>LINKED SCRIPT</label>
                  <select 
                    value={(newRoom as any).script_id} onChange={e => setNewRoom({ ...newRoom, script_id: e.target.value } as any)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(188,168,142,0.1)', padding: '12px 16px', color: '#F0EBE0', fontFamily: 'Montserrat, sans-serif', fontSize: 11, outline: 'none' }}
                  >
                    <option value="">-- SELECT SCRIPT --</option>
                    {acceptedScripts.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>
              <CinemaTextarea label="INITIAL NOTES" value={newRoom.brief} onChange={(v: string) => setNewRoom({ ...newRoom, brief: v })} />
              <button onClick={createRoom} disabled={creatingRoom} style={{ background: '#BCA88E', color: '#0e0f13', border: 'none', padding: '12px', fontFamily: 'Inter, monospace', fontSize: 11, letterSpacing: 4, fontWeight: 700, cursor: 'pointer', opacity: creatingRoom ? 0.5 : 1 }}>
                {creatingRoom ? 'INITIATING...' : 'CREATE ROOM'}
              </button>
            </div>

            {/* Room Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 32 }}>
              {projectRooms.filter(r => roomStatusFilter === 'ALL' || r.status?.toUpperCase() === roomStatusFilter).map(room => (
                <div key={room.id} style={{ padding: 32, background: 'rgba(30,32,41,0.7)', border: '1px solid rgba(188,168,142,0.15)', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontStyle: 'italic', color: '#F0EBE0', margin: '0 0 8px' }}>{room.title}</h3>
                      {room.scripts?.title && <span style={{ fontSize: 9, background: 'rgba(188,168,142,0.1)', color: '#BCA88E', padding: '2px 8px', letterSpacing: 2 }}>{room.scripts.title.toUpperCase()}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 9, padding: '3px 10px', background: room.status === 'active' ? 'rgba(188,168,142,0.15)' : room.status === 'completed' ? 'rgba(74,222,128,0.1)' : 'rgba(100,100,100,0.1)', color: room.status === 'active' ? '#BCA88E' : room.status === 'completed' ? '#4ade80' : '#888', border: '1px solid currentColor', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 3 }}>
                        {room.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <textarea 
                    value={room.notes} onChange={e => updateRoomNote(room.id, e.target.value)}
                    onBlur={() => {}} // Could add a "Saved" toast here
                    style={{ background: 'transparent', border: 'none', color: '#F0EBE0', opacity: 0.6, fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.7, outline: 'none', resize: 'none', padding: 0 }}
                    rows={3}
                  />

                  <div style={{ borderTop: '1px solid rgba(188,168,142,0.1)', paddingTop: 20 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 4, color: '#BCA88E', marginBottom: 16 }}>TEAM MEMBERS</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {room.project_room_members && room.project_room_members.length > 0 ? (
                          room.project_room_members.map((m: any, idx: number) => {
                            const prof = m?.profiles;
                            if (!prof) return null;
                            const displayName = prof.full_name || 'Member';
                            const displayStId = prof.st_id ? (prof.st_id.startsWith('SUPR-') ? prof.st_id : `SUPR-${prof.st_id}`) : 'Pending';
                            const hoverTitle = `${displayName} (${displayStId})`;
                            
                            return (
                              <div 
                                key={prof.id || idx} 
                                title={hoverTitle}
                                style={{ 
                                  width: 28, 
                                  height: 28, 
                                  background: '#16181f', 
                                  border: '1px solid #BCA88E', 
                                  borderRadius: '50%', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  fontSize: 10, 
                                  fontWeight: 600,
                                  color: '#BCA88E',
                                  marginLeft: idx > 0 ? -10 : 0, 
                                  zIndex: 10 - idx,
                                  overflow: 'hidden',
                                  cursor: 'default'
                                }}
                              >
                                {prof.avatar_url ? (
                                  <img src={prof.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span>{prof.avatar_symbol || (prof.full_name ? prof.full_name.substring(0, 1).toUpperCase() : '👤')}</span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          room.member_ids?.map((mId: string, idx: number) => (
                            <div key={mId} style={{ width: 28, height: 28, background: '#16181f', border: '1px solid #BCA88E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginLeft: idx > 0 ? -10 : 0, zIndex: 10 - idx }}>👤</div>
                          ))
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input 
                          type="text" placeholder="SUPR-12345" value={roomMemberId[room.id] || ''} onChange={e => setRoomMemberId({ ...roomMemberId, [room.id]: e.target.value })}
                          style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(188,168,142,0.3)', color: '#F0EBE0', fontFamily: 'Inter, monospace', fontSize: 11, outline: 'none', width: 80 }}
                        />
                        <button onClick={() => addMemberToRoom(room.id, roomMemberId[room.id], room.member_ids)} style={{ background: 'none', border: '1px solid #BCA88E', color: '#BCA88E', padding: '4px 10px', fontSize: 8, cursor: 'pointer' }}>ADD</button>
                      </div>
                    </div>

                    {room.status === 'completed' && !room.completion_badge_awarded && (
                      <button onClick={() => awardBadge(room.id)} style={{ width: '100%', background: 'linear-gradient(90deg, #BCA88E, #F0EBE0)', color: '#0e0f13', border: 'none', padding: '12px', fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: 3, cursor: 'pointer', marginBottom: 16 }}>
                        AWARD COMPLETION BADGE 🎖
                      </button>
                    )}

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => updateRoomStatus(room.id, 'active')} style={{ flex: 1, background: 'none', border: '1px solid rgba(188,168,142,0.2)', color: '#BCA88E', fontSize: 9, padding: '8px', cursor: 'pointer' }}>MARK ACTIVE</button>
                      <button onClick={() => updateRoomStatus(room.id, 'completed')} style={{ flex: 1, background: 'none', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: 9, padding: '8px', cursor: 'pointer' }}>MARK COMPLETE</button>
                      <button onClick={() => updateRoomStatus(room.id, 'archived')} style={{ flex: 1, background: 'none', border: '1px solid rgba(255,80,80,0.2)', color: '#ff5050', fontSize: 9, padding: '8px', cursor: 'pointer' }}>ARCHIVE</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {section === 'CAMPAIGNS' && (
          <motion.div key="campaigns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Create/Edit Form */}
            <div style={{ padding: 32, border: '1px solid rgba(188,168,142,0.2)', background: 'rgba(188,168,142,0.03)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#BCA88E', margin: 0 }}>{editingCampaign ? 'EDIT CAMPAIGN' : 'NEW CAMPAIGN'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <CinemaInput label="CAMPAIGN TITLE" value={editingCampaign ? editingCampaign.title : newCampaign.title} onChange={(v: string) => editingCampaign ? setEditingCampaign({ ...editingCampaign, title: v }) : setNewCampaign({ ...newCampaign, title: v })} />
                <CinemaInput label="GOAL" value={editingCampaign ? editingCampaign.goal : newCampaign.goal} onChange={(v: string) => editingCampaign ? setEditingCampaign({ ...editingCampaign, goal: v }) : setNewCampaign({ ...newCampaign, goal: v })} />
                <CinemaInput type="date" label="DEADLINE" value={editingCampaign ? editingCampaign.deadline : newCampaign.deadline} onChange={(v: string) => editingCampaign ? setEditingCampaign({ ...editingCampaign, deadline: v }) : setNewCampaign({ ...newCampaign, deadline: v })} />
                <CinemaInput type="datetime-local" label="GROUP SYNC TIME" value={editingCampaign ? editingCampaign.group_sync_at : newCampaign.group_sync_at} onChange={(v: string) => editingCampaign ? setEditingCampaign({ ...editingCampaign, group_sync_at: v }) : setNewCampaign({ ...newCampaign, group_sync_at: v })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <CinemaTextarea label="CAPTION TEMPLATE" value={editingCampaign ? editingCampaign.kit_captions : newCampaign.kit_captions} onChange={(v: string) => editingCampaign ? setEditingCampaign({ ...editingCampaign, kit_captions: v }) : setNewCampaign({ ...newCampaign, kit_captions: v })} />
                <CinemaTextarea label="HASHTAGS" value={editingCampaign ? editingCampaign.kit_hashtags : newCampaign.kit_hashtags} onChange={(v: string) => editingCampaign ? setEditingCampaign({ ...editingCampaign, kit_hashtags: v }) : setNewCampaign({ ...newCampaign, kit_hashtags: v })} />
              </div>
              <CinemaInput label="DRIVE LINK" value={editingCampaign ? editingCampaign.kit_drive_link : newCampaign.kit_drive_link} onChange={(v: string) => editingCampaign ? setEditingCampaign({ ...editingCampaign, kit_drive_link: v }) : setNewCampaign({ ...newCampaign, kit_drive_link: v })} />
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={editingCampaign ? saveCampaignEdit : createCampaign} style={{ flex: 1, background: '#BCA88E', color: '#0e0f13', border: 'none', padding: '12px', fontFamily: 'Inter, monospace', fontSize: 11, letterSpacing: 4, fontWeight: 700, cursor: 'pointer' }}>
                  {editingCampaign ? 'SAVE CHANGES' : 'PUBLISH CAMPAIGN'}
                </button>
                {editingCampaign && <button onClick={() => setEditingCampaign(null)} style={{ background: 'none', border: '1px solid rgba(255,0,0,0.3)', color: 'rgba(255,0,0,0.5)', padding: '0 24px', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>}
              </div>
            </div>

            {/* Campaign List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {campaigns.length === 0 && !loading && (
                <p style={{ textAlign: 'center', opacity: 0.3, fontSize: 11, padding: 40 }}>NO CAMPAIGNS ACTIVE</p>
              )}
              {campaigns.map(c => (
                <div key={c.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div>
                      <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EBE0', margin: '0 0 4px' }}>{c.title}</p>
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 11, color: '#BCA88E', opacity: 0.6, margin: 0 }}>{c.goal}</p>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(188,168,142,0.1)', paddingLeft: 24 }}>
                      <p style={{ fontSize: 18, color: '#BCA88E', margin: 0 }}>{c.campaign_assignments?.[0]?.count || 0}</p>
                      <p style={{ fontSize: 8, letterSpacing: 2, opacity: 0.5 }}>ASSIGNEES</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 9, padding: '2px 8px', border: '1px solid #BCA88E', color: '#BCA88E', letterSpacing: 2 }}>{c.status?.toUpperCase()}</span>
                    <button onClick={() => setEditingCampaign(c)} style={{ background: 'none', border: 'none', color: '#BCA88E', fontSize: 10, letterSpacing: 3, cursor: 'pointer', textDecoration: 'underline' }}>EDIT</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {section === 'CREW' && (
          <motion.div key="crew" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 24, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
            {/* Crew List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '80vh' }}>
              {crew.map(c => (
                <div key={c.id} 
                  onClick={() => setSelectedCrew(c)}
                  style={{ 
                    padding: 24, border: '1px solid', borderColor: selectedCrew?.id === c.id ? '#BCA88E' : 'rgba(188,168,142,0.1)', 
                    background: selectedCrew?.id === c.id ? 'rgba(188,168,142,0.05)' : 'rgba(0,0,0,0.2)', 
                    display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                >
                  <span style={{ fontSize: 24 }}>{c.avatar_symbol}</span>
                  <div>
                    <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EBE0', margin: '0 0 4px' }}>{c.full_name}</p>
                    <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: 0 }}>
                      {c.st_id ? (c.st_id.startsWith('SUPR-') ? c.st_id : 'SUPR-' + c.st_id) : 'NO-ID'} · {c.role?.toUpperCase()} · {c.st_verified ? 'VERIFIED' : 'UNVERIFIED'}
                    </p>
                    {c.submissions?.length > 0 && (
                      <p style={{ fontSize: 9, color: '#4ade80', margin: '4px 0 0', letterSpacing: 1 }}>{c.submissions.length} SUBMISSION(S)</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Crew Details */}
            {selectedCrew && (
              <div style={{ flex: 1, padding: 32, background: 'rgba(14,15,20,0.95)', border: '1px solid rgba(188,168,142,0.2)' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#F0EBE0', margin: '0 0 8px' }}>{selectedCrew.full_name}</h3>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 3, color: '#BCA88E', margin: '0 0 24px' }}>
                  {selectedCrew.role?.toUpperCase()} · {selectedCrew.st_id ? (selectedCrew.st_id.startsWith('SUPR-') ? selectedCrew.st_id : 'SUPR-' + selectedCrew.st_id) : 'NO-ID'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                  <div>
                    <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>EMAIL</p>
                    <p style={{ fontSize: 13, color: '#F0EBE0', margin: 0 }}>{selectedCrew.email || 'Not Provided'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>PHONE</p>
                    <p style={{ fontSize: 13, color: '#F0EBE0', margin: 0 }}>{selectedCrew.phone || 'Not Provided'}</p>
                  </div>
                </div>

                <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, letterSpacing: 4, color: '#BCA88E', borderBottom: '1px solid rgba(188,168,142,0.2)', paddingBottom: 8, marginBottom: 16 }}>SUBMISSION HISTORY</h4>
                {selectedCrew.submissions?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedCrew.submissions.map((sub: any) => (
                      <div key={sub.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(188,168,142,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 10, color: '#F0EBE0', fontWeight: 'bold' }}>{sub.type?.toUpperCase()}</span>
                          <span style={{ fontSize: 9, color: '#BCA88E', border: '1px solid #BCA88E', padding: '2px 6px' }}>{sub.status?.toUpperCase()}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#F0EBE0', opacity: 0.8, margin: '0 0 8px' }}>{sub.data?.title || sub.data?.platform || sub.data?.genre || 'Untitled'}</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {sub.data?.driveLink && <a href={sub.data.driveLink} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#c9a84c', textDecoration: 'underline' }}>Drive Link</a>}
                          {sub.data?.pdfLink && <a href={sub.data.pdfLink} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#c9a84c', textDecoration: 'underline' }}>PDF Link</a>}
                          {sub.data?.portfolioUrl && <a href={sub.data.portfolioUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#c9a84c', textDecoration: 'underline' }}>Portfolio Link</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: '#F0EBE0', opacity: 0.4 }}>No submissions found for this user.</p>
                )}
                
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button onClick={() => {
                     setSection('TEMPLATES');
                     setTemplateVars({ ...templateVars, writer_name: selectedCrew.full_name });
                  }} style={{ flex: 1, background: 'transparent', border: '1px solid #BCA88E', color: '#BCA88E', padding: '12px', fontSize: 10, letterSpacing: 2, cursor: 'pointer' }}>
                    SEND TEMPLATE
                  </button>
                  <button onClick={() => toggleVerification(selectedCrew.id, !!selectedCrew.st_verified)} 
                    style={{ flex: 1, background: selectedCrew.st_verified ? 'rgba(255,80,80,0.1)' : 'rgba(188,168,142,0.1)', border: `1px solid ${selectedCrew.st_verified ? '#ff5050' : '#BCA88E'}`, color: selectedCrew.st_verified ? '#ff5050' : '#BCA88E', padding: '12px', fontSize: 10, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    {selectedCrew.st_verified ? 'REVOKE VERIFICATION' : 'VERIFY CREW'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {section === 'TEMPLATES' && (
          <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Create Form */}
            <div style={{ padding: 32, border: '1px solid rgba(188,168,142,0.2)', background: 'rgba(188,168,142,0.03)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#BCA88E', margin: 0 }}>{editingTemplateId ? 'EDIT TEMPLATE' : 'NEW QUICK REPLY TEMPLATE'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <CinemaInput label="TEMPLATE LABEL" value={newTemplate.label} onChange={(v: string) => setNewTemplate({ ...newTemplate, label: v })} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>TYPE</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['REPLY', 'REJECTION', 'ACCEPTANCE', 'FEEDBACK'].map(t => (
                      <button key={t} onClick={() => setNewTemplate({ ...newTemplate, type: t })}
                        style={{
                          background: newTemplate.type === t ? '#BCA88E' : 'rgba(188,168,142,0.05)',
                          color: newTemplate.type === t ? '#0e0f13' : '#BCA88E',
                          border: '1px solid rgba(188,168,142,0.2)', padding: '6px 12px', fontSize: 8, letterSpacing: 2, cursor: 'pointer'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <CinemaInput label="SUBJECT" value={newTemplate.subject} onChange={(v: string) => setNewTemplate({ ...newTemplate, subject: v })} />
              <div>
                <CinemaTextarea label="BODY" rows={8} value={newTemplate.body} onChange={(v: string) => setNewTemplate({ ...newTemplate, body: v })} />
                <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.5, marginTop: 8 }}>Use {"{writer_name}, {script_title}, {reviewer_name}"} as placeholders</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={saveTemplate} style={{ flex: 1, background: '#BCA88E', color: '#0e0f13', border: 'none', padding: '12px', fontFamily: 'Inter, monospace', fontSize: 11, letterSpacing: 4, fontWeight: 700, cursor: 'pointer' }}>
                  {editingTemplateId ? 'UPDATE TEMPLATE' : 'SAVE TEMPLATE'}
                </button>
                {editingTemplateId && <button onClick={() => { setEditingTemplateId(null); setNewTemplate({ label: '', type: 'REPLY', subject: '', body: '' }); }} style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: '#ff5050', padding: '0 24px', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>}
              </div>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {dbTemplates.map(t => (
                <div key={t.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, color: '#F0EBE0', margin: 0 }}>{t.label}</h4>
                    <span style={{ fontSize: 8, background: 'rgba(188,168,142,0.1)', color: '#BCA88E', padding: '2px 6px', letterSpacing: 2 }}>{t.type}</span>
                  </div>
                  <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', margin: 0, opacity: 0.5 }}>SUB: {t.subject}</p>
                  <p style={{ fontSize: 12, color: '#F0EBE0', opacity: 0.7, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.body}</p>
                  
                  <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(188,168,142,0.05)' }}>
                    <button onClick={() => setUseTemplateModal(t)} style={{ flex: 1, background: 'none', border: '1px solid #BCA88E', color: '#BCA88E', fontSize: 9, padding: '8px', cursor: 'pointer' }}>USE</button>
                    <button onClick={() => { setEditingTemplateId(t.id); setNewTemplate(t); }} style={{ background: 'none', border: '1px solid rgba(188,168,142,0.2)', color: '#BCA88E', fontSize: 9, padding: '8px', cursor: 'pointer' }}>EDIT</button>
                    <button onClick={() => deleteTemplate(t.id)} style={{ color: '#ff5050', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {section === 'FILMS' && (
          <motion.div key="films" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Create/Edit Form */}
            <div style={{ padding: 32, border: '1px solid rgba(188,168,142,0.2)', background: 'rgba(188,168,142,0.03)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#BCA88E', margin: 0 }}>{editingFilm ? 'EDIT FILM' : 'ADD NEW FILM'}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <CinemaInput label="TITLE" value={newFilm.title} onChange={(v) => setNewFilm({ ...newFilm, title: v })} />
                <CinemaInput label="LOGLINE" value={newFilm.logline} onChange={(v) => setNewFilm({ ...newFilm, logline: v })} />
                <CinemaInput label="DIRECTOR" value={newFilm.director} onChange={(v) => setNewFilm({ ...newFilm, director: v })} />
                <CinemaInput label="PRODUCER" value={newFilm.producer} onChange={(v) => setNewFilm({ ...newFilm, producer: v })} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <CinemaInput label="RATING" value={newFilm.rating} onChange={(v) => setNewFilm({ ...newFilm, rating: v })} />
                <CinemaInput label="DURATION" value={newFilm.duration} onChange={(v) => setNewFilm({ ...newFilm, duration: v })} />
              </div>

              <CinemaTextarea label="SYNOPSIS" value={newFilm.synopsis} onChange={(v) => setNewFilm({ ...newFilm, synopsis: v })} rows={4} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>POSTER IMAGE (Horizontal .webp)</label>
                  <input type="file" accept="image/webp" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', marginTop: 8 }} />
                  {newFilm.poster_image && !posterFile && <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0 }}>Current: {newFilm.poster_image}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>REEL IMAGE (Vertical .webp)</label>
                  <input type="file" accept="image/webp" onChange={(e) => setReelFile(e.target.files?.[0] || null)} style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', marginTop: 8 }} />
                  {newFilm.reel_image && !reelFile && <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0 }}>Current: {newFilm.reel_image}</p>}
                </div>
                <CinemaInput label="VIDEO LINK (Trailer/Film URL)" value={newFilm.video_link} onChange={(v) => setNewFilm({ ...newFilm, video_link: v })} />
                <CinemaInput label="CAST MEMBERS" value={newFilm.cast_members} onChange={(v) => setNewFilm({ ...newFilm, cast_members: v })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>STILL IMAGE 1</label>
                  <input type="file" accept="image/*" onChange={(e) => setStill1File(e.target.files?.[0] || null)} style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', marginTop: 8 }} />
                  {newFilm.stills?.[0] && !still1File && <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0 }}>Current: {newFilm.stills[0]}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>STILL IMAGE 2</label>
                  <input type="file" accept="image/*" onChange={(e) => setStill2File(e.target.files?.[0] || null)} style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', marginTop: 8 }} />
                  {newFilm.stills?.[1] && !still2File && <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0 }}>Current: {newFilm.stills[1]}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>STILL IMAGE 3</label>
                  <input type="file" accept="image/*" onChange={(e) => setStill3File(e.target.files?.[0] || null)} style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', marginTop: 8 }} />
                  {newFilm.stills?.[2] && !still3File && <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0 }}>Current: {newFilm.stills[2]}</p>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                 <input type="checkbox" id="coming_soon" checked={newFilm.coming_soon} onChange={(e) => setNewFilm({ ...newFilm, coming_soon: e.target.checked })} style={{ accentColor: '#BCA88E' }} />
                 <label htmlFor="coming_soon" style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F0EBE0', cursor: 'pointer' }}>Mark as "Coming Soon"</label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button disabled={uploadingFilm} onClick={saveFilm} style={{ flex: 1, background: '#BCA88E', color: '#0e0f13', border: 'none', padding: '12px', fontFamily: 'Inter, monospace', fontSize: 11, letterSpacing: 4, fontWeight: 700, cursor: uploadingFilm ? 'not-allowed' : 'pointer', opacity: uploadingFilm ? 0.7 : 1 }}>
                  {uploadingFilm ? 'UPLOADING...' : (editingFilm ? 'UPDATE FILM' : 'PUBLISH FILM')}
                </button>
                {editingFilm && <button onClick={() => { setEditingFilm(null); setPosterFile(null); setReelFile(null); setStill1File(null); setStill2File(null); setStill3File(null); setNewFilm({ title: '', logline: '', rating: 'UA', duration: '', director: '', producer: '', cast_members: '', synopsis: '', special_note: '', video_link: '', reel_image: '', poster_image: '', coming_soon: false, stills: [] }); }} style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: '#ff5050', padding: '0 24px', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>}
              </div>
            </div>

            {/* Films List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
              {films.map(f => (
                <div key={f.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#F0EBE0', margin: '0 0 4px' }}>{f.title}</h4>
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0, letterSpacing: 2 }}>{f.director?.toUpperCase()}</p>
                    </div>
                    {f.coming_soon && <span style={{ fontSize: 8, background: 'rgba(188,168,142,0.1)', color: '#BCA88E', padding: '2px 6px', letterSpacing: 2 }}>COMING SOON</span>}
                  </div>
                  
                  {(f.poster_image || f.reel_image) && (
                    <div style={{ height: 120, background: '#111', backgroundImage: `url(${f.poster_image || f.reel_image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.8 }} />
                  )}

                  <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(188,168,142,0.05)' }}>
                    <button onClick={() => { setEditingFilm(f); setNewFilm(f); window.scrollTo(0, 0); }} style={{ flex: 1, background: 'none', border: '1px solid rgba(188,168,142,0.2)', color: '#BCA88E', fontSize: 9, padding: '8px', cursor: 'pointer' }}>EDIT</button>
                    <button onClick={async () => {
                      if(confirm('Delete film?')) {
                        await supabase.from('films').delete().eq('id', f.id);
                        fetchData();
                      }
                    }} style={{ color: '#ff5050', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* USE TEMPLATE MODAL */}
      <AnimatePresence>
        {useTemplateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} style={{ width: '100%', maxWidth: 800, background: '#0a0a0a', border: '1px solid #BCA88E', padding: 40, position: 'relative' }}>
              <button onClick={() => setUseTemplateModal(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#BCA88E', fontSize: 20, cursor: 'pointer' }}>✕</button>
              
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#BCA88E', marginBottom: 32 }}>POPULATE TEMPLATE</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <CinemaInput label="WRITER NAME" value={templateVars.writer_name} onChange={(v: string) => setTemplateVars({ ...templateVars, writer_name: v })} />
                  <CinemaInput label="SCRIPT TITLE" value={templateVars.script_title} onChange={(v: string) => setTemplateVars({ ...templateVars, script_title: v })} />
                  <CinemaInput label="REVIEWER NAME" value={templateVars.reviewer_name} onChange={(v: string) => setTemplateVars({ ...templateVars, reviewer_name: v })} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 4, color: '#BCA88E' }}>LIVE PREVIEW</p>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(188,168,142,0.1)', padding: 20, flex: 1, fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
                    {useTemplateModal.body
                      .replace(/{writer_name}/g, templateVars.writer_name || '[WRITER NAME]')
                      .replace(/{script_title}/g, templateVars.script_title || '[SCRIPT TITLE]')
                      .replace(/{reviewer_name}/g, templateVars.reviewer_name || '[REVIEWER NAME]')}
                  </div>
                  <button 
                    onClick={() => {
                      const populated = useTemplateModal.body
                        .replace(/{writer_name}/g, templateVars.writer_name)
                        .replace(/{script_title}/g, templateVars.script_title)
                        .replace(/{reviewer_name}/g, templateVars.reviewer_name);
                      navigator.clipboard.writeText(populated);
                      alert("COPIED TO CLIPBOARD ✦");
                    }}
                    style={{ background: '#BCA88E', color: '#0e0f13', border: 'none', padding: '12px', fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 3, cursor: 'pointer' }}
                  >
                    COPY TO CLIPBOARD
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


