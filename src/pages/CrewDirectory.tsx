import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { deduplicateProfiles } from '../lib/profile';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const ROLES = ['ALL', 'WRITER', 'TECHNICIAN', 'PRODUCER', 'PRESENTER', 'MARKETING', 'MEMBER'];

function roleLabel(member: { roles?: string[]; role?: string }) {
  return (member.roles?.join(', ') || member.role || 'MEMBER').toUpperCase();
}

function suprId(raw?: string) {
  if (!raw) return 'NO-ID';
  return raw.startsWith('SUPR-') ? raw : `SUPR-${raw}`;
}

export default function CrewDirectory() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [crew, setCrew] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrew, setSelectedCrew] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/auth'); return; }
      if (!isAdmin) { navigate('/dashboard'); return; }
    }
  }, [authLoading, user, isAdmin, navigate]);

  useEffect(() => {
    async function fetchCrew() {
      try {
        setLoading(true);
        const [{ data: pData }, { data: subData }] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('submissions').select('*').order('created_at', { ascending: false }),
        ]);

        const deduplicatedP = deduplicateProfiles(pData || []);
        setCrew(deduplicatedP.map((p: any) => ({
          ...p,
          submissions: (subData || []).filter((s: any) => s.user_id === p.id),
        })));
      } catch (err) {
        console.error('Fetch crew error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCrew();
  }, []);

  const filteredCrew = useMemo(() => {
    return crew.filter((member) => {
      const s = search.toLowerCase();
      const matchesSearch = !s || member.full_name?.toLowerCase().includes(s) || member.st_id?.toLowerCase().includes(s);

      let matchesRole = roleFilter === 'ALL';
      if (!matchesRole && member.roles) {
        matchesRole = member.roles.some((r: string) => {
          const normR = r.toUpperCase();
          const normF = roleFilter.toUpperCase();
          if (normF === 'MEMBER' && normR === 'AMPLIFIER') return true;
          return normR === normF;
        });
      } else if (!matchesRole && member.role) {
        matchesRole = member.role.toUpperCase() === roleFilter.toUpperCase()
          || (roleFilter.toUpperCase() === 'MEMBER' && member.role.toUpperCase() === 'AMPLIFIER');
      }

      const matchesAvailability = !availableOnly || member.availability === true;
      return matchesSearch && matchesRole && matchesAvailability;
    });
  }, [crew, search, roleFilter, availableOnly]);

  const banAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to ban and delete this account? This cannot be undone.')) return;
    try {
      const { data, error } = await supabase.functions.invoke('ban-user', {
        body: { user_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCrew((prev) => prev.filter((c) => c.id !== id));
      if (selectedCrew?.id === id) setSelectedCrew(null);
      toast('Account banned and deleted.');
    } catch (err: unknown) {
      toast('Error banning account: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="dash-shell site-page sub-page">
      <Nav scrolled={true} />
      <div className="dash-body">
        <div className="dash-masthead">
          <div className="section-line dash-section-line">
            <span>06 / THE CREW DIRECTORY</span>
            <span>{String(filteredCrew.length).padStart(2, '0')} MEMBERS <i /></span>
          </div>
          <h1>The crew<br /><em>in the room.</em></h1>
          <p className="dash-meta">Every craft. One community.</p>
        </div>

        <div className="crew-toolbar">
          <div className="crew-filters">
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                className={roleFilter === role ? 'active' : ''}
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <label className={`crew-toggle ${availableOnly ? 'is-on' : ''}`}>
              <span className="crew-switch"><i /></span>
              <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
              Available only
            </label>
            <input
              className="crew-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SUPR-ID"
            />
          </div>
        </div>

        {loading ? (
          <div className="dash-loading dash-loading-inline">
            <p>Scanning directory…</p>
          </div>
        ) : filteredCrew.length === 0 ? (
          <div className="crew-empty">
            <h3>No crew found</h3>
            <p>{search || roleFilter !== 'ALL' || availableOnly ? 'Try adjusting filters or search' : 'No members in the directory yet'}</p>
          </div>
        ) : (
          <div className="crew-board">
            <div className="crew-list">
              {filteredCrew.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`crew-row ${selectedCrew?.id === c.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedCrew(c)}
                >
                  <div className="crew-avatar">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt="" />
                    ) : (
                      c.full_name?.substring(0, 1).toUpperCase() || 'M'
                    )}
                  </div>
                  <div>
                    <h2>{c.full_name}</h2>
                    <p>{suprId(c.st_id)} · {roleLabel(c)}</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedCrew && (
              <div className="crew-detail">
                <div className="crew-detail-head">
                  <div className="crew-avatar">
                    {selectedCrew.avatar_url ? (
                      <img src={selectedCrew.avatar_url} alt="" />
                    ) : (
                      selectedCrew.full_name?.substring(0, 1).toUpperCase() || 'M'
                    )}
                  </div>
                  <div>
                    <h3>{selectedCrew.full_name}</h3>
                    <p className="crew-meta">{roleLabel(selectedCrew)} · {suprId(selectedCrew.st_id)}</p>
                  </div>
                </div>

                <div className="crew-facts">
                  <div>
                    <span>Email</span>
                    <p>{selectedCrew.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <span>Phone / contact</span>
                    <p>{selectedCrew.contact || selectedCrew.phone || 'Not provided'}</p>
                  </div>
                  {selectedCrew.niche && (
                    <div>
                      <span>Niche</span>
                      <p>{selectedCrew.niche}</p>
                    </div>
                  )}
                  {selectedCrew.experience && (
                    <div>
                      <span>Experience</span>
                      <p>{selectedCrew.experience}</p>
                    </div>
                  )}
                  {selectedCrew.portfolio_url && (
                    <div>
                      <span>Portfolio</span>
                      <a href={selectedCrew.portfolio_url} target="_blank" rel="noreferrer">{selectedCrew.portfolio_url}</a>
                    </div>
                  )}
                  {selectedCrew.social_handle && (
                    <div>
                      <span>Social</span>
                      <p>{selectedCrew.social_handle}</p>
                    </div>
                  )}
                  {selectedCrew.bio && (
                    <div className="span-2">
                      <span>Bio</span>
                      <p>{selectedCrew.bio}</p>
                    </div>
                  )}
                  {selectedCrew.note_to_team && (
                    <div className="span-2">
                      <span>Note to Supreme team</span>
                      <p>{selectedCrew.note_to_team}</p>
                    </div>
                  )}
                  <div>
                    <span>Availability</span>
                    <p>{selectedCrew.availability ? 'Available' : 'Not available'}</p>
                  </div>
                  <div>
                    <span>Joined</span>
                    <p>{selectedCrew.created_at ? new Date(selectedCrew.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}</p>
                  </div>
                </div>

                <div className="crew-subs">
                  <h4>Submission history</h4>
                  {selectedCrew.submissions?.length > 0 ? (
                    selectedCrew.submissions.map((sub: any) => (
                      <div key={sub.id} className="crew-sub">
                        <div className="crew-sub-top">
                          <span>{sub.type}</span>
                          <span>{sub.status}</span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: 13 }}>{sub.data?.title || sub.data?.platform || sub.data?.genre || 'Untitled'}</p>
                        <div>
                          {Object.entries(sub.data || {}).map(([key, val]: [string, any]) => val && (
                            <div key={key} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                              <span style={{ minWidth: 90, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 8 }}>{key.replace(/_/g, ' ')}</span>
                              <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="profile-hint">No submissions found for this user.</p>
                  )}
                </div>

                <button type="button" className="primary-button danger-button" onClick={() => banAccount(selectedCrew.id)}>
                  Ban account (delete)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
