import {useState,useEffect,useMemo,lazy,Suspense,ComponentType} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {useAuth} from '../context/AuthContext';
import {useNavigate,useLocation} from 'react-router-dom';
import Nav from '../components/Nav';
import ErrorBoundary from '../components/ErrorBoundary';

const WriterDashboard =lazy(()=>import('./dashboards/WriterDashboard'));
const TechnicianDashboard =lazy(()=>import('./dashboards/TechnicianDashboard'));
const ProducerDashboard =lazy(()=>import('./dashboards/ProducerDashboard'));
const PresenterDashboard =lazy(()=>import('./dashboards/PresenterDashboard'));
const MarketingDashboard =lazy(()=>import('./dashboards/MarketingDashboard'));
const AmplifierDashboard =lazy(()=>import('./dashboards/AmplifierDashboard'));
const AdminDashboard =lazy(()=>import('./dashboards/AdminDashboard'));

const ROLE_LABELS:Record<string,string>={
  writer:'WRITER',
  technician:'TECHNICIAN',
  producer:'PRODUCER',
  presenter:'PRESENTER',
  marketing:'MARKETING',
  amplifier:'MEMBER',
  admin:'ADMINISTRATOR',
};

const ROLE_SUBTITLES:Record<string,string>={
  writer:'Stories that demand to be told.',
  technician:'The craft behind every frame.',
  producer:'Back the story.Build the vision.',
  presenter:'Your vision.Our screen.Their memory.',
  marketing:'Amplify the signal.Move the crowd.',
  amplifier:'The first wave.Every time.',
  admin:'The whole picture.',
};

const DASHBOARD_COMPONENTS:Record<string,ComponentType<any>>={
  writer:WriterDashboard,
  technician:TechnicianDashboard,
  producer:ProducerDashboard,
  presenter:PresenterDashboard,
  marketing:MarketingDashboard,
  amplifier:AmplifierDashboard,
  admin:AdminDashboard,
};

function RoleNotConfigured({role}:{role:string}){
  return (
    <div style={{padding:'60px 40px',border:'1px solid rgba(188,168,142,0.1)',background:'rgba(10,10,10,0.4)',textAlign:'center'}}>
      <h3 style={{fontFamily:'Playfair Display,serif',fontSize:24,color:'#BCA88E',marginBottom:12}}>ROLE NOT CONFIGURED</h3>
      <p style={{fontFamily:'Montserrat,sans-serif',fontSize:11,color:'#F0EBE0',opacity:0.5,letterSpacing:3}}>
        CURRENTLY UNDER CONSTRUCTION FOR ROLE: {role.toUpperCase()}
      </p>
    </div>
  );
}

function DashboardErrorFallback(){
  return (
    <div style={{padding:'60px 40px',border:'1px solid rgba(255,77,77,0.2)',background:'rgba(10,10,10,0.4)',textAlign:'center'}}>
      <h3 style={{fontFamily:'Playfair Display,serif',fontSize:24,color:'#ff4d4d',marginBottom:12}}>DASHBOARD MALFUNCTION</h3>
      <p style={{fontFamily:'Montserrat,sans-serif',fontSize:11,color:'#F0EBE0',opacity:0.5,letterSpacing:3}}>
        WE ENCOUNTERED AN ERROR LOADING THIS PANEL
      </p>
    </div>
  );
}

export default function Dashboard(){
  const navigate =useNavigate();
  const location =useLocation();
  const {user,profile,loading,session,profileAttempted,displayName,isAdmin} =useAuth();

  const requestedRole =location.state?.activeRole as string |undefined;

  const roles =useMemo(()=>{
    if (isAdmin) return ['admin'];
    if (!profile) return [];
    const r:string[]=[];
    if (profile.roles &&Array.isArray(profile.roles)) r.push(...profile.roles);
    if (profile.role &&!r.includes(profile.role)) r.push(profile.role);
    return Array.from(new Set(r.map(role=>role.toLowerCase()))).filter(role=>role!=='admin');
  },[isAdmin,profile]);

  const initialRole =useMemo(()=>{
    if (requestedRole &&[...Object.keys(ROLE_LABELS),'admin'].includes(requestedRole)){
      if (roles.includes(requestedRole)||isAdmin) return requestedRole;
    }
    return roles[0];
  },[requestedRole,roles,isAdmin]);

  const [activeRole,setActiveRole]=useState(initialRole ||roles[0]||'writer');

  // Sync activeRole when initialRole or roles changes (e.g. after profile loads)
  useEffect(()=>{
    const target =initialRole ||roles[0];
    if (target){
      setActiveRole(prev=>prev!==target?target:prev);
    }
  },[initialRole,roles]);

  useEffect(()=>{
    if (requestedRole){
      const valid =[...Object.keys(ROLE_LABELS),'admin'];
      if (roles.includes(requestedRole)||valid.includes(requestedRole)){
        setActiveRole(prev=>prev!==requestedRole?requestedRole:prev);
      }
    }
  },[requestedRole,roles]);

  useEffect(()=>{
    if (loading) return;
    if (!session){
      navigate('/auth',{replace:true});
      return;
    }
    if (session &&profileAttempted &&!profile &&!isAdmin){
      navigate('/role-select',{replace:true});
    }
  },[loading,session,profile,profileAttempted,isAdmin,navigate]);

  useEffect(()=>{
    if (profileAttempted &&roles.length===0 &&!isAdmin){
      navigate('/role-select',{replace:true});
    }
  },[profileAttempted,roles,isAdmin,navigate]);

  if (!session ||!user) return null;

  if (!profileAttempted &&!isAdmin){
    return (
      <div style={{height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#0e0f13'}}>
        <motion.p animate={{opacity:[0.4,1,0.4]}} transition={{repeat:Infinity,duration:1.5}} style={{color:'#BCA88E',fontFamily:'Montserrat,sans-serif',letterSpacing:4}}>
          LOADING PROFILE...
        </motion.p>
        <button onClick={()=>{localStorage.clear();window.location.href='/auth';}} style={{marginTop:40,background:'none',border:'1px solid rgba(188,168,142,0.3)',color:'rgba(188,168,142,0.6)',padding:'10px 20px',fontSize:9,letterSpacing:3,cursor:'pointer'}}>
          STUCK? RE-AUTHENTICATE
        </button>
      </div>
    );
  }

  if (roles.length===0 &&!isAdmin) return null;

  const title =ROLE_LABELS[activeRole]??activeRole.toUpperCase();
  const subtitle =ROLE_SUBTITLES[activeRole]??'';

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.4}} style={{minHeight:'100vh',background:'#16181f',overflowX:'hidden'}}>
      <div aria-hidden="true" style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,backgroundImage:'repeating-linear-gradient(0deg,transparent 0px,transparent 60px,rgba(188,168,142,0.012)60px,rgba(188,168,142,0.012)61px),repeating-linear-gradient(90deg,transparent 0px,transparent 60px,rgba(188,168,142,0.008)60px,rgba(188,168,142,0.008)61px)'}}/>
      <div aria-hidden="true" style={{position:'fixed',right:0,top:0,bottom:0,width:32,background:'#171920',borderLeft:'1px solid rgba(255,255,255,0.04)',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',paddingTop:16,gap:12,overflow:'hidden'}}>
        {Array.from({length:60}).map((_,i)=><div key={i} style={{width:16,height:12,background:'#141414',border:'1px solid rgba(255,255,255,0.05)',borderRadius:2,flexShrink:0}}/>)}
      </div>
      <Nav scrolled={true}/>
      <div aria-hidden="true" style={{position:'fixed',top:0,left:'50%',transform:'translateX(-50%)',width:'30vw',height:'45vh',background:'radial-gradient(ellipse at top,rgba(188,168,142,0.04)0%,transparent 70%)',pointerEvents:'none',zIndex:1}}/>
      <div style={{paddingTop:96,paddingBottom:80,paddingLeft:'clamp(32px,6vw,100px)',paddingRight:'clamp(52px,7vw,120px)',position:'relative',zIndex:2}}>
        <div style={{marginBottom:52,position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:20,overflow:'hidden'}}>
            {Array.from({length:6}).map((_,i)=><div key={i} style={{width:14,height:10,background:'#0e0f13',border:'1px solid rgba(255,255,255,0.07)',borderRadius:2,flexShrink:0,marginRight:5}}/>)}
            <div style={{flex:1,height:1,background:'rgba(188,168,142,0.15)'}}/>
            <span style={{fontFamily:'Montserrat,sans-serif',fontSize:8,fontWeight:700,color:'#BCA88E',letterSpacing:5,opacity:0.8,margin:'0 14px',whiteSpace:'nowrap'}}>NOW SCREENING</span>
            <div style={{flex:1,height:1,background:'rgba(188,168,142,0.25)'}}/>
            {Array.from({length:6}).map((_,i)=><div key={i} style={{width:14,height:10,background:'#0e0f13',border:'1px solid rgba(255,255,255,0.1)',borderRadius:2,flexShrink:0,marginLeft:5}}/>)}
          </div>

          {roles.length > 1 && !isAdmin && (
            <div style={{ 
              display: 'inline-flex', 
              background: 'rgba(0, 0, 0, 0.4)', 
              border: '1px solid rgba(188, 168, 142, 0.15)', 
              padding: 4, 
              borderRadius: 0,
              gap: 4, 
              marginBottom: 32,
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
            }}>
              {roles.map(r => {
                const isActive = r === activeRole;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setActiveRole(r)}
                    style={{
                      position: 'relative',
                      border: 'none',
                      background: 'none',
                      padding: '10px 24px',
                      fontFamily: '"Montserrat", sans-serif',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 3,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      color: isActive ? '#0e0f13' : 'rgba(188, 168, 142, 0.6)',
                      transition: 'color 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      outline: 'none',
                      zIndex: 2,
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeRoleGlow"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: '#BCA88E',
                          zIndex: -1,
                          boxShadow: '0 0 12px rgba(188, 168, 142, 0.3)',
                        }}
                      />
                    )}
                    {ROLE_LABELS[r] ?? r}
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={activeRole} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}} transition={{duration:0.4,ease:'easeOut'}}>
              <h1 style={{fontFamily:'Playfair Display,sans-serif',fontSize:'clamp(36px,5vw,72px)',color:'#BCA88E',lineHeight:0.95,margin:'0 0 14px',letterSpacing:2,textTransform:'uppercase'}}>{title}</h1>
              <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap',marginBottom:24}}>
                <span style={{fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,color:'#F0EBE0',opacity:0.8,letterSpacing:4}}>{subtitle.toUpperCase()}</span>
                <span style={{fontFamily:'Montserrat,sans-serif',fontSize:9,color:'rgba(188,168,142,0.5)'}}>|</span>
                <span style={{fontFamily:'Montserrat,sans-serif',fontSize:9,fontWeight:700,color:'#BCA88E',opacity:0.7,letterSpacing:3}}>{displayName.toUpperCase()}</span>
                {profile?.st_id && (
                  <span style={{fontFamily:'Inter,monospace',fontSize:8,color:'#BCA88E',opacity:0.4,border:'1px solid rgba(188,168,142,0.15)',padding:'2px 8px',letterSpacing:2}}>
                    {profile.st_id.startsWith('SUPR-') ? profile.st_id : 'SUPR-' + profile.st_id}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{duration:1.2,ease:[0.25,0.1,0.25,1]}} style={{width:'100%',height:1,background:'linear-gradient(90deg,#BCA88E 0%,rgba(188,168,142,0.12)60%,transparent 100%)',transformOrigin:'left'}}/>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={activeRole} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.4}}>
            <ErrorBoundary fallback={<DashboardErrorFallback/>}>
              <Suspense fallback={
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:80,gap:16}}>
                  <motion.div animate={{opacity:[0.3,1,0.3]}} transition={{duration:2,repeat:Infinity}} style={{fontFamily:'Inter,monospace',fontSize:10,color:'#BCA88E',letterSpacing:8,textTransform:'uppercase'}}>Loading Set</motion.div>
                  <div style={{width:40,height:1,background:'rgba(188,168,142,0.2)'}}/>
                </div>
              }>
                {(()=>{
                  const Comp =DASHBOARD_COMPONENTS[activeRole];
                  return Comp?<Comp/>:<RoleNotConfigured role={activeRole}/>;
                })()}
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
        <div style={{marginTop:80,display:'flex',gap:24,alignItems:'center',flexWrap:'wrap',paddingTop:40,borderTop:'1px solid rgba(188,168,142,0.1)'}}>
          <button type="button" onClick={()=>navigate('/')}
            style={{background:'rgba(188,168,142,0.05)',border:'1px solid rgba(188,168,142,0.3)',padding:'12px 28px',fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:600,color:'#BCA88E',letterSpacing:4,cursor:'pointer',transition:'all 0.3s'}}
            onMouseEnter={(e)=>{(e.currentTarget as HTMLElement).style.background='#BCA88E';(e.currentTarget as HTMLElement).style.color='#0e0f13';}}
            onMouseLeave={(e)=>{(e.currentTarget as HTMLElement).style.background='rgba(188,168,142,0.05)';(e.currentTarget as HTMLElement).style.color='#BCA88E';}}>
            RETURN TO HOME
          </button>
          {!isAdmin &&(
            <button type="button" onClick={()=>navigate('/role-select')}
              style={{background:'transparent',border:'1px solid rgba(188,168,142,0.3)',padding:'12px 28px',fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:600,color:'#BCA88E',letterSpacing:4,cursor:'pointer',transition:'all 0.3s'}}
              onMouseEnter={(e)=>{(e.currentTarget as HTMLElement).style.background='rgba(188,168,142,0.1)';(e.currentTarget as HTMLElement).style.borderColor='#BCA88E';}}
              onMouseLeave={(e)=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.borderColor='rgba(188,168,142,0.3)';}}>
              ADD / SWITCH ROLE
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}