import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
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

export default function AdminDashboard() {
  const { user: adminUser, loading: authLoading, isAdmin } = useAuth();
  const [section, setSection] = useState<'FILMS' | 'WRITERS' | 'PROJECTS' | 'PROJECT ROOMS' | 'MARKETING' | 'CAMPAIGNS' | 'CREW' | 'SCREENINGS'>('FILMS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setDebugStep] = useState<string>('Init');
  
  // MARKETING state
  const [marketingTab, setMarketingTab] = useState<'marketing_idea' | 'collab'>('marketing_idea');
  const [submissions, setSubmissions] = useState<any[]>([]);

  // WRITERS / PIPELINE state
  const [scriptViewMode, setScriptViewMode] = useState<'list' | 'kanban'>('list');
  const [scripts, setScripts] = useState<any[]>([]);
  const [draggingScriptId, setDraggingScriptId] = useState<string | null>(null);
  const [expandedScriptId, setExpandedScriptId] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<any[]>([]);
  
  // WRITERS Challenges state
  const [newChallenge, setNewChallenge] = useState({ title: '' });
  const [submittingChallenge, setSubmittingChallenge] = useState(false);
  const [adminChallenges, setAdminChallenges] = useState<any[]>([]);

  // PROJECTS state
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({ 
    title: '', description: '', genre: [] as string[], budget_range: '', timeline: '', looking_for: [] as string[] 
  });
  const [submittingProject, setSubmittingProject] = useState(false);

  // PROJECT ROOMS state
  const [projectRooms, setProjectRooms] = useState<any[]>([]);
  const [newRoom, setNewRoom] = useState({ title: '', script_id: '', brief: '' });

  // CAMPAIGNS state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [newCampaign, setNewCampaign] = useState({ title: '', goal: '', deadline: '', status: 'active', kit_captions: '', kit_hashtags: '', kit_drive_link: '', group_sync_at: '' });

  // SCREENINGS state
  const [screenings, setScreenings] = useState<any[]>([]);
  const [screeningStatusFilter, setScreeningStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'IN REVIEW' | 'APPROVED' | 'SCREENED' | 'REJECTED'>('ALL');

  // FILMS state
  const [films, setFilms] = useState<any[]>([]);
  const [editingFilm, setEditingFilm] = useState<any>(null);
  const INITIAL_CREDITS = [
    { role: 'Direction', value: '' },
    { role: 'Writing', value: '' },
    { role: 'Producer', value: '' },
    { role: 'Editor', value: '' },
    { role: 'Cinematographer', value: '' },
    { role: 'Music', value: '' },
    { role: 'Cast', value: '' }
  ];
  const [newFilm, setNewFilm] = useState<any>({
    title: '', production_note: '', rating: 'UA', duration: '',
    synopsis: '', special_note: '',
    video_link: '', reel_image: '', coming_soon: false, stills: [],
    credits: INITIAL_CREDITS
  });
  const [reelFile, setReelFile] = useState<File | null>(null);
  const [still1File, setStill1File] = useState<File | null>(null);
  const [still2File, setStill2File] = useState<File | null>(null);
  const [still3File, setStill3File] = useState<File | null>(null);
  const [uploadingFilm, setUploadingFilm] = useState(false);



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

      if (section === 'MARKETING') {
        setDebugStep('Fetching MARKETING submissions...');
        const { data, error: err } = await supabase.from('submissions').select('*, profiles(full_name, avatar_symbol, st_id)').in('type', ['marketing_idea', 'collab']).order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        setDebugStep('MARKETING fetch complete');
        if (err) throw err;
        setSubmissions(data || []);
      } else if (section === 'WRITERS') {
        const { data: scriptsData, error: scriptsErr } = await supabase.from('scripts').select('*, user:profiles(full_name, avatar_symbol, st_id, role)').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (scriptsErr) throw scriptsErr;
        setScripts(scriptsData || []);
        
        const { data: chalData } = await supabase.from('writing_challenges').select('*').order('created_at', { ascending: false });
        if (fetchId === fetchIdRef.current) {
          setAdminChallenges(chalData || []);
        }
      } else if (section === 'PROJECTS') {
        const { data, error: err } = await supabase.from('film_briefs').select('*, producer:profiles(full_name, avatar_symbol), brief_interests(*, user:profiles(full_name, st_id, role, avatar_symbol))').order('created_at', { ascending: false });
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

      } else if (section === 'FILMS') {
        const { data, error: err } = await supabase.from('films').select('*').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) throw err;
        setFilms(data || []);
      } else if (section === 'SCREENINGS') {
        const { data, error: err } = await supabase.from('presentations').select('*, profiles(full_name, avatar_symbol, st_id)').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) throw err;
        setScreenings(data || []);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast(`Error moving script: ${error.message}`);
      setScripts(oldScripts);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel(`admin_live_updates_${section}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presentations' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // fetchData is stable within the section's scope; section is the key dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);




  const updateSubStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('submissions').update({ status }).eq('id', id);
    if (error) toast(`Error: ${error.message}`);
    fetchData();
  };

  const updateScreeningStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('presentations').update({ status }).eq('id', id);
    if (error) toast(`Error: ${error.message}`);
    else fetchData();
  };

  const deleteScreening = async (id: string) => {
    if (!window.confirm('Delete this screening submission permanently?')) return;
    try {
      const { error } = await supabase.from('presentations').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      toast(err.message);
    }
  };

  const toggleProjectStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('film_briefs').update({ is_open: !currentStatus }).eq('id', id);
    if (!error) fetchData();
  };

  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Delete this project permanently?')) return;
    try {
      const { error } = await supabase.from('film_briefs').delete().eq('id', projectId);
      if (error) throw error;
      fetchData();
    } catch (err: any) { toast(err.message); }
  };

  const submitProject = async () => {
    if (!adminUser || !newProject.title) return;
    setSubmittingProject(true);
    try {
      const { error } = await supabase.from('film_briefs').insert({ 
        producer_id: adminUser.id, 
        ...newProject,
        is_open: true
      });
      if (error) throw error;
      setNewProject({ title: '', description: '', genre: [], budget_range: '', timeline: '', looking_for: [] });
      setShowNewProjectForm(false);
      fetchData();
      toast('PROJECT PUBLISHED ✦');
    } catch (err: any) { toast(err.message); }
    finally { setSubmittingProject(false); }
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
    } catch (err: any) { toast(err.message); }
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
      toast("🎖 Completion badge awarded to all members");
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
    } catch (err: any) { toast(err.message); }
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
    if (error) toast(error.message);
    else { setNewCampaign({ title: '', goal: '', deadline: '', status: 'active', kit_captions: '', kit_hashtags: '', kit_drive_link: '', group_sync_at: '' }); fetchData(); }
  };

  const saveCampaignEdit = async () => {
    if (!editingCampaign) return;
    const { error } = await supabase.from('campaigns').update(editingCampaign).eq('id', editingCampaign.id);
    if (error) toast(error.message);
    else { setEditingCampaign(null); fetchData(); }
  };

  const createChallenge = async () => {
    if (!adminUser || !newChallenge.title) return;
    setSubmittingChallenge(true);
    try {
      const { error } = await supabase.from('writing_challenges').insert({ 
        title: newChallenge.title,
        is_active: true
      });
      if (error) throw error;
      setNewChallenge({ title: '' });
      toast('CHALLENGE POSTED ✦');
      fetchData(); // re-fetch challenges
    } catch (err: any) { toast(err.message); }
    finally { setSubmittingChallenge(false); }
  };

  const deleteChallenge = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) return;
    try {
      const { error } = await supabase.from('writing_challenges').delete().eq('id', id);
      if (error) throw error;
      toast('CHALLENGE DELETED ✕');
      fetchData();
    } catch (err: any) { toast(err.message); }
  };


  
  const saveFilm = async () => {
    try {
      setUploadingFilm(true);
      
      let finalReelUrl = newFilm.reel_image;
      const finalStills = newFilm.stills || [];

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

      if (reelFile) finalReelUrl = await uploadFile(reelFile, 'reels');
      
      const newStills = [...finalStills];
      if (still1File) newStills[0] = await uploadFile(still1File, 'stills');
      if (still2File) newStills[1] = await uploadFile(still2File, 'stills');
      if (still3File) newStills[2] = await uploadFile(still3File, 'stills');

      const directorCredit = newFilm.credits?.find((c: any) => c.role.toLowerCase() === 'direction' || c.role.toLowerCase() === 'director');
      const producerCredit = newFilm.credits?.find((c: any) => c.role.toLowerCase() === 'producer');

      const filmPayload = { 
        ...newFilm, 
        director: directorCredit?.value || '',
        producer: producerCredit?.value || '',
        reel_image: finalReelUrl, 
        stills: newStills.filter(Boolean) 
      };

      if (editingFilm) {
        const { error } = await supabase.from('films').update(filmPayload).eq('id', editingFilm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('films').insert([filmPayload]);
        if (error) throw error;
      }
      
      setEditingFilm(null);
      setReelFile(null);
      setStill1File(null);
      setStill2File(null);
      setStill3File(null);
      setNewFilm({ title: '', production_note: '', rating: 'UA', duration: '', synopsis: '', special_note: '', video_link: '', reel_image: '', coming_soon: false, stills: [], credits: INITIAL_CREDITS });
      fetchData();
    } catch (e: any) { 
      toast(e.message); 
    } finally {
      setUploadingFilm(false);
    }
  };


  if (!authLoading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Removed blocking loading screen to prevent hang.
  // The UI will now render even if fetchData is hanging, allowing the user to navigate tabs.

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* Top Section Tabs */}
      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid rgba(188,168,142,0.1)', paddingBottom: 0, overflowX: 'auto' }}>
        {['MARKETING', 'FILMS', 'WRITERS', 'PROJECTS', 'PROJECT ROOMS', 'CAMPAIGNS', 'SCREENINGS'].map(s => (
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
        {section === 'MARKETING' && (
          <motion.div key="marketing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', borderBottom: '1px solid rgba(188,168,142,0.1)', paddingBottom: 16 }}>
              {['marketing_idea', 'collab'].map(type => (
                <button key={type} onClick={() => setMarketingTab(type as any)}
                  style={{
                    background: marketingTab === type ? 'rgba(188,168,142,0.1)' : 'none',
                    border: '1px solid rgba(188,168,142,0.1)',
                    padding: '8px 16px', fontFamily: 'Inter, monospace', fontSize: 10, letterSpacing: 2,
                    color: marketingTab === type ? '#BCA88E' : 'rgba(188,168,142,0.5)', cursor: 'pointer'
                  }}
                >
                  {type === 'marketing_idea' ? 'MARKETING IDEAS' : 'MARKETERS (COLLAB)'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {submissions.filter(s => s.type === marketingTab).length === 0 && !loading && (
                <p style={{ textAlign: 'center', opacity: 0.3, fontSize: 11, padding: 40 }}>NO {marketingTab === 'marketing_idea' ? 'IDEAS' : 'MARKETERS'} FOUND</p>
              )}
              {submissions.filter(s => s.type === marketingTab).map(sub => (
                <div key={sub.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.6 }}>{sub.profiles?.full_name || 'Unknown'}</span>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EBE0', margin: 0 }}>
                          {sub.type === 'collab' ? sub.data?.platform : 'Marketing Idea'}
                        </p>
                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: 0 }}>
                          {sub.profiles?.st_id ? (sub.profiles.st_id.startsWith('SUPR-') ? `(${sub.profiles.st_id})` : `(SUPR-${sub.profiles.st_id})`) : ''} · {sub.status?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateSubStatus(sub.id, 'accepted')} style={{ background: 'none', border: '1px solid #BCA88E', color: '#BCA88E', fontSize: 9, padding: '4px 12px', cursor: 'pointer' }}>ACCEPT</button>
                      <button onClick={() => updateSubStatus(sub.id, 'archived')} style={{ background: 'none', border: '1px solid rgba(255,0,0,0.3)', color: 'rgba(255,0,0,0.5)', fontSize: 9, padding: '4px 12px', cursor: 'pointer' }}>ARCHIVE</button>
                    </div>
                  </div>
                  
                  {sub.type === 'marketing_idea' ? (
                    <div style={{ padding: 16, background: sub.data?.color || 'rgba(255,255,255,0.05)', color: '#1a1a1a', fontFamily: 'Inter, monospace', fontSize: 12, marginBottom: 20, borderRadius: 4 }}>
                      {sub.data?.text}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 16, border: '1px solid rgba(188,168,142,0.05)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', margin: '0 0 4px' }}>PLATFORM / HANDLE</p>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 13, color: '#F0EBE0', margin: 0 }}>{sub.data?.platform}</p>
                        </div>
                        <div>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', margin: '0 0 4px' }}>FOLLOWER COUNT</p>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 13, color: '#F0EBE0', margin: 0 }}>{sub.data?.follower_count}</p>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', margin: '0 0 4px' }}>COLLAB IDEA</p>
                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 13, color: '#F0EBE0', margin: 0, whiteSpace: 'pre-wrap' }}>{sub.data?.collab_idea}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {section === 'WRITERS' && (
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
                  <div key={s.id} style={{ border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: 24, display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(188,168,142,0.1)', border: '1px solid rgba(188,168,142,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, flexShrink: 0 }}>
                        {s.user?.full_name?.substring(0,1).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#F0EBE0', margin: '0 0 4px' }}>{s.title}</p>
                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: '0 0 12px' }}>
                          BY {s.user?.full_name} · V{s.version_number} · {s.kanban_stage?.toUpperCase() || 'INBOX'}
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {s.dna_mood?.map((m: string) => <span key={m} style={{ fontSize: 8, background: 'rgba(188,168,142,0.05)', border: '1px solid rgba(188,168,142,0.1)', padding: '2px 8px', color: '#BCA88E', letterSpacing: 1 }}>{m.toUpperCase()}</span>)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', minWidth: 200 }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <a href={s.pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#BCA88E', textDecoration: 'underline', letterSpacing: 2 }}>READ SCRIPT</a>
                        <button
                          onClick={() => setExpandedScriptId(expandedScriptId === s.id ? null : s.id)}
                          style={{ background: 'none', border: '1px solid rgba(188,168,142,0.3)', color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontSize: 9, padding: '4px 8px', cursor: 'pointer', letterSpacing: 1 }}
                        >
                          {expandedScriptId === s.id ? 'HIDE DETAILS' : 'VIEW DETAILS'}
                        </button>
                      </div>
                      
                      {/* Stage Toggle Buttons */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                        {KANBAN_STAGES.map(st => {
                          const isActive = (s.kanban_stage || 'inbox') === st.id;
                          return (
                            <button
                              key={st.id}
                              onClick={() => moveScriptStage(s.id, st.id)}
                              style={{
                                background: isActive ? st.color : 'transparent',
                                border: `1px solid ${isActive ? 'rgba(255,255,255,0.3)' : 'rgba(188,168,142,0.15)'}`,
                                color: isActive ? '#F0EBE0' : 'rgba(188,168,142,0.4)',
                                fontFamily: '"Montserrat", sans-serif',
                                fontSize: 7,
                                letterSpacing: 2,
                                padding: '4px 8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: isActive ? 700 : 400
                              }}
                            >
                              {st.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedScriptId === s.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '24px', border: '1px solid rgba(188,168,142,0.1)', borderTop: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.1)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 48 }}>
                            <div>
                              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 2, marginBottom: 8 }}>LOGLINE</p>
                              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.8, lineHeight: 1.6 }}>{s.logline || 'N/A'}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              <div>
                                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 2, marginBottom: 8 }}>SETTING</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {s.dna_setting?.map((m: string) => <span key={m} style={{ fontSize: 9, background: 'rgba(188,168,142,0.05)', border: '1px solid rgba(188,168,142,0.1)', padding: '2px 8px', color: '#BCA88E', letterSpacing: 1 }}>{m.toUpperCase()}</span>) || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 2, marginBottom: 8 }}>FORMAT</p>
                                <span style={{ fontSize: 9, background: 'rgba(188,168,142,0.05)', border: '1px solid rgba(188,168,142,0.1)', padding: '2px 8px', color: '#BCA88E', letterSpacing: 1 }}>{s.dna_format?.toUpperCase() || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                ))}
              </div>
            ) : (
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
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(188,168,142,0.1)', border: '1px solid rgba(188,168,142,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#BCA88E', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, flexShrink: 0 }}>
                                {script.user?.full_name?.substring(0,1).toUpperCase() || '?'}
                              </div>
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
                              {/* Stage Toggle Buttons in Kanban card */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {KANBAN_STAGES.map(st => {
                                  const isActive = (script.kanban_stage || 'inbox') === st.id;
                                  return (
                                    <button
                                      key={st.id}
                                      onClick={() => moveScriptStage(script.id, st.id)}
                                      style={{
                                        background: isActive ? st.color : 'transparent',
                                        border: `1px solid ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(188,168,142,0.1)'}`,
                                        color: isActive ? '#F0EBE0' : 'rgba(188,168,142,0.35)',
                                        fontFamily: '"Montserrat", sans-serif',
                                        fontSize: 7,
                                        letterSpacing: 1,
                                        padding: '3px 7px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: isActive ? 700 : 400
                                      }}
                                    >
                                      {st.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Writer Challenges Section */}
            <div style={{ marginTop: 40, borderTop: '1px solid rgba(188,168,142,0.1)', paddingTop: 40 }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#BCA88E', margin: '0 0 16px' }}>WRITER CHALLENGES</p>
              <p style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.5, marginBottom: 24 }}>
                Add a quick logline prompt. It will appear as a sticky note on the Writer Dashboard.
              </p>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', maxWidth: 800 }}>
                <div style={{ flex: 1 }}>
                  <CinemaInput 
                    label="CHALLENGE LOGLINE" 
                    placeholder="e.g. A detective discovers they are the prime suspect in their own case." 
                    value={newChallenge.title} 
                    onChange={v => setNewChallenge({ ...newChallenge, title: v })} 
                  />
                </div>
                <CinemaButton 
                  onClick={createChallenge} 
                  loading={submittingChallenge} 
                  disabled={!newChallenge.title}
                  style={{ marginTop: 18 }}
                >
                  POST CHALLENGE
                </CinemaButton>
              </div>

              {/* Existing Challenges List */}
              {adminChallenges.length > 0 && (
                <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 5, color: '#BCA88E', margin: 0 }}>ACTIVE CHALLENGES</p>
                  {adminChallenges.map(chal => (
                    <div key={chal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(188,168,142,0.1)', padding: '16px 24px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#F0EBE0', margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {chal.title}
                      </p>
                      <button onClick={() => deleteChallenge(chal.id)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 16, opacity: 0.7, marginLeft: 16, flexShrink: 0 }} title="Delete Challenge">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {section === 'PROJECTS' && (
          <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Create Form */}
            {!showNewProjectForm ? (
              <CinemaButton onClick={() => setShowNewProjectForm(true)}>+ NEW PROJECT</CinemaButton>
            ) : (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 32, border: '1px solid rgba(188,168,142,0.2)', background: 'rgba(188,168,142,0.03)', display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#BCA88E', margin: 0 }}>NEW PROJECT</p>
                  <button onClick={() => setShowNewProjectForm(false)} style={{ background: 'none', border: 'none', color: '#BCA88E', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>
                
                <CinemaInput label="PROJECT TITLE" value={newProject.title} onChange={v => setNewProject({...newProject, title: v})} />
                <CinemaTextarea label="DESCRIPTION & REQUIREMENTS" rows={4} value={newProject.description} onChange={v => setNewProject({...newProject, description: v})} />
                
                <TagPicker label="GENRE(S)" tags={GENRE_OPTIONS} selected={newProject.genre} onChange={v => setNewProject({...newProject, genre: v})} max={3} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <TagPicker label="BUDGET RANGE" tags={BUDGET_OPTIONS} selected={newProject.budget_range} onChange={v => setNewProject({...newProject, budget_range: v})} single />
                  <TagPicker label="TIMELINE" tags={TIMELINE_OPTIONS} selected={newProject.timeline} onChange={v => setNewProject({...newProject, timeline: v})} single />
                </div>
                
                <TagPicker label="LOOKING FOR" tags={LOOKING_FOR_OPTIONS} selected={newProject.looking_for} onChange={v => setNewProject({...newProject, looking_for: v})} />

                <CinemaButton onClick={submitProject} loading={submittingProject} disabled={!newProject.title}>PUBLISH PROJECT</CinemaButton>
              </motion.div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {briefs.map(b => (
                <div key={b.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#F0EBE0', margin: '0 0 6px' }}>{b.title}</p>
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: '0 0 12px' }}>
                        BY {b.producer?.full_name} · BUDGET: {b.budget_range}
                      </p>
                      <p style={{ fontSize: 11, color: '#F0EBE0', opacity: 0.7, maxWidth: 500, lineHeight: 1.5 }}>{b.description}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      <button onClick={() => toggleProjectStatus(b.id, b.is_open)} style={{ background: 'none', border: `1px solid ${b.is_open ? '#4ade80' : '#BCA88E'}`, color: b.is_open ? '#4ade80' : '#BCA88E', fontSize: 9, padding: '4px 12px', letterSpacing: 2, cursor: 'pointer', width: 100 }}>
                        {b.is_open ? 'OPEN' : 'CLOSED'}
                      </button>
                      <button onClick={() => deleteProject(b.id)} style={{ background: 'none', border: '1px solid rgba(255,0,0,0.3)', color: 'rgba(255,0,0,0.5)', fontSize: 9, padding: '4px 12px', letterSpacing: 2, cursor: 'pointer', width: 100 }}>
                        DELETE
                      </button>
                    </div>
                  </div>
                  
                  {b.brief_interests && b.brief_interests.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: '1px solid rgba(188,168,142,0.1)', paddingTop: 16 }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 3, color: '#BCA88E', margin: '0 0 12px' }}>INTERESTED USERS ({b.brief_interests.length})</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {b.brief_interests.map((interest: any) => (
                          <div key={interest.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(188,168,142,0.05)', padding: '8px 16px' }}>
                            <span style={{ fontSize: 16 }}>{interest.user?.avatar_symbol || '👤'}</span>
                            <div>
                              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', margin: 0 }}>{interest.user?.full_name}</p>
                              <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0 }}>
                                {interest.user?.st_id ? (interest.user.st_id.startsWith('SUPR-') ? interest.user.st_id : `SUPR-${interest.user.st_id}`) : 'NO-ID'} {interest.user?.role ? `• ${interest.user.role.toUpperCase()}` : ''}
                              </p>
                            </div>
                            {interest.note && (
                              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#F0EBE0', opacity: 0.5, fontStyle: 'italic', margin: '0 0 0 16px' }}>"{interest.note}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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



        {section === 'FILMS' && (
          <motion.div key="films" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Create/Edit Form */}
            <div style={{ padding: 32, border: '1px solid rgba(188,168,142,0.2)', background: 'rgba(188,168,142,0.03)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#BCA88E', margin: 0 }}>{editingFilm ? 'EDIT FILM' : 'ADD NEW FILM'}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <CinemaInput label="TITLE" value={newFilm.title} onChange={(v) => setNewFilm({ ...newFilm, title: v })} />
                <CinemaInput label="PRODUCTION NOTE" value={newFilm.production_note} onChange={(v) => setNewFilm({ ...newFilm, production_note: v })} />
                <CinemaInput label="RATING" value={newFilm.rating} onChange={(v) => setNewFilm({ ...newFilm, rating: v })} />
                <CinemaInput label="DURATION" value={newFilm.duration} onChange={(v) => setNewFilm({ ...newFilm, duration: v })} />
              </div>

              <div style={{ marginTop: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, color: '#BCA88E', margin: 0 }}>CREDITS</p>
                  <button type="button" onClick={() => setNewFilm({...newFilm, credits: [...(newFilm.credits || []), { role: '', value: '' }]})} style={{ background: 'none', border: '1px solid rgba(188,168,142,0.3)', color: '#BCA88E', fontSize: 10, padding: '4px 12px', cursor: 'pointer' }}>+ ADD CREDIT</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(newFilm.credits || []).map((credit: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <CinemaInput label="ROLE" value={credit.role} onChange={v => { const newC = [...newFilm.credits]; newC[idx].role = v; setNewFilm({...newFilm, credits: newC}) }} />
                      </div>
                      <div style={{ flex: 2 }}>
                        <CinemaInput label="NAMES" value={credit.value} onChange={v => { const newC = [...newFilm.credits]; newC[idx].value = v; setNewFilm({...newFilm, credits: newC}) }} />
                      </div>
                      <button type="button" onClick={() => { const newC = newFilm.credits.filter((_:any, i:number) => i !== idx); setNewFilm({...newFilm, credits: newC}) }} style={{ background: 'none', border: 'none', color: '#ff5050', fontSize: 16, cursor: 'pointer', padding: '0 8px', marginBottom: 12 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <CinemaTextarea label="SYNOPSIS" value={newFilm.synopsis} onChange={(v) => setNewFilm({ ...newFilm, synopsis: v })} rows={4} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4 }}>REEL IMAGE (Vertical .webp)</label>
                  <input type="file" accept="image/webp" onChange={(e) => setReelFile(e.target.files?.[0] || null)} style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', marginTop: 8 }} />
                  {newFilm.reel_image && !reelFile && <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, margin: 0 }}>Current: {newFilm.reel_image}</p>}
                </div>
                <CinemaInput label="VIDEO LINK (Trailer/Film URL)" value={newFilm.video_link} onChange={(v) => setNewFilm({ ...newFilm, video_link: v })} />
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
                {editingFilm && <button onClick={() => { setEditingFilm(null); setReelFile(null); setStill1File(null); setStill2File(null); setStill3File(null); setNewFilm({ title: '', production_note: '', rating: 'UA', duration: '', director: '', producer: '', synopsis: '', special_note: '', video_link: '', reel_image: '', coming_soon: false, stills: [], cinematography: '', editing: '', music: '', cast: '' }); }} style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: '#ff5050', padding: '0 24px', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>}
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
                  
                  {f.reel_image && (
                    <div style={{ height: 120, background: '#111', backgroundImage: `url(${f.reel_image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.8 }} />
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

        {section === 'SCREENINGS' && (
          <motion.div key="screenings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {['ALL', 'IN REVIEW', 'APPROVED', 'SCREENED', 'REJECTED'].map(s => (
                <button key={s} onClick={() => setScreeningStatusFilter(s as any)}
                  style={{
                    background: screeningStatusFilter === s ? 'rgba(188,168,142,0.1)' : 'none',
                    border: '1px solid rgba(188,168,142,0.15)', padding: '6px 14px',
                    color: screeningStatusFilter === s ? '#BCA88E' : 'rgba(188,168,142,0.4)',
                    fontFamily: 'Montserrat, sans-serif', fontSize: 8, letterSpacing: 3, cursor: 'pointer'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {screenings.length === 0 && !loading && (
                <p style={{ textAlign: 'center', opacity: 0.3, fontSize: 11, padding: 40 }}>NO SCREENINGS FOUND</p>
              )}
              {screenings.filter(sc => {
                const normalizedStatus = sc.status === 'submitted' ? 'IN REVIEW' : sc.status?.toUpperCase();
                return screeningStatusFilter === 'ALL' || normalizedStatus === screeningStatusFilter;
              }).map(screening => (
                <div key={screening.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#F0EBE0', margin: '0 0 4px' }}>{screening.film_title || screening.title}</h4>
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', opacity: 0.8, margin: 0 }}>
                        {screening.profiles?.full_name} {screening.profiles?.st_id ? (screening.profiles.st_id.startsWith('SUPR-') ? `(${screening.profiles.st_id})` : `(SUPR-${screening.profiles.st_id})`) : ''}
                      </p>
                      <p style={{ fontSize: 11, color: '#F0EBE0', opacity: 0.6, maxWidth: 800, marginTop: 12, lineHeight: 1.6 }}>{screening.synopsis}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 9, padding: '4px 10px', background: screening.status === 'submitted' ? 'rgba(188,168,142,0.15)' : screening.status === 'approved' ? 'rgba(74,222,128,0.1)' : screening.status === 'rejected' ? 'rgba(255,80,80,0.1)' : 'rgba(100,100,100,0.1)', color: screening.status === 'submitted' ? '#BCA88E' : screening.status === 'approved' ? '#4ade80' : screening.status === 'rejected' ? '#ff5050' : '#888', border: '1px solid currentColor', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 3 }}>
                        {screening.status === 'submitted' ? 'IN REVIEW' : screening.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(188,168,142,0.05)' }}>
                    {screening.link && (
                      <div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', opacity: 0.6, margin: '0 0 6px' }}>SCREENING LINK</p>
                        <a href={screening.link} target="_blank" rel="noopener noreferrer" style={{ color: '#F0EBE0', fontSize: 12, textDecoration: 'underline', wordBreak: 'break-all' }}>{screening.link}</a>
                      </div>
                    )}
                    {screening.contact && (
                      <div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', opacity: 0.6, margin: '0 0 6px' }}>CONTACT DETAILS</p>
                        <p style={{ color: '#F0EBE0', fontSize: 12, margin: 0, whiteSpace: 'pre-wrap' }}>{screening.contact}</p>
                      </div>
                    )}
                    {screening.screening_date && (
                      <div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', opacity: 0.6, margin: '0 0 6px' }}>DATE (IF ANY)</p>
                        <p style={{ color: '#F0EBE0', fontSize: 12, margin: 0 }}>{new Date(screening.screening_date).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  {screening.note && (
                    <div style={{ paddingLeft: 16, borderLeft: '2px solid #BCA88E', marginTop: 8 }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', margin: '0 0 6px' }}>PRESENTER NOTES</p>
                      <p style={{ color: '#F0EBE0', fontSize: 12, fontStyle: 'italic', margin: 0, opacity: 0.8, whiteSpace: 'pre-wrap' }}>"{screening.note}"</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12, borderTop: '1px solid rgba(188,168,142,0.1)', paddingTop: 16 }}>
                    <button onClick={() => updateScreeningStatus(screening.id, 'approved')} style={{ background: 'none', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontSize: 9, padding: '6px 16px', letterSpacing: 2, cursor: 'pointer' }}>APPROVE</button>
                    <button onClick={() => updateScreeningStatus(screening.id, 'rejected')} style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: '#ff5050', fontSize: 9, padding: '6px 16px', letterSpacing: 2, cursor: 'pointer' }}>REJECT</button>
                    <button onClick={() => updateScreeningStatus(screening.id, 'screened')} style={{ background: 'none', border: '1px solid rgba(188,168,142,0.3)', color: '#BCA88E', fontSize: 9, padding: '6px 16px', letterSpacing: 2, cursor: 'pointer' }}>MARK SCREENED</button>
                    <button onClick={() => deleteScreening(screening.id)} style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: '#ff5050', fontSize: 9, padding: '6px 16px', letterSpacing: 2, cursor: 'pointer', marginLeft: 'auto' }}>DELETE</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}


