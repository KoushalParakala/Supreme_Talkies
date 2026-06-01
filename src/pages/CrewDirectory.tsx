import {useState,useEffect,useMemo} from 'react';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../lib/supabase';
import type {PublicCrewProfile} from '../lib/directory';
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
  const [crew,setCrew]=useState<PublicCrewProfile[]>([]);
  const [loading,setLoading]=useState(true);

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
        // member_directory is the correct view name from our schema
        const {data,error}=await supabase
          .from('member_directory')
          .select('*')
          .not('roles','is',null)
          .order('created_at',{ascending:false});
        
        if (error) throw error;
        
        // Filter out empty roles array manually if needed, or rely on .not('roles','is',null)
        const validCrew = (data||[]).filter(m => m.roles && m.roles.length > 0);
        setCrew(validCrew);
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
      }
      
      const matchesAvailability=!availableOnly||member.availability===true;
      return matchesSearch&&matchesRole&&matchesAvailability;
    });
  },[crew,search,roleFilter,availableOnly]);

  return (
    <div style={{minHeight:'100vh',background:'#0a0b0e',color:'#F0EBE0'}}>
      <div aria-hidden="true" style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,backgroundImage:'repeating-linear-gradient(0deg,transparent 0px,transparent 60px,rgba(188,168,142,0.012)60px,rgba(188,168,142,0.012)61px),repeating-linear-gradient(90deg,transparent 0px,transparent 60px,rgba(188,168,142,0.008)60px,rgba(188,168,142,0.008)61px)'}}/>
      <Nav scrolled={true}/>
      <main style={{position:'relative',zIndex:2,paddingTop:120}}>
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
        <div style={{padding:'60px clamp(32px,6vw,100px)'}}>
          {loading?(
            <div style={{textAlign:'center',padding:100,color:'#BCA88E',fontFamily:'Montserrat,sans-serif',letterSpacing:4}}>
              <motion.p animate={{opacity:[0.4,1,0.4]}} transition={{repeat:Infinity,duration:1.5}}>SCANNING DIRECTORY...</motion.p>
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:1,background:'rgba(188,168,142,0.1)',border:'1px solid rgba(188,168,142,0.1)'}}>
              {filteredCrew.map((member,i)=>(
                <motion.div key={member.st_id||i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:(i%8)*0.05}}
                  style={{background:'#0a0b0e',padding:24,display:'flex',flexDirection:'column',gap:16,position:'relative',overflow:'hidden'}}
                  whileHover={{background:'rgba(188,168,142,0.04)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{width:48,height:48,border:'1px solid rgba(188,168,142,0.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontFamily:'Playfair Display,serif',color:'#BCA88E',background:'rgba(0,0,0,0.24)'}}>
                       {member.avatar_symbol||'M'}
                    </div>
                    {member.st_verified&&(
                      <div style={{fontFamily:'Montserrat,sans-serif',fontSize:7,fontWeight:700,color:'#BCA88E',letterSpacing:2,display:'flex',alignItems:'center',gap:4}}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#BCA88E"/></svg>
                        SUPREME VERIFIED
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 style={{fontFamily:'Playfair Display,serif',fontSize:16,color:'#F0EBE0',margin:'0 0 2px',fontWeight:700}}>{member.full_name||'Anonymous Member'}</h3>
                    <p style={{fontFamily:'Inter,monospace',fontSize:9,color:'#BCA88E',opacity:0.3,letterSpacing:3,margin:0}}>{member.st_id ? (member.st_id.startsWith('SUPR-') ? member.st_id : 'SUPR-' + member.st_id) : 'NO-ID'}</p>
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {member.roles?.map((role:string)=>(
                      <span key={role} style={{fontFamily:'Montserrat,sans-serif',fontSize:7,letterSpacing:2,border:'1px solid rgba(188,168,142,0.15)',padding:'2px 8px',color:'#BCA88E',textTransform:'uppercase'}}>
                        {role.toUpperCase() === 'AMPLIFIER' ? 'MEMBER' : role}
                      </span>
                    ))}
                  </div>
                  {member.niche&&(
                    <p style={{fontFamily:'Inter,monospace',fontSize:11,fontStyle:'italic',color:'#F0EBE0',opacity:0.4,margin:0}}>&quot;{member.niche}&quot;</p>
                  )}
                  <div style={{marginTop:'auto',paddingTop:16,borderTop:'1px solid rgba(188,168,142,0.05)',display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:member.availability?'rgba(100,200,120,0.8)':'rgba(240,235,224,0.15)',boxShadow:member.availability?'0 0 8px rgba(100,200,120,0.4)':'none'}}/>
                    <span style={{fontFamily:'Inter,monospace',fontSize:8,letterSpacing:2,color:member.availability?'rgba(100,200,120,0.8)':'rgba(188,168,142,0.4)'}}>{member.availability?'AVAILABLE':'BUSY'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}