import {useState,useEffect,FormEvent} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {useNavigate,useLocation} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../lib/supabase';

/* Shared components */
function CinemaInput({label,type='text',placeholder,value,onChange,error}:{
  label:string;type?:string;placeholder?:string;value:string;onChange:(v:string)=>void;error?:string;
}){
  const [focused,setFocused]=useState(false);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <label style={{fontFamily:'Playfair Display,sans-serif',fontSize:10,color:error?'#ff6b6b':focused?'#BCA88E':'#BCA88E',letterSpacing:5,opacity:focused?1:0.7,transition:'opacity 0.2s'}}>
        {label}{error&&<span style={{marginLeft:8,fontFamily:'Inter,monospace',fontSize:9,letterSpacing:2}}>{error}</span>}
      </label>
      <input type={type} placeholder={placeholder} value={value} onChange={(e)=>onChange(e.target.value)}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{background:'transparent',border:'none',borderBottom:`1px solid ${focused?'#BCA88E':'rgba(188,168,142,0.25)'}`,paddingBottom:10,fontFamily:'Inter,monospace',fontSize:14,color:'#F0EBE0',outline:'none',transition:'border-color 0.25s'}}/>
    </div>
  );
}

function CinemaButton({children,onClick,disabled,loading}:{children:React.ReactNode;onClick?:()=>void;disabled?:boolean;loading?:boolean;}){
  const [hov,setHov]=useState(false);
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled||loading} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      animate={{background:hov&&!disabled?'#BCA88E':'transparent',color:hov&&!disabled?'#0e0f13':'#BCA88E',opacity:disabled?0.35:1}}
      transition={{duration:0.2}}
      style={{border:'1px solid #BCA88E',padding:'13px 36px',fontFamily:'Playfair Display,sans-serif',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',gap:10,cursor:disabled?'not-allowed':'pointer',width:'100%'}}>
      {loading&&<motion.span animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}} style={{display:'inline-block',width:13,height:13,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%'}}/>}
      {children}
    </motion.button>
  );
}

/* Left panel decorations */
function FilmReel(){
  return (
    <motion.svg width="190" height="190" viewBox="0 0 200 200" fill="none" animate={{rotate:360}} transition={{duration:20,repeat:Infinity,ease:'linear'}}>
      <circle cx="100" cy="100" r="94" fill="rgba(188,168,142,0.12)" stroke="rgba(188,168,142,0.5)" strokeWidth="2"/>
      <circle cx="100" cy="100" r="78" fill="rgba(14,15,19,0.6)" stroke="rgba(188,168,142,0.2)" strokeWidth="1"/>
      {Array.from({length:5}).map((_,i)=>{
        const angle=(i/5)*Math.PI*2-Math.PI/2;
        const x=100+50*Math.cos(angle);
        const y=100+50*Math.sin(angle);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="22" fill="rgba(14,15,19,0.95)" stroke="rgba(188,168,142,0.35)" strokeWidth="1.5"/>
            <circle cx={x} cy={y} r="16" fill="rgba(14,15,19,0.5)"/>
          </g>
        );
      })}
      <circle cx="100" cy="100" r="16" fill="rgba(188,168,142,0.15)" stroke="rgba(188,168,142,0.4)" strokeWidth="1.5"/>
      {Array.from({length:5}).map((_,i)=>{
        const angle=(i/5)*Math.PI*2;
        return <line key={i} x1={100+6*Math.cos(angle)} y1={100+6*Math.sin(angle)} x2={100+14*Math.cos(angle)} y2={100+14*Math.sin(angle)} stroke="rgba(188,168,142,0.5)" strokeWidth="1.5"/>;
      })}
    </motion.svg>
  );
}

function SprocketCol({side}:{side:'left'|'right'}){
  return (
    <div style={{position:'absolute',[side]:0,top:0,bottom:0,width:28,display:'flex',flexDirection:'column',alignItems:'center',gap:14,paddingTop:20,opacity:0.25}}>
      {Array.from({length:24}).map((_,i)=><div key={i} style={{width:14,height:10,background:'#0e0f13',border:'1px solid rgba(188,168,142,0.3)',borderRadius:2}}/>)}
    </div>
  );
}

function Corner({pos}:{pos:{top?:number;bottom?:number;left?:number;right?:number}}){
  return (
    <div style={{position:'absolute',...pos,width:24,height:24,zIndex:3}}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={pos.left!==undefined&&pos.top!==undefined?'M0,0L0,10M0,0L10,0':pos.right!==undefined&&pos.top!==undefined?'M24,0L24,10M14,0L24,0':pos.left!==undefined&&pos.bottom!==undefined?'M0,24L0,14M0,24L10,24':'M24,24L24,14M14,24L24,24'}
          stroke="#BCA88E" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

function SourceSelection({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:string[];}){
  const [open,setOpen]=useState(false);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6,position:'relative'}}>
      <label style={{fontFamily:'Playfair Display,sans-serif',fontSize:10,color:'#BCA88E',letterSpacing:5,opacity:0.7}}>{label}</label>
      <button type="button" onClick={()=>setOpen(!open)} style={{background:'transparent',border:'none',borderBottom:'1px solid rgba(188,168,142,0.25)',paddingBottom:10,fontFamily:'Inter,monospace',fontSize:14,color:value?'#F0EBE0':'rgba(240,235,224,0.35)',textAlign:'left',cursor:'pointer'}}>
        {value||'Select...'}
      </button>
      <AnimatePresence>
        {open&&(
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} style={{position:'absolute',top:'100%',left:0,right:0,background:'rgba(10,10,10,0.98)',border:'1px solid rgba(188,168,142,0.2)',zIndex:10,maxHeight:200,overflowY:'auto'}}>
            {options.map((opt)=>(
              <button key={opt} type="button" onClick={()=>{onChange(opt);setOpen(false);}} style={{width:'100%',textAlign:'left',padding:'10px 14px',background:'none',border:'none',fontFamily:'Inter,monospace',fontSize:12,color:'#F0EBE0',cursor:'pointer',transition:'background 0.15s'}}
                onMouseEnter={(e)=>((e.currentTarget as HTMLElement).style.background='rgba(188,168,142,0.08)')}
                onMouseLeave={(e)=>((e.currentTarget as HTMLElement).style.background='none')}>
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const HOW_OPTIONS=['Instagram','Twitter/X','YouTube','Friend','Event','Other'];

export default function Auth(){
  const {user,profile,loading:authLoading,profileAttempted,isAdmin} =useAuth();
  const location =useLocation();
  const navigate =useNavigate();
  const [mode,setMode]=useState<'login'|'signup'|'forgot'>('login');

  useEffect(()=>{
    if ((location.state as Record<string,unknown>)?.mode==='signup') setMode('signup');
  },[location.state]);

  const [loading,setLoading]=useState(false);
  const [resetSuccess,setResetSuccess]=useState(false);
  const [error,setError]=useState('');
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});

  useEffect(()=>{
    if (authLoading) return;
    if (user){
      if (isAdmin) navigate('/dashboard',{state:{activeRole:'admin'}});
      else if (profileAttempted &&profile) navigate('/dashboard',{replace:true});
      else if (profileAttempted) navigate('/role-select',{replace:true});
    }
  },[authLoading,user,profile,profileAttempted,isAdmin,navigate]);

  /* Login fields */
  const [loginEmail,setLoginEmail]=useState('');
  const [loginPassword,setLoginPassword]=useState('');

  /* Signup fields */
  const [fullName,setFullName]=useState('');
  const [age,setAge]=useState('');
  const [signupEmail,setSignupEmail]=useState('');
  const [signupPassword,setSignupPassword]=useState('');
  const [phone,setPhone]=useState('');
  const [address,setAddress]=useState('');
  const [howHeard,setHowHeard]=useState('');

  /* Forgot fields */
  const [forgotEmail,setForgotEmail]=useState('');

  const validateLogin =()=>{
    const e:Record<string,string>={};
    if (!loginEmail.includes('@')) e.email='invalid email';
    if (loginPassword.length<6) e.password='min 6 chars';
    return e;
  };

  const validateSignup =()=>{
    const e:Record<string,string>={};
    if (!fullName.trim()) e.fullName='required';
    if (!signupEmail.includes('@')) e.email='invalid email';
    if (signupPassword.length<6) e.password='min 6 chars';
    if (!phone.trim()) e.phone='required';
    return e;
  };

  const handleLogin =async ()=>{
    const errs=validateLogin();
    if (Object.keys(errs).length){setFieldErrors(errs);return;}
    setFieldErrors({});setLoading(true);setError('');
    try {
      const {error}=await supabase.auth.signInWithPassword({email:loginEmail,password:loginPassword});
      if (error) throw error;
    } catch (err:unknown){
      setError(err instanceof Error?err.message:'Login failed');
    } finally {setLoading(false);}
  };

  const handleSignup =async ()=>{
    const errs=validateSignup();
    if (Object.keys(errs).length){setFieldErrors(errs);return;}
    setFieldErrors({});setLoading(true);setError('');
    try {
      const {data,error}=await supabase.auth.signUp({
        email:signupEmail,
        password:signupPassword,
        options:{
          data:{
            full_name:fullName.trim(),  // FIXED: was 'fullName', now 'full_name' to match AuthContext
            age:age?parseInt(age,10):null,
            phone:phone.trim(),
            address:address.trim(),
            how_did_you_hear:howHeard,
          },
        },
      });
      if (error) throw error;
      if (!data.user) setError('Check your email to confirm your account.');
    } catch (err:unknown){
      setError(err instanceof Error?err.message:'Signup failed');
    } finally {setLoading(false);}
  };

  const handleForgotPassword =async ()=>{
    if (!forgotEmail.includes('@')){setFieldErrors({forgotEmail:'invalid email'});return;}
    setFieldErrors({});setLoading(true);setError('');
    try {
      const {error}=await supabase.auth.resetPasswordForEmail(forgotEmail,{redirectTo:`${window.location.origin}/auth?mode=reset`});
      if (error) throw error;
      setResetSuccess(true);
    } catch (err:unknown){
      setError(err instanceof Error?err.message:'Reset failed');
    } finally {setLoading(false);}
  };

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#0e0f13'}}>
      <div style={{position:'absolute',top:24,left:24,zIndex:10}}>
        <motion.button onClick={()=>navigate('/')} initial={{opacity:0,x:-10}} animate={{opacity:0.9,x:0}} whileHover={{opacity:1,x:6}}
          style={{background:'none',border:'none',fontFamily:'Inter,monospace',fontSize:14,fontWeight:800,color:'#BCA88E',letterSpacing:5,cursor:'pointer',display:'flex',alignItems:'center',gap:12,padding:0,textAlign:'left'}}>
          <span style={{fontSize:18}}>←</span>HOME
        </motion.button>
      </div>
      <motion.div initial={{opacity:0,x:-40}} animate={{opacity:1,x:0}} transition={{duration:0.9,ease:[0.25,0.1,0.25,1]}}
        style={{position:'relative',width:'42%',flexShrink:0,overflow:'hidden',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:36}}>
        <div style={{position:'absolute',inset:0,backgroundImage:"url('/hero-bg.webp')",backgroundSize:'cover',backgroundPosition:'center',filter:'brightness(0.25) saturate(0.6)'}}/>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(188,168,142,0.08) 0%,transparent 70%)'}}/>
        <div className="film-grain" style={{position:'absolute',inset:0,opacity:0.06,zIndex:1}}/>
        <SprocketCol side="left"/><SprocketCol side="right"/>
        <Corner pos={{top:20,left:36}}/><Corner pos={{top:20,right:36}}/><Corner pos={{bottom:20,left:36}}/><Corner pos={{bottom:20,right:36}}/>
        <div style={{position:'relative',zIndex:3,display:'flex',flexDirection:'column',alignItems:'center',gap:28}}>
          <motion.img src="/logo-main.webp" alt="Supreme Talkies" fetchPriority="high"
            style={{width:'clamp(120px,16vw,200px)',height:'auto',mixBlendMode:'screen',filter:'brightness(1.1) saturate(1.2)'}}
            animate={{filter:['brightness(1.0) saturate(1.1)','brightness(1.3) saturate(1.4)','brightness(1.0) saturate(1.1)']}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}/>
          <FilmReel/>
        </div>
      </motion.div>
      <motion.div data-lenis-prevent initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{duration:0.9,ease:[0.25,0.1,0.25,1]}}
        style={{flex:1,background:'#13141a',display:'flex',flexDirection:'column',justifyContent:'flex-start',padding:'clamp(32px,5vw,72px)',position:'relative',overflowY:'auto'}}>
        <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'repeating-linear-gradient(0deg,transparent 0px,transparent 60px,rgba(188,168,142,0.012)60px,rgba(188,168,142,0.012)61px),repeating-linear-gradient(90deg,transparent 0px,transparent 60px,rgba(188,168,142,0.008)60px,rgba(188,168,142,0.008)61px)'}}/>
        <div style={{position:'relative',zIndex:1,maxWidth:420,width:'100%'}}>
          <AnimatePresence mode="wait">
            {mode==='login'?(
              <motion.div key="login" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.35}} style={{display:'flex',flexDirection:'column',gap:32}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                    <div style={{width:32,height:1,background:'#BCA88E',opacity:0.6}}/>
                    <span style={{fontFamily:'Inter,monospace',fontSize:9,color:'#BCA88E',letterSpacing:5,opacity:0.5}}>SCENE 01</span>
                  </div>
                  <h1 style={{fontFamily:'Playfair Display,sans-serif',fontSize:'clamp(36px,4vw,52px)',color:'#BCA88E',lineHeight:1.05,margin:'0 0 10px',letterSpacing:1}}>GET<br/>IN.</h1>
                  <p style={{fontFamily:'Inter,monospace',fontSize:12,color:'#F0EBE0',opacity:0.35,margin:0,letterSpacing:2}}>The set is waiting.</p>
                </div>
                <form onSubmit={(e:FormEvent)=>{e.preventDefault();handleLogin();}} style={{display:'flex',flexDirection:'column',gap:32}}>
                  <div style={{display:'flex',flexDirection:'column',gap:24}}>
                    <CinemaInput label="EMAIL" type="email" placeholder="you@domain.com" value={loginEmail} onChange={setLoginEmail} error={fieldErrors.email}/>
                    <CinemaInput label="PASSWORD" type="password" placeholder="••••••••" value={loginPassword} onChange={setLoginPassword} error={fieldErrors.password}/>
                    <button type="button" onClick={()=>{setMode('forgot');setError('');setFieldErrors({});}} style={{background:'none',border:'none',padding:0,fontFamily:'Inter,monospace',fontSize:10,color:'#BCA88E',opacity:0.5,letterSpacing:2,alignSelf:'flex-start',cursor:'pointer'}}>Forgot password?</button>
                  </div>
                  {error&&<motion.p initial={{opacity:0}} animate={{opacity:1}} style={{fontFamily:'Inter,monospace',fontSize:11,color:'#ff6b6b',margin:0,letterSpacing:1}}>{error}</motion.p>}
                  <CinemaButton onClick={handleLogin} loading={loading} disabled={loading}>{loading?'PROCESSING':'ACCESS THE SET →'}</CinemaButton>
                </form>
                <div style={{display:'flex',flexDirection:'column',gap:12,margin:'8px 0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{flex:1,height:1,background:'rgba(188,168,142,0.1)'}}/>
                    <span style={{fontFamily:'Inter,monospace',fontSize:8,color:'#BCA88E',opacity:0.5,letterSpacing:3}}>OR VIA</span>
                    <div style={{flex:1,height:1,background:'rgba(188,168,142,0.1)'}}/>
                  </div>
                  <div style={{display:'flex',gap:12}}>
                    <button type="button" onClick={()=>supabase.auth.signInWithOAuth({
                      provider:'google',
                      options: { redirectTo: `${window.location.origin}/auth` }
                    })}
                      style={{flex:1,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(188,168,142,0.2)',padding:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer',transition:'background 0.2s'}}
                      onMouseEnter={(e)=>((e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.08)')}
                      onMouseLeave={(e)=>((e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      <span style={{fontFamily:'Inter,monospace',fontSize:9,color:'#BCA88E',letterSpacing:2}}>GOOGLE</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ):mode==='signup'?(
              <motion.div key="signup" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.35}} style={{display:'flex',flexDirection:'column',gap:28}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                    <div style={{width:32,height:1,background:'#BCA88E',opacity:0.6}}/>
                    <span style={{fontFamily:'Inter,monospace',fontSize:9,color:'#BCA88E',letterSpacing:5,opacity:0.5}}>SCENE 00</span>
                  </div>
                  <h1 style={{fontFamily:'Playfair Display,sans-serif',fontSize:'clamp(32px,3.5vw,46px)',color:'#BCA88E',lineHeight:1.05,margin:'0 0 10px',letterSpacing:1}}>JOIN<br/>THE<br/>CULT.</h1>
                  <p style={{fontFamily:'Inter,monospace',fontSize:11,color:'#F0EBE0',opacity:0.35,margin:0,letterSpacing:2}}>Your call sheet is being prepared.</p>
                </div>
                <form onSubmit={(e:FormEvent)=>{e.preventDefault();handleSignup();}} style={{display:'flex',flexDirection:'column',gap:28}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px 24px'}}>
                    <div style={{gridColumn:'1 / -1'}}>
                      <CinemaInput label="FULL NAME" placeholder="Your name, director" value={fullName} onChange={setFullName} error={fieldErrors.fullName}/>
                    </div>
                    <CinemaInput label="AGE" type="number" placeholder="21" value={age} onChange={setAge}/>
                    <CinemaInput label="PHONE" type="tel" placeholder="+91 98765 43210" value={phone} onChange={setPhone} error={fieldErrors.phone}/>
                    <div style={{gridColumn:'1 / -1'}}>
                      <CinemaInput label="EMAIL" type="email" placeholder="you@domain.com" value={signupEmail} onChange={setSignupEmail} error={fieldErrors.email}/>
                    </div>
                    <div style={{gridColumn:'1 / -1'}}>
                      <CinemaInput label="PASSWORD" type="password" placeholder="Min 6 characters" value={signupPassword} onChange={setSignupPassword} error={fieldErrors.password}/>
                    </div>
                    <CinemaInput label="PLACE / CITY" placeholder="Hyderabad" value={address} onChange={setAddress}/>
                    <div style={{gridColumn:'1 / -1'}}>
                      <SourceSelection label="HOW DID YOU HEAR ABOUT US?" value={howHeard} onChange={setHowHeard} options={HOW_OPTIONS}/>
                    </div>
                  </div>
                  {error&&<motion.p initial={{opacity:0}} animate={{opacity:1}} style={{fontFamily:'Inter,monospace',fontSize:11,color:'#ff6b6b',margin:0,letterSpacing:1}}>{error}</motion.p>}
                  <CinemaButton onClick={handleSignup} loading={loading} disabled={loading}>{loading?'PROCESSING':'GET ON BOARD →'}</CinemaButton>
                </form>
              </motion.div>
            ):(
              <motion.div key="forgot" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.35}} style={{display:'flex',flexDirection:'column',gap:32}}>
                {resetSuccess?(
                  <div style={{textAlign:'center',padding:'20px 0'}}>
                    <h2 style={{fontFamily:'Playfair Display,sans-serif',fontSize:22,color:'#BCA88E',margin:'0 0 12px',letterSpacing:2}}>CHECK YOUR INBOX</h2>
                    <p style={{fontFamily:'Inter,monospace',fontSize:13,color:'#F0EBE0',opacity:0.6,margin:'0 0 24px',lineHeight:1.6}}>We&apos;ve sent a reset link to {forgotEmail}.</p>
                    <button type="button" onClick={()=>{setMode('login');setResetSuccess(false);}} style={{background:'none',border:'none',fontFamily:'Inter,monospace',fontSize:11,color:'#BCA88E',letterSpacing:3,cursor:'pointer'}}>← BACK TO SIGN IN</button>
                  </div>
                ):(
                  <form onSubmit={(e:FormEvent)=>{e.preventDefault();handleForgotPassword();}} style={{display:'flex',flexDirection:'column',gap:32}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                        <div style={{width:32,height:1,background:'#BCA88E',opacity:0.6}}/>
                        <span style={{fontFamily:'Inter,monospace',fontSize:9,color:'#BCA88E',letterSpacing:5,opacity:0.5}}>SCENE 02</span>
                      </div>
                      <h1 style={{fontFamily:'Playfair Display,sans-serif',fontSize:'clamp(36px,4vw,52px)',color:'#BCA88E',lineHeight:1.05,margin:'0 0 10px',letterSpacing:1}}>LOST<br/>THE<br/>KEY?</h1>
                      <p style={{fontFamily:'Inter,monospace',fontSize:12,color:'#F0EBE0',opacity:0.35,margin:0,letterSpacing:2}}>Recovery in progress.</p>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:24}}>
                      <CinemaInput label="RECOVERY EMAIL" type="email" placeholder="you@domain.com" value={forgotEmail} onChange={setForgotEmail} error={fieldErrors.forgotEmail}/>
                    </div>
                    {error&&<motion.p initial={{opacity:0}} animate={{opacity:1}} style={{fontFamily:'Inter,monospace',fontSize:11,color:'#ff6b6b',margin:0,letterSpacing:1}}>{error}</motion.p>}
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      <CinemaButton onClick={handleForgotPassword} loading={loading} disabled={loading}>{loading?'SENDING...':'SEND RESET LINK'}</CinemaButton>
                      <button type="button" onClick={()=>{setMode('login');setError('');setFieldErrors({});}} style={{background:'none',border:'none',fontFamily:'Inter,monospace',fontSize:11,color:'#BCA88E',opacity:0.5,letterSpacing:3,cursor:'pointer',alignSelf:'center'}}>← BACK TO SIGN IN</button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {mode!=='forgot'&&(
            <div style={{marginTop:44,paddingTop:28,borderTop:'1px solid rgba(188,168,142,0.12)',textAlign:'center'}}>
              <motion.button type="button" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('');setFieldErrors({});}} whileHover={{scale:1.02}}
                style={{background:'none',border:'none',fontFamily:'Inter,monospace',fontSize:13,fontWeight:600,color:'#BCA88E',letterSpacing:4,cursor:'pointer',transition:'color 0.3s'}}
                onMouseEnter={(e)=>((e.currentTarget as HTMLElement).style.color='#F0EBE0')}
                onMouseLeave={(e)=>((e.currentTarget as HTMLElement).style.color='#BCA88E')}>
                {mode==='login'?'NO PASS? JOIN THE CREW →':'← ALREADY IN THE REEL?'}
              </motion.button>
              <p style={{fontFamily:'Inter,monospace',fontSize:9,color:'#F0EBE0',opacity:0.3,letterSpacing:2,marginTop:10}}>{mode==='login'?'Become part of the production.':'Return to the screening.'}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}