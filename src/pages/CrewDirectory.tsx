import {useState,useEffect,useMemo} from 'react';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../lib/supabase';
import Nav from '../components/Nav';

function CinemaInput({placeholder,value,onChange}:{placeholder:string;value:string;onChange:(v:string)=>void}){
  return (
    <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(188,168,142,0.1)',padding:'12px 16px',color:'#F0EBE0',fontFamily:'Inter,monospace',fontSize:13,outline:'none',width:'100%',maxWidth:300}}/>
  );
}

const ROLES=['ALL','WRITER','TECHNICIAN','PRODUCER','PRESENTER','MARKETING','MEMBER'];

export default function CrewDirectory(){
  const {user,loading:authLoading,isAdmin} =useAuth();
  const navigate =useNavigate();
  const [crew,setCrew]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [selectedCrew,setSelectedCrew]=useState<any>(null);

  useEffect(()=>{
    if (!authLoading){
      if (!user){navigate('/auth');return;}
      if (!isAdmin){navigate('/dashboard');return;}
    }
  },[authLoading,user,isAdmin,navigate]);

  const [search,setSearch]=useState('');
  const [roleFilter,setRoleFilter]=useState('ALL');
  const [availableOnly,setAvailableOnly]=useState(false);

  useEffect(()=>{
    async function fetchCrew(){
      try {
        setLoading(true);
        const [{ data: pData }, { data: subData }] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('submissions').select('*').order('created_at', { ascending: false }),
        ]);
        
        const profilesMap = (pData || []).map((p: any) => ({
          ...p,
          submissions: (subData || []).filter((s: any) => s.user_id === p.id)
        }));
        
        setCrew(profilesMap);
      } catch (err){
        console.error('Fetch crew error:',err);
      } finally {setLoading(false);}
    }
    fetchCrew();
  },[]);

  const filteredCrew =useMemo(()=>{
    return crew.filter(member=>{
      const s=search.toLowerCase();
      const matchesSearch=!s||member.full_name?.toLowerCase().includes(s)||member.st_id?.toLowerCase().includes(s);
      
      let matchesRole = roleFilter === 'ALL';
      if (!matchesRole && member.roles) {
        matchesRole = member.roles.some((r: string) => {
          const normR = r.toUpperCase();
          const normF = roleFilter.toUpperCase();
          if (normF === 'MEMBER' && normR === 'AMPLIFIER') return true;
          return normR === normF;
        });
      } else if (!matchesRole && member.role) {
        matchesRole = member.role.toUpperCase() === roleFilter.toUpperCase() || (roleFilter.toUpperCase() === 'MEMBER' && member.role.toUpperCase() === 'AMPLIFIER');
      }
      
      const matchesAvailability=!availableOnly||member.availability===true;
      return matchesSearch&&matchesRole&&matchesAvailability;
    });
  },[crew,search,roleFilter,availableOnly]);

  const banAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to ban and delete this account? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setCrew(prev => prev.filter(c => c.id !== id));
      if (selectedCrew?.id === id) setSelectedCrew(null);
      alert('Account deleted successfully.');
    } catch (err: any) {
      alert('Error deleting account: ' + err.message);
    }
  };

  return (
    <div style={{minHeight:'100vh',background:'#0a0b0e',color:'#F0EBE0', display: 'flex', flexDirection: 'column'}}>
      <div aria-hidden="true" style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,backgroundImage:'repeating-linear-gradient(0deg,transparent 0px,transparent 60px,rgba(188,168,142,0.012)60px,rgba(188,168,142,0.012)61px),repeating-linear-gradient(90deg,transparent 0px,transparent 60px,rgba(188,168,142,0.008)60px,rgba(188,168,142,0.008)61px)'}}/>
      <Nav scrolled={true}/>
      <main style={{position:'relative',zIndex:2,paddingTop:120, flex: 1, display: 'flex', flexDirection: 'column'}}>
        <div style={{padding:'0 clamp(32px,6vw,100px)'}}>
          <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(48px,6vw,84px)',color:'#BCA88E',margin:'0 0 8px',textTransform:'uppercase'}}>THE CREW DIRECTORY</h1>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:20}}>
            <p style={{fontFamily:'Inter,monospace',fontSize:10,letterSpacing:6,opacity:0.3,margin:0}}>EVERY CRAFT. ONE COMMUNITY.</p>
            <p style={{fontFamily:'Inter,monospace',fontSize:9,color:'#BCA88E',opacity:0.5,margin:0,letterSpacing:2}}>{filteredCrew.length} MEMBERS</p>
          </div>
        </div>

        <div style={{position:'sticky',top:90,background:'rgba(10,11,14,0.95)',backdropFilter:'blur(12px)',padding:'20px clamp(32px,6vw,100px)',borderBottom:'1px solid rgba(188,168,142,0.08)',zIndex:10,display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {ROLES.map(role=>(
              <button key={role} onClick={()=>setRoleFilter(role)}
                style={{background:roleFilter===role?'#BCA88E':'#0a0b0e',color:roleFilter===role?'#0a0b0e':'#BCA88E',border:'1px solid rgba(188,168,142,0.2)',padding:'6px 14px',fontFamily:'Montserrat,sans-serif',fontSize:8,fontWeight:700,letterSpacing:2,cursor:'pointer',transition:'all 0.2s'}}>
                {role}
              </button>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:24,flex:1,justifyContent:'flex-end',minWidth:300}}>
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',userSelect:'none'}}>
              <div style={{position:'relative',width:32,height:16,background:availableOnly?'#BCA88E':'rgba(255,255,255,0.1)',borderRadius:10,transition:'0.3s'}}>
                <div style={{position:'absolute',top:2,left:availableOnly?18:2,width:12,height:12,background:availableOnly?'#0a0b0e':'#BCA88E',borderRadius:'50%',transition:'0.3s'}}/>
              </div>
              <input type="checkbox" checked={availableOnly} onChange={e=>setAvailableOnly(e.target.checked)} style={{display:'none'}}/>
              <span style={{fontFamily:'Inter,monospace',fontSize:9,letterSpacing:2,color:'#BCA88E',opacity:availableOnly?1:0.5}}>AVAILABLE ONLY</span>
            </label>
            <CinemaInput placeholder="Search by name or SUPR-ID..." value={search} onChange={setSearch}/>
          </div>
        </div>

        <div style={{padding:'32px clamp(32px,6vw,100px)', flex: 1}}>
          {loading ? (
            <div style={{textAlign:'center',padding:100,color:'#BCA88E',fontFamily:'Montserrat,sans-serif',letterSpacing:4}}>
              <motion.p animate={{opacity:[0.4,1,0.4]}} transition={{repeat:Infinity,duration:1.5}}>SCANNING DIRECTORY...</motion.p>
            </div>
          ) : filteredCrew.length === 0 ? (
            <div style={{textAlign:'center',padding:'80px 40px',border:'1px solid rgba(188,168,142,0.1)',background:'rgba(10,11,14,0.4)'}}>
              <p style={{fontFamily:'Playfair Display,serif',fontSize:22,color:'#BCA88E',marginBottom:12,fontStyle:'italic'}}>No crew found</p>
              <p style={{fontFamily:'Inter,monospace',fontSize:11,color:'#F0EBE0',opacity:0.35,letterSpacing:3,margin:0}}>
                {search||roleFilter!=='ALL'||availableOnly
                  ?'TRY ADJUSTING YOUR FILTERS OR SEARCH TERMS'
                  :'NO MEMBERS IN THE DIRECTORY YET'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 24, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
              {/* Crew List */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 350px)', paddingRight: 16 }}>
                {filteredCrew.map(c => (
                  <div key={c.id} 
                    onClick={() => setSelectedCrew(c)}
                    style={{ 
                      padding: 20, border: '1px solid', borderColor: selectedCrew?.id === c.id ? '#BCA88E' : 'rgba(188,168,142,0.1)', 
                      background: selectedCrew?.id === c.id ? 'rgba(188,168,142,0.05)' : 'rgba(0,0,0,0.2)', 
                      display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s' 
                    }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: selectedCrew?.id === c.id ? 'rgba(188,168,142,0.2)' : 'rgba(188,168,142,0.08)', border: '1px solid rgba(188,168,142,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 16, fontFamily: 'Playfair Display, serif', color: '#BCA88E' }}>
                          {c.full_name?.substring(0,1).toUpperCase() || 'M'}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EBE0', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.full_name}</p>
                      <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: 0 }}>
                        {c.st_id ? (c.st_id.startsWith('SUPR-') ? c.st_id : 'SUPR-' + c.st_id) : 'NO-ID'} · {(c.roles?.join(', ') || c.role || 'MEMBER').toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Crew Details */}
              {selectedCrew && (
                <div style={{ flex: 1, padding: 32, background: 'rgba(14,15,20,0.95)', border: '1px solid rgba(188,168,142,0.2)', overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(188,168,142,0.1)', border: '1.5px solid rgba(188,168,142,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {selectedCrew.avatar_url ? (
                        <img src={selectedCrew.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: '#BCA88E' }}>
                          {selectedCrew.full_name?.substring(0,1).toUpperCase() || 'M'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#F0EBE0', margin: '0 0 4px' }}>{selectedCrew.full_name}</h3>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 3, color: '#BCA88E', margin: 0 }}>
                        {(selectedCrew.roles?.join(' / ') || selectedCrew.role || 'MEMBER').toUpperCase()} · {selectedCrew.st_id ? (selectedCrew.st_id.startsWith('SUPR-') ? selectedCrew.st_id : 'SUPR-' + selectedCrew.st_id) : 'NO-ID'}
                      </p>
                    </div>
                  </div>

                  {/* All Profile Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div>
                      <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>EMAIL</p>
                      <p style={{ fontSize: 13, color: '#F0EBE0', margin: 0, wordBreak: 'break-all' }}>{selectedCrew.email || 'Not Provided'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>PHONE / CONTACT</p>
                      <p style={{ fontSize: 13, color: '#F0EBE0', margin: 0 }}>{selectedCrew.contact || selectedCrew.phone || 'Not Provided'}</p>
                    </div>
                    {selectedCrew.niche && (
                      <div>
                        <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>NICHE / SPECIALISATION</p>
                        <p style={{ fontSize: 13, color: '#F0EBE0', margin: 0 }}>{selectedCrew.niche}</p>
                      </div>
                    )}
                    {selectedCrew.experience && (
                      <div>
                        <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>EXPERIENCE</p>
                        <p style={{ fontSize: 13, color: '#F0EBE0', margin: 0 }}>{selectedCrew.experience}</p>
                      </div>
                    )}
                    {selectedCrew.portfolio_url && (
                      <div>
                        <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>PORTFOLIO</p>
                        <a href={selectedCrew.portfolio_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#c9a84c', textDecoration: 'underline', wordBreak: 'break-all' }}>{selectedCrew.portfolio_url}</a>
                      </div>
                    )}
                    {selectedCrew.social_handle && (
                      <div>
                        <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>SOCIAL</p>
                        <p style={{ fontSize: 13, color: '#F0EBE0', margin: 0 }}>{selectedCrew.social_handle}</p>
                      </div>
                    )}
                    {selectedCrew.bio && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>BIO</p>
                        <p style={{ fontSize: 13, color: '#F0EBE0', margin: 0, lineHeight: 1.6, opacity: 0.8 }}>{selectedCrew.bio}</p>
                      </div>
                    )}
                    {selectedCrew.skills && selectedCrew.skills.length > 0 && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 8px' }}>SKILLS</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {selectedCrew.skills.map((sk: string) => (
                            <span key={sk} style={{ fontSize: 8, background: 'rgba(188,168,142,0.08)', border: '1px solid rgba(188,168,142,0.2)', padding: '2px 8px', color: '#BCA88E', letterSpacing: 1 }}>{sk.toUpperCase()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>AVAILABILITY</p>
                      <p style={{ fontSize: 13, margin: 0, color: selectedCrew.availability ? '#4ade80' : 'rgba(188,168,142,0.5)' }}>{selectedCrew.availability ? 'AVAILABLE' : 'NOT AVAILABLE'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 9, color: '#BCA88E', opacity: 0.6, letterSpacing: 2, margin: '0 0 4px' }}>JOINED</p>
                      <p style={{ fontSize: 13, color: '#F0EBE0', margin: 0 }}>{selectedCrew.created_at ? new Date(selectedCrew.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}</p>
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
                          <p style={{ fontSize: 13, color: '#F0EBE0', opacity: 0.8, margin: '0 0 8px' }}>{sub.data?.title || sub.data?.platform || sub.data?.genre || 'Untitled'}</p>
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', marginBottom: 8 }}>
                            {Object.entries(sub.data || {}).map(([key, val]: [string, any]) => val && (
                              <div key={key} style={{ display: 'flex', gap: 12, paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid rgba(188,168,142,0.04)' }}>
                                <span style={{ fontSize: 8, color: '#BCA88E', opacity: 0.5, letterSpacing: 2, textTransform: 'uppercase', minWidth: 100, flexShrink: 0 }}>{key.replace(/_/g,' ')}</span>
                                <span style={{ fontSize: 11, color: '#F0EBE0', opacity: 0.7, wordBreak: 'break-all' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                              </div>
                            ))}
                          </div>
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
                    <button onClick={() => banAccount(selectedCrew.id)} 
                      style={{ flex: 1, background: 'rgba(255,80,80,0.1)', border: '1px solid #ff5050', color: '#ff5050', padding: '12px', fontSize: 10, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.3s ease' }}>
                      BAN ACCOUNT (DELETE)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}