import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getUsableRoles } from '../lib/profile';
import { fetchMemberDirectoryByIds } from '../lib/directory';

export type CallSheetRole =
  | 'writer'
  | 'technician'
  | 'producer'
  | 'presenter'
  | 'marketing'
  | 'amplifier'
  | 'admin';

export interface CallSheetTile {
  id: string;
  label: string;
  count: number;
}

export interface CallSheetRow {
  id: string;
  title: string;
  meta: string;
}

export interface CallSheetUnit {
  role: CallSheetRole;
  label: string;
  kicker: string;
  empty: string;
  tiles: CallSheetTile[];
  rows: CallSheetRow[];
}

const ROLE_ORDER: CallSheetRole[] = [
  'writer',
  'technician',
  'producer',
  'presenter',
  'marketing',
  'amplifier',
  'admin',
];

export const CALL_SHEET_ROLE_LABELS: Record<CallSheetRole, string> = {
  writer: 'Writer',
  technician: 'Technician',
  producer: 'Producer',
  presenter: 'Presenter',
  marketing: 'Marketing',
  amplifier: 'Member',
  admin: 'Administrator',
};

const WRITER_STAGE_LABEL: Record<string, string> = {
  draft: 'DRAFT',
  inbox: 'INBOX',
  submitted: 'INBOX',
  under_review: 'IN REVIEW',
  shortlisted: 'SHORTLISTED',
  accepted: 'ACCEPTED',
  rejected: 'REJECTED',
  archived: 'ARCHIVED',
};

const PRESENTER_STATUS_LABEL: Record<string, string> = {
  submitted: 'IN REVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  archived: 'ARCHIVED',
  screened: 'SCREENED',
};

function scriptStage(script: { status?: string | null; kanban_stage?: string | null }): string {
  if (script.status === 'draft') return 'draft';
  return script.kanban_stage || script.status || 'inbox';
}

function interestCount(brief: { brief_interests?: { count: number }[] | null }): number {
  return Number(brief.brief_interests?.[0]?.count ?? 0);
}

function unitMeta(role: CallSheetRole, extra: { empty: string }): Pick<CallSheetUnit, 'role' | 'label' | 'kicker' | 'empty'> {
  return {
    role,
    label: CALL_SHEET_ROLE_LABELS[role],
    kicker: `${CALL_SHEET_ROLE_LABELS[role].toUpperCase()} UNIT`,
    empty: extra.empty,
  };
}

function nameOf(map: Map<string, { full_name: string | null }>, id: string): string {
  return map.get(id)?.full_name?.trim() || 'Member';
}

async function loadWriter(uid: string): Promise<CallSheetUnit> {
  const { data, error } = await supabase
    .from('scripts')
    .select('id, title, status, kanban_stage, updated_at, created_at')
    .eq('user_id', uid)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  const scripts = data || [];
  const counts = {
    draft: 0,
    inbox: 0,
    under_review: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0,
  };
  for (const script of scripts) {
    const stage = scriptStage(script);
    if (stage === 'draft') counts.draft += 1;
    else if (stage === 'inbox' || stage === 'submitted') counts.inbox += 1;
    else if (stage === 'under_review') counts.under_review += 1;
    else if (stage === 'shortlisted') counts.shortlisted += 1;
    else if (stage === 'accepted') counts.accepted += 1;
    else if (stage === 'rejected') counts.rejected += 1;
  }
  return {
    ...unitMeta('writer', { empty: 'No pages on the sheet yet.' }),
    tiles: [
      { id: 'draft', label: 'Drafts', count: counts.draft },
      { id: 'inbox', label: 'Submitted', count: counts.inbox },
      { id: 'review', label: 'In review', count: counts.under_review },
      { id: 'shortlist', label: 'Shortlisted', count: counts.shortlisted },
      { id: 'accepted', label: 'Accepted', count: counts.accepted },
      { id: 'rejected', label: 'Rejected', count: counts.rejected },
    ],
    rows: scripts.slice(0, 4).map((script) => {
      const stage = scriptStage(script);
      return {
        id: script.id,
        title: script.title || 'Untitled',
        meta: WRITER_STAGE_LABEL[stage] || stage.replace(/_/g, ' ').toUpperCase(),
      };
    }),
  };
}

async function loadProducer(uid: string): Promise<CallSheetUnit> {
  const [briefsRes, collabRes] = await Promise.all([
    supabase
      .from('film_briefs')
      .select('id, title, is_open, created_at, brief_interests(count)')
      .eq('producer_id', uid)
      .order('created_at', { ascending: false }),
    supabase
      .from('collab_requests')
      .select('id, status')
      .eq('receiver_id', uid),
  ]);
  if (briefsRes.error) throw briefsRes.error;
  if (collabRes.error) throw collabRes.error;
  const briefs = briefsRes.data || [];
  const collabs = collabRes.data || [];
  const open = briefs.filter((b) => b.is_open);
  const closed = briefs.length - open.length;
  const interest = briefs.reduce((sum, brief) => sum + interestCount(brief), 0);
  const pending = collabs.filter((c) => c.status === 'pending').length;
  const accepted = collabs.filter((c) => c.status === 'accepted').length;
  return {
    ...unitMeta('producer', { empty: 'No calls on the sheet yet.' }),
    tiles: [
      { id: 'open', label: 'Open calls', count: open.length },
      { id: 'closed', label: 'Closed', count: closed },
      { id: 'interest', label: 'Interest', count: interest },
      { id: 'pending', label: 'Pending crew', count: pending },
      { id: 'accepted', label: 'Accepted crew', count: accepted },
    ],
    rows: open.slice(0, 4).map((brief) => ({
      id: brief.id,
      title: brief.title || 'Untitled brief',
      meta: `${String(interestCount(brief)).padStart(2, '0')} INTEREST · OPEN`,
    })),
  };
}

async function loadTechnician(uid: string): Promise<CallSheetUnit> {
  const [receivedRes, sentRes, interestRes] = await Promise.all([
    supabase.from('collab_requests').select('id, sender_id, receiver_id, project_title, status, created_at').eq('receiver_id', uid).order('created_at', { ascending: false }),
    supabase.from('collab_requests').select('id, sender_id, receiver_id, project_title, status, created_at').eq('sender_id', uid).order('created_at', { ascending: false }),
    supabase.from('brief_interests').select('id').eq('user_id', uid),
  ]);
  if (receivedRes.error) throw receivedRes.error;
  if (sentRes.error) throw sentRes.error;
  const received = receivedRes.data || [];
  const sent = sentRes.data || [];
  const sentPending = sent.filter((r) => r.status === 'pending').length;
  const sentAccepted = sent.filter((r) => r.status === 'accepted').length;
  const receivedPending = received.filter((r) => r.status === 'pending');
  const acceptedReceived = received.filter((r) => r.status === 'accepted');
  const acceptedSent = sent.filter((r) => r.status === 'accepted');
  const connectionIds = new Set([
    ...acceptedReceived.map((r) => r.sender_id),
    ...acceptedSent.map((r) => r.receiver_id),
  ]);
  const profileMap = await fetchMemberDirectoryByIds([
    ...receivedPending.slice(0, 3).map((r) => r.sender_id),
    ...acceptedReceived.slice(0, 3).map((r) => r.sender_id),
    ...acceptedSent.slice(0, 3).map((r) => r.receiver_id),
  ]);
  const rows: CallSheetRow[] = [];
  for (const row of receivedPending.slice(0, 2)) {
    rows.push({
      id: row.id,
      title: row.project_title || 'Untitled collab',
      meta: `PENDING · ${nameOf(profileMap, row.sender_id)}`,
    });
  }
  for (const row of [...acceptedReceived, ...acceptedSent].slice(0, 4 - rows.length)) {
    const otherId = row.sender_id === uid ? row.receiver_id : row.sender_id;
    rows.push({
      id: row.id,
      title: row.project_title || 'Untitled collab',
      meta: `CONNECTED · ${nameOf(profileMap, otherId)}`,
    });
  }
  return {
    ...unitMeta('technician', { empty: 'No collabs on the sheet yet.' }),
    tiles: [
      { id: 'sent-pending', label: 'Sent pending', count: sentPending },
      { id: 'sent-accepted', label: 'Sent accepted', count: sentAccepted },
      { id: 'received', label: 'Received pending', count: receivedPending.length },
      { id: 'connections', label: 'Connections', count: connectionIds.size },
      { id: 'briefs', label: 'Brief interest', count: interestRes.error ? 0 : (interestRes.data || []).length },
    ],
    rows,
  };
}

async function loadPresenter(uid: string): Promise<CallSheetUnit> {
  const { data, error } = await supabase
    .from('presentations')
    .select('id, title, status, created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const submitted = rows.filter((r) => r.status === 'submitted' || r.status === 'pending').length;
  const approved = rows.filter((r) => r.status === 'approved').length;
  const rejected = rows.filter((r) => r.status === 'rejected').length;
  const screened = rows.filter((r) => r.status === 'screened').length;
  return {
    ...unitMeta('presenter', { empty: 'No screenings sent yet.' }),
    tiles: [
      { id: 'sent', label: 'Sent', count: rows.length },
      { id: 'review', label: 'In review', count: submitted },
      { id: 'accepted', label: 'Accepted', count: approved },
      { id: 'passed', label: 'Passed', count: rejected },
      { id: 'screened', label: 'Screened', count: screened },
    ],
    rows: rows.slice(0, 4).map((row) => ({
      id: row.id,
      title: row.title || 'Untitled screening',
      meta: PRESENTER_STATUS_LABEL[row.status] || String(row.status || 'SUBMITTED').toUpperCase(),
    })),
  };
}

async function loadAmplifier(uid: string, streak: number): Promise<CallSheetUnit> {
  const { data, error } = await supabase
    .from('shoutout_wall')
    .select('id, message, likes, created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const shoutouts = data || [];
  const likes = shoutouts.reduce((sum, row) => sum + Number(row.likes || 0), 0);
  return {
    ...unitMeta('amplifier', { empty: 'The first wave has not logged yet.' }),
    tiles: [
      { id: 'streak', label: 'Share streak', count: streak },
      { id: 'shoutouts', label: 'Shoutouts', count: shoutouts.length },
      { id: 'likes', label: 'Likes', count: likes },
    ],
    rows: shoutouts.slice(0, 4).map((row) => ({
      id: row.id,
      title: (row.message || 'Shoutout').trim().slice(0, 72) || 'Shoutout',
      meta: `${String(Number(row.likes || 0)).padStart(2, '0')} LIKES`,
    })),
  };
}

async function loadMarketing(uid: string): Promise<CallSheetUnit> {
  const [assignRes, ideaRes] = await Promise.all([
    supabase.from('campaign_assignments').select('campaign_id, posts_count').eq('user_id', uid),
    supabase
      .from('submissions')
      .select('id, data, created_at, status')
      .eq('user_id', uid)
      .eq('type', 'marketing_idea')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);
  if (assignRes.error) throw assignRes.error;
  if (ideaRes.error) throw ideaRes.error;
  const assigns = assignRes.data || [];
  const ideas = ideaRes.data || [];
  const posts = assigns.reduce((sum, row) => sum + Number(row.posts_count || 0), 0);
  return {
    ...unitMeta('marketing', { empty: 'No campaigns joined yet.' }),
    tiles: [
      { id: 'campaigns', label: 'Campaigns', count: assigns.length },
      { id: 'posts', label: 'Posts logged', count: posts },
      { id: 'ideas', label: 'Ideas', count: ideas.length },
    ],
    rows: ideas.slice(0, 4).map((row) => {
      const data = (row.data || {}) as { text?: string };
      return {
        id: row.id,
        title: (data.text || 'Campaign idea').trim().slice(0, 72) || 'Campaign idea',
        meta: String(row.status || 'submitted').replace(/_/g, ' ').toUpperCase(),
      };
    }),
  };
}

async function loadAdmin(): Promise<CallSheetUnit> {
  const [scriptsRes, presentationsRes, collabsRes, roomsRes] = await Promise.all([
    supabase
      .from('scripts')
      .select('id, title, kanban_stage, status, updated_at')
      .or('kanban_stage.eq.inbox,kanban_stage.eq.under_review')
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase.from('presentations').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('collab_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('project_rooms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);
  if (scriptsRes.error) throw scriptsRes.error;
  const scripts = scriptsRes.data || [];
  const inbox = scripts.filter((s) => (s.kanban_stage || 'inbox') === 'inbox').length;
  const review = scripts.filter((s) => s.kanban_stage === 'under_review').length;
  return {
    ...unitMeta('admin', { empty: 'Nothing needs your eyes.' }),
    tiles: [
      { id: 'inbox', label: 'Script inbox', count: inbox },
      { id: 'review', label: 'In review', count: review },
      { id: 'screenings', label: 'Screenings', count: presentationsRes.count || 0 },
      { id: 'collabs', label: 'Pending collabs', count: collabsRes.count || 0 },
      { id: 'rooms', label: 'Active rooms', count: roomsRes.count || 0 },
    ],
    rows: scripts.slice(0, 4).map((script) => ({
      id: script.id,
      title: script.title || 'Untitled',
      meta: (script.kanban_stage || 'inbox').replace(/_/g, ' ').toUpperCase(),
    })),
  };
}

export function useCallSheet() {
  const { user, profile, isAdmin } = useAuth();
  const [units, setUnits] = useState<CallSheetUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchIdRef = useRef(0);

  const roles = useMemo(() => {
    const held = getUsableRoles(profile).filter((role): role is CallSheetRole =>
      ROLE_ORDER.includes(role as CallSheetRole),
    );
    if (isAdmin && !held.includes('admin')) held.push('admin');
    return ROLE_ORDER.filter((role) => held.includes(role));
  }, [profile, isAdmin]);

  const fetchSheet = useCallback(async () => {
    if (!user) {
      setUnits([]);
      setError('');
      return;
    }
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const loaders: Promise<CallSheetUnit>[] = roles.map((role) => {
        if (role === 'writer') return loadWriter(user.id);
        if (role === 'producer') return loadProducer(user.id);
        if (role === 'technician') return loadTechnician(user.id);
        if (role === 'presenter') return loadPresenter(user.id);
        if (role === 'amplifier') return loadAmplifier(user.id, profile?.share_streak || 0);
        if (role === 'marketing') return loadMarketing(user.id);
        return loadAdmin();
      });
      const settled = await Promise.allSettled(loaders);
      if (fetchId !== fetchIdRef.current) return;
      const next: CallSheetUnit[] = [];
      const failures: string[] = [];
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') next.push(result.value);
        else {
          const role = roles[index];
          console.warn(`[useCallSheet] ${role} failed:`, result.reason);
          failures.push(CALL_SHEET_ROLE_LABELS[role]);
        }
      });
      setUnits(next);
      setError(failures.length ? `Could not pull ${failures.join(', ')}.` : '');
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      setUnits([]);
      setError(err instanceof Error ? err.message : 'Could not pull the sheet');
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [user?.id, roles, profile?.share_streak]);

  useEffect(() => {
    void fetchSheet();
  }, [fetchSheet]);

  return { roles, units, loading, error, fetchSheet };
}
