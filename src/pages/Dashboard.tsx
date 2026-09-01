import {useState,useEffect,useMemo,lazy,Suspense,ComponentType} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {useAuth} from '../context/AuthContext';
import {useNavigate,useLocation} from 'react-router-dom';
import Nav from '../components/Nav';
import ErrorBoundary from '../components/ErrorBoundary';
import {getUsableRoles} from '../lib/profile';
import FirstActions from '../components/FirstActions';

const roleStorageKey=(userId:string)=>`st_active_role_${userId}`;

const WriterDashboard =lazy(()=>import('./dashboards/WriterDashboard'));
const TechnicianDashboard =lazy(()=>import('./dashboards/TechnicianDashboard'));
const ProducerDashboard =lazy(()=>import('./dashboards/ProducerDashboard'));
const PresenterDashboard =lazy(()=>import('./dashboards/PresenterDashboard'));
const MarketingDashboard =lazy(()=>import('./dashboards/MarketingDashboard'));
const AmplifierDashboard =lazy(()=>import('./dashboards/AmplifierDashboard'));
const AdminDashboard =lazy(()=>import('./dashboards/AdminDashboard'));

const ROLE_LABELS:Record<string,string>={
  writer:'Writer',
  technician:'Technician',
  producer:'Producer',
  presenter:'Presenter',
  marketing:'Marketing',
  amplifier:'Member',
  admin:'Administrator',
};

const ROLE_SUBTITLES:Record<string,string>={
  writer:'Stories that demand to be told.',
  technician:'The craft behind every frame.',
  producer:'Back the story. Build the vision.',
  presenter:'Your vision. Our screen. Their memory.',
  marketing:'Amplify the signal. Move the crowd.',
  amplifier:'The first wave. Every time.',
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
    <div className="dash-empty">
      <h3>Role not configured</h3>
      <p>Currently under construction for {role}.</p>
    </div>
  );
}

function DashboardErrorFallback(){
  return (
    <div className="dash-empty dash-empty-error">
      <h3>Dashboard malfunction</h3>
      <p>We encountered an error loading this panel.</p>
    </div>
  );
}

export default function Dashboard(){
  const navigate =useNavigate();
  const location =useLocation();
  const {user,profile,loading,session,profileAttempted,profileFetchFailed,displayName,isAdmin} =useAuth();

  const requestedRole =location.state?.activeRole as string |undefined;

  const roles =useMemo(()=>{
    if (isAdmin) return ['admin'];
    // Ignore placeholder `member` — that is onboarding only, not a dashboard role.
    return getUsableRoles(profile);
  },[isAdmin,profile]);

  const storedRole =useMemo(()=>{
    if (!user?.id || typeof window === 'undefined') return undefined;
    try {
      return localStorage.getItem(roleStorageKey(user.id)) || undefined;
    } catch {
      return undefined;
    }
  },[user?.id]);

  const initialRole =useMemo(()=>{
    if (requestedRole &&[...Object.keys(ROLE_LABELS),'admin'].includes(requestedRole)){
      if (roles.includes(requestedRole)||isAdmin) return requestedRole;
    }
    if (storedRole && (roles.includes(storedRole) || (isAdmin && storedRole === 'admin'))) {
      return storedRole;
    }
    return roles[0];
  },[requestedRole,roles,isAdmin,storedRole]);

  const [activeRole,setActiveRole]=useState<string | null>(initialRole ||roles[0]||null);

  useEffect(()=>{
    const valid =[...Object.keys(ROLE_LABELS),'admin'];
    let target: string | undefined;
    if (requestedRole &&(roles.includes(requestedRole)||isAdmin)&&valid.includes(requestedRole)){
      target =requestedRole;
    } else if (storedRole && (roles.includes(storedRole) || (isAdmin && storedRole === 'admin'))) {
      target = storedRole;
    } else {
      target =initialRole ||roles[0];
    }
    if (target){
      setActiveRole(prev=>prev!==target?target:prev);
    }
  },[requestedRole,initialRole,roles,storedRole,isAdmin]);

  useEffect(()=>{
    if (!user?.id || !activeRole) return;
    try {
      localStorage.setItem(roleStorageKey(user.id), activeRole);
    } catch {
      /* ignore quota / private mode */
    }
  },[user?.id, activeRole]);

  useEffect(()=>{
    if (loading) return;
    if (!session){
      navigate('/auth',{replace:true});
      return;
    }
    if (session &&profileAttempted &&!profile &&!isAdmin &&!profileFetchFailed){
      navigate('/role-select',{replace:true});
    }
  },[loading,session,profile,profileAttempted,profileFetchFailed,isAdmin,navigate]);

  useEffect(()=>{
    if (profileAttempted &&roles.length===0 &&!isAdmin &&!profileFetchFailed){
      navigate('/role-select',{replace:true});
    }
  },[profileAttempted,roles,isAdmin,profileFetchFailed,navigate]);

  if (!session ||!user) return null;

  if (!profileAttempted &&!isAdmin){
    return (
      <div className="dash-loading">
        <p>Loading profile…</p>
        <button type="button" className="dash-ghost-btn" onClick={()=>{localStorage.clear();window.location.href='/auth';}}>
          Stuck? Re-authenticate
        </button>
      </div>
    );
  }

  if (roles.length===0 &&!isAdmin) return null;

  if (!activeRole) return null;

  const title =ROLE_LABELS[activeRole]??activeRole;
  const subtitle =ROLE_SUBTITLES[activeRole]??'';

  return (
    <motion.div className="dash-shell site-page" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.4}}>
      <Nav scrolled={true}/>
      <div className={`dash-body${activeRole ? ` dash-role dash-role-${activeRole}` : ''}`}>
        <div className="dash-masthead">
          {roles.length > 1 && !isAdmin && (
            <div className="dash-role-switch">
              {roles.map(r => {
                const isActive = r === activeRole;
                return (
                  <button
                    key={r}
                    type="button"
                    className={isActive ? 'is-active' : ''}
                    onClick={() => setActiveRole(r)}
                  >
                    {isActive && (
                      <motion.div
                        className="dash-role-glow"
                        layoutId="activeRoleGlow"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {ROLE_LABELS[r] ?? r}
                  </button>
                );
              })}
            </div>
          )}

          <div className="section-line dash-section-line">
            <span>04 / THE {title.toUpperCase()} ROOM</span>
            <span>NO SMALL ROLES <i /></span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeRole} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.35,ease:'easeOut'}}>
              <h1>{title}</h1>
              <div className="dash-meta">
                <span>{subtitle}</span>
                <span className="dash-meta-sep">/</span>
                <span>{displayName || 'Member'}</span>
                {profile?.st_id && (
                  <span className="dash-id">
                    {profile.st_id.startsWith('SUPR-') ? profile.st_id : 'SUPR-' + profile.st_id}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {activeRole && <FirstActions role={activeRole}/>}
        <AnimatePresence mode="wait">
          <motion.div key={activeRole} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.35}}>
            <ErrorBoundary fallback={<DashboardErrorFallback/>}>
              <Suspense fallback={
                <div className="dash-loading dash-loading-inline">
                  <p>Loading {ROLE_LABELS[activeRole] || 'dashboard'}…</p>
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
        <div className="dash-footer-actions">
          <button type="button" className="primary-button" onClick={()=>navigate('/')}>
            Return to home
          </button>
          {!isAdmin &&(
            <button type="button" className="dash-ghost-btn" onClick={()=>navigate('/role-select')}>
              Add / switch role
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
