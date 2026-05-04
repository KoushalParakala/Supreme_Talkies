import {useState,useEffect} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {useNavigate,useLocation} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../lib/supabase';

interface NavProps {scrolled:boolean;}
interface NavItem {label:string;route?:string;action?:string;state?:Record<string,unknown>}

function NavLink({item,onClick,isMobileView=false}:{item:NavItem;onClick:()=>void;isMobileView?:boolean}){
  const [hov,setHov]=useState(false);
  const location =useLocation();
  const isActive =(item.route &&location.pathname===item.route)||(item.action==='join'&&location.pathname==='/join');
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        fontFamily:isMobileView?'"Playfair Display",serif':'"Montserrat",sans-serif',
        fontSize:isMobileView?28:13,
        fontWeight:isMobileView?700:500,
        color:isActive?'#F0EBE0':hov?'#F0EBE0':'#BCA88E',
        letterSpacing:4,
        background:'none',border:'none',
        padding:isMobileView?'12px 0':'4px 0',
        position:'relative',transition:'color 0.25s ease',
        cursor:'pointer',textTransform:'uppercase',
      }}>
      {item.label}
      {!isMobileView &&(
        <>
          <motion.span aria-hidden="true" style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:'#BCA88E',transformOrigin:'left center',display:'block'}}
            animate={{scaleX:hov||isActive?1:0,opacity:hov||isActive?1:0}} transition={{duration:0.25,ease:[0.25,0.1,0.25,1]}}/>
          <motion.span aria-hidden="true" style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4)40%,transparent 80%)',transformOrigin:'left center',display:'block'}}
            animate={{scaleX:hov||isActive?1:0,opacity:hov||isActive?1:0}} transition={{duration:0.25,ease:[0.25,0.1,0.25,1],delay:0.05}}/>
        </>
      )}
    </button>
  );
}

function UserIndicator({isMobileView=false}:{isMobileView?:boolean}){
  const {user,profile,signOut,loading,displayName,avatarInitials,isAdmin} =useAuth();
  const navigate =useNavigate();
  const [hov,setHov]=useState(false);
  const [isExiting,setIsExiting]=useState(false);

  if (loading) return <div style={{width:42,height:42}}/>;
  if (!user){
    return (
      <button onClick={()=>navigate('/auth')}
        style={{fontFamily:'"Montserrat",sans-serif',fontSize:isMobileView?11:13,fontWeight:600,color:'#BCA88E',letterSpacing:4,background:'none',border:'1px solid rgba(188,168,142,0.3)',padding:isMobileView?'12px 32px':'8px 24px',cursor:'pointer',transition:'all 0.3s ease'}}
        onMouseEnter={(e)=>{(e.currentTarget as HTMLElement).style.background='#BCA88E';(e.currentTarget as HTMLElement).style.color='#0e0f13';}}
        onMouseLeave={(e)=>{(e.currentTarget as HTMLElement).style.background='none';(e.currentTarget as HTMLElement).style.color='#BCA88E';}}>
        LOG IN
      </button>
    );
  }

  const handleLogout =async ()=>{
    setIsExiting(true);
    try {await signOut();} catch (err){console.error('Logout error:',err);}
    finally {navigate('/auth',{replace:true});}
  };

  const isVerified =profile?.st_verified===true;
  const AVATAR_SIZE =isMobileView?36:40;

  return (
    <div style={{position:'relative',zIndex:100}} onMouseEnter={()=>!isMobileView&&setHov(true)} onMouseLeave={()=>!isMobileView&&setHov(false)}>
      <div style={{display:'flex',alignItems:'center',gap:14,cursor:'pointer'}} onClick={()=>isMobileView?setHov(!hov):navigate('/profile')}>
        {!isMobileView &&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',pointerEvents:'none'}}>
            <span style={{fontFamily:'"Montserrat",sans-serif',fontSize:10,color:'#BCA88E',letterSpacing:3,fontWeight:600}}>{displayName}</span>
            {isAdmin &&<span style={{fontFamily:'Inter,monospace',fontSize:8,color:'#c9a84c',letterSpacing:2,opacity:0.7}}>ADMIN</span>}
          </div>
        )}
        <div style={{position:'relative'}}>
          <motion.div animate={{borderColor:hov?'rgba(188,168,142,0.7)':'rgba(188,168,142,0.3)',boxShadow:hov?'0 0 12px rgba(188,168,142,0.2)':'none'}}
            style={{width:AVATAR_SIZE,height:AVATAR_SIZE,borderRadius:'50%',border:'1px solid',background:'rgba(188,168,142,0.12)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',transition:'all 0.3s ease'}}>
            {profile?.avatar_url?(
              <img src={profile.avatar_url} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            ):profile?.avatar_symbol?(
              <span style={{fontFamily:'Playfair Display,serif',fontSize:16,color:'#BCA88E'}}>{profile.avatar_symbol}</span>
            ):(
              <span style={{fontFamily:'Playfair Display,serif',fontSize:16,color:'#BCA88E'}}>{avatarInitials}</span>
            )}
          </motion.div>
          {isVerified &&<div style={{position:'absolute',top:-1,right:-1,width:8,height:8,borderRadius:'50%',background:'#BCA88E',border:'1px solid #0a0a0a',zIndex:2}}/>}
        </div>
      </div>
      <AnimatePresence>
        {hov &&(
          <motion.div initial={{opacity:0,y:10,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:10,scale:0.95}} transition={{duration:0.2,ease:[0.23,1,0.32,1]}}
            style={{position:'absolute',top:'100%',right:0,paddingTop:12,minWidth:180,zIndex:1000}}>
            <div style={{background:'rgba(10,10,10,0.95)',border:'1px solid rgba(188,168,142,0.15)',backdropFilter:'blur(20px)',padding:'8px 0',boxShadow:'0 20px 40px rgba(0,0,0,0.6)'}}>
              {[{label:'MY PROFILE',route:'/profile'},{label:'DASHBOARD',route:'/dashboard'}].map((item)=>[
                <button key={item.label} onClick={()=>{navigate(item.route);setHov(false);}}
                  style={{width:'100%',textAlign:'left',padding:'12px 20px',background:'none',border:'none',fontFamily:'"Montserrat",sans-serif',fontSize:11,color:'#BCA88E',letterSpacing:3,cursor:'pointer',transition:'background 0.2s'}}
                  onMouseEnter={(e)=>((e.currentTarget as HTMLElement).style.background='rgba(188,168,142,0.08)')}
                  onMouseLeave={(e)=>((e.currentTarget as HTMLElement).style.background='none')}>
                  {item.label}
                </button>
              ])}
              <div style={{height:1,background:'rgba(188,168,142,0.1)',margin:'4px 12px'}}/>
              <button onClick={handleLogout} disabled={isExiting}
                style={{width:'100%',textAlign:'left',padding:'12px 20px',background:'none',border:'none',fontFamily:'"Montserrat",sans-serif',fontSize:11,color:'#ff4d4d',letterSpacing:3,cursor:isExiting?'not-allowed':'pointer',opacity:isExiting?0.5:1}}
                onMouseEnter={(e)=>{if(!isExiting)(e.currentTarget as HTMLElement).style.background='rgba(255,77,77,0.05)';}}
                onMouseLeave={(e)=>((e.currentTarget as HTMLElement).style.background='none')}>
                {isExiting?'EXITING...':'SIGN OUT'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Hamburger({isOpen,onClick}:{isOpen:boolean;onClick:()=>void}){
  return (
    <button onClick={onClick} style={{width:40,height:40,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',padding:0,zIndex:1000}}>
      <motion.div animate={{rotate:isOpen?45:0,y:isOpen?6.5:0}} style={{width:20,height:1.5,background:'#BCA88E'}}/>
      <motion.div animate={{opacity:isOpen?0:1}} style={{width:20,height:1.5,background:'#BCA88E'}}/>
      <motion.div animate={{rotate:isOpen?-45:0,y:isOpen?-6.5:0}} style={{width:20,height:1.5,background:'#BCA88E'}}/>
    </button>
  );
}

export default function Nav({scrolled}:NavProps){
  const {user,profile,isAdmin} =useAuth();
  const navigate =useNavigate();
  const location =useLocation();
  const [isMobile,setIsMobile]=useState(()=>window.innerWidth<768);
  const [isMenuOpen,setIsMenuOpen]=useState(false);
  const [showLogo]=useState(true);

  const hasRoles =!!(profile?.roles?.length||profile?.role);

  useEffect(()=>{
    const handleResize =()=>setIsMobile(window.innerWidth<768);
    window.addEventListener('resize',handleResize);
    return ()=>window.removeEventListener('resize',handleResize);
  },[]);

  useEffect(()=>{setIsMenuOpen(false);},[location.pathname]);

  const navItems:NavItem[]=[];
  if (user){
    navItems.push({label:'HOME',route:'/'});
    if (isAdmin){
      navItems.push({label:'CREW',route:'/crew'});
      navItems.push({label:'DASHBOARD',route:'/dashboard',state:{activeRole:'admin'}});
    } else {
      navItems.push({label:'DASHBOARD',route:'/dashboard'});
      navItems.push({label:hasRoles?'ADD ROLE':'ROLES',route:'/role-select'});
    }
    navItems.push({label:'ABOUT',route:'/about'});
  } else {
    navItems.push({label:'HOME',route:'/'});
    navItems.push({label:'WORKS',action:'cinema'});
    navItems.push({label:'JOIN',action:'join',route:'/about'});
    navItems.push({label:'ABOUT',route:'/about'});
  }

  const handleNav =(item:NavItem)=>{
    setIsMenuOpen(false);
    if (item.action==='signout'){
      supabase.auth.signOut().then(()=>navigate('/'));
    } else if (item.route){
      navigate(item.route,item.state?{state:item.state}:undefined);
    } else if (item.action==='cinema'){
      if (location.pathname!=='/') navigate('/',{state:{scrollTo:'reel-section'}});
      else document.getElementById('reel-section')?.scrollIntoView({behavior:'smooth'});
    } else if (item.action==='join'){
      if (location.pathname!=='/') navigate('/',{state:{scrollTo:'join-section'}});
      else document.getElementById('join-section')?.scrollIntoView({behavior:'smooth'});
    }
  };

  return (
    <>
      <motion.header style={{position:'fixed',top:0,left:0,right:0,height:90,display:'flex',alignItems:'center',justifyContent:'space-between',paddingLeft:isMobile?12:28,paddingRight:isMobile?12:48,zIndex:500,background:'transparent'}}
        initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.6}}>
        <motion.a href="/" onClick={(e)=>{e.preventDefault();navigate('/');window.dispatchEvent(new CustomEvent('lenis-scroll-to',{detail:{target:0}}));setIsMenuOpen(false);}}
          style={{display:'flex',alignItems:'center',textDecoration:'none',flexShrink:0,pointerEvents:showLogo?'auto':'none'}}
          aria-label="Supreme Talkies — home" initial={{opacity:0,x:-20}} animate={{opacity:showLogo?1:0,x:showLogo?0:-20}} transition={{duration:0.5,ease:'easeOut'}}>
          <img src="/logo-main.webp" alt="Supreme Talkies" draggable={false} style={{height:isMobile?60:75,width:'auto',mixBlendMode:'screen',filter:'brightness(1.1) saturate(1.2)'}}/>
        </motion.a>
        {!isMobile &&(
          <nav style={{position:'absolute',left:'50%',transform:'translateX(-50%)',display:'flex',alignItems:'center',gap:48}}>
            {navItems.map((item)=><NavLink key={item.label} item={item} onClick={()=>handleNav(item)}/>)}
          </nav>
        )}
        {isMobile?<Hamburger isOpen={isMenuOpen} onClick={()=>setIsMenuOpen(!isMenuOpen)}/>:<UserIndicator/>}
      </motion.header>
      <AnimatePresence>
        {isMobile &&isMenuOpen &&(
          <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{duration:0.45,ease:[0.76,0,0.24,1]}}
            style={{position:'fixed',inset:0,background:'rgba(6,6,6,0.97)',backdropFilter:'blur(16px)',zIndex:1000,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'120px 40px'}}>
            <nav style={{display:'flex',flexDirection:'column',alignItems:'center',gap:32}}>
              {navItems.map((item)=><NavLink key={item.label} item={item} onClick={()=>handleNav(item)} isMobileView={true}/>)}
            </nav>
            <UserIndicator isMobileView={true}/>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scrolled &&(
          <motion.div key="nav-scrolled-bg" style={{position:'fixed',top:0,left:0,right:0,height:90,background:'rgba(6,6,6,0.82)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(188,168,142,0.08)',zIndex:49,pointerEvents:'none'}}
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.35}}/>
        )}
      </AnimatePresence>
    </>
  );
}
