import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { GoldDivider, CornerAccents } from '../components/CinemaDecorations';


const TEAM_MEMBERS = [
  { name: "Sathwik Mallela", role: "CREATIVE HEAD", bio: "The visionary eye behind the Supreme aesthetic. Crafting the visual language of stories that demand to be told.", image: "/Sathwik.webp" },
  { name: "Harsha Relangi", role: "CO-FOUNDER", bio: "A pillar of the collective. Driving the production engine and ensuring every creative vision reaches its full potential.", image: "/Harsha.webp" },
  { name: "Sriram Jallepalli", role: "CO-FOUNDER", bio: "Architect of the Supreme mission. Building the infrastructure for a new era of independent cinema.", image: "/Sriram.webp" },
  { name: "Hari Maddigunta", role: "MANAGER", bio: "The operational heartbeat of the set. Bridging the gap between creative ambition and flawless execution.", image: "/Hari.webp" },
  { name: "Koushal Parakala", role: "TECHNICAL HEAD", bio: "Master of the digital craft. Pushing the boundaries of what's possible in cinematic technology and post-production.", image: "/Koushal.webp" },
  { name: "Charak Madha", role: "AUDIO SUPERVISOR", bio: "The architect of sound. Sculpting immersive auditory experiences that breathe life into every frame.", image: "/Charak.webp" },
  { name: "Gopala Atulith", role: "MARKETING LEAD", bio: "The strategic voice of Supreme. Bridging the gap between our cinematic universe and the global audience through innovative storytelling in marketing.", image: "/Atulith.webp" },
];

function TeamMemberCard({ member, index }: { member: typeof TEAM_MEMBERS[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.215, 0.61, 0.355, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'rgba(14,15,20,0.8)',
        border: '1px solid rgba(188,168,142,0.15)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.35s ease',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        borderColor: hov ? 'rgba(188,168,142,0.5)' : 'rgba(188,168,142,0.15)',
        boxShadow: hov ? '0 20px 60px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      {/* Decorative Sprockets */}
      <div style={{ height: 12, background: 'repeating-linear-gradient(90deg, #BCA88E 0px, #BCA88E 8px, transparent 8px, transparent 16px)', opacity: 0.3, marginBottom: 4 }} />
      
      <div style={{ padding: '0 12px' }}>
        <div style={{ aspectRatio: '3/4', width: '100%', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(188,168,142,0.1) 0%, rgba(30,32,41,0.8) 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.img 
            src={member.image} 
            alt={member.name}
            animate={{ scale: hov ? 1.05 : 1 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
             {!member.image && <span style={{ fontFamily: 'Playfair Display', fontSize: 40, color: '#BCA88E', opacity: 0.2 }}>{member.name.charAt(0)}</span>}
          </div>
        </div>
      </div>

      <div style={{ height: 12, background: 'repeating-linear-gradient(90deg, #BCA88E 0px, #BCA88E 8px, transparent 8px, transparent 16px)', opacity: 0.3, marginTop: 4 }} />

      <div style={{ padding: 20 }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#F0EBE0', margin: '0 0 4px', letterSpacing: 1 }}>{member.name}</h3>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 5, margin: '0 0 12px', fontWeight: 600 }}>{member.role}</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.6, lineHeight: 1.7, margin: 0 }}>{member.bio}</p>
      </div>
    </motion.div>
  );
}

export default function About() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    const onLenisScroll = (e: Event) => {
      const scroll = (e as CustomEvent<number>).detail;
      setScrolled(scroll > window.innerHeight * 0.2);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('lenis-scroll', onLenisScroll);
    return () => {
      window.removeEventListener('lenis-scroll', onLenisScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    const subject = `Inquiry from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    window.location.href = `mailto:hello@supremetalkies.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', overflowX: 'hidden' }}>
      <Nav scrolled={scrolled} />
      
      {/* SECTION 1 — HERO */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          style={{ position: 'absolute', inset: '-5%', backgroundImage: "url('/hero-bg.webp')", backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }}
          initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 3, ease: 'easeOut' }}
        />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.8) 100%)' }} />
        <CornerAccents />
        
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 800 }}>
          <motion.span 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.6, y: 0 }} transition={{ delay: 0.6 }}
            style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 8, fontWeight: 700, display: 'block', marginBottom: 16 }}
          >
            EST. 2025
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(48px, 7vw, 96px)', color: '#F0EBE0', margin: '0 0 8px', letterSpacing: 2 }}
          >
            SUPREME TALKIES
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.8, y: 0 }} transition={{ delay: 1.0 }}
            style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(16px, 2vw, 24px)', fontStyle: 'italic', color: '#BCA88E', margin: '0 0 32px' }}
          >
            Where stories demand to be told.
          </motion.p>
          
          <div style={{ width: '200px', margin: '0 auto 40px' }}>
             <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2, delay: 1.2 }} style={{ height: 1, background: '#BCA88E', transformOrigin: 'center' }} />
          </div>

          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 1.4, duration: 1 }}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#F0EBE0', lineHeight: 1.9, margin: '0 auto', maxWidth: 600 }}
          >
            Supreme Talkies is an independent film collective — a platform where writers craft 
            stories worth telling, technicians bring visions to life, and audiences discover 
            cinema that actually matters. We don't follow the industry. We rewrite it.
          </motion.p>
        </div>
      </section>

      <GoldDivider />

      {/* SECTION 2 — THE MISSION */}
      <section style={{ padding: '120px 0', maxWidth: 1200, margin: '0 auto', paddingLeft: 40, paddingRight: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 80, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontStyle: 'italic', color: '#BCA88E', lineHeight: 1.5, margin: '0 0 24px' }}>
              "Cinema is not a medium. It is a language. And we are teaching it to the world."
            </h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#F0EBE0', opacity: 0.4, letterSpacing: 4, fontWeight: 700 }}>
              — SUPREME TALKIES, 2025
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { val: "8+", label: "FILMS IN PIPELINE" },
              { val: "100+", label: "MEMBERS" },
              { val: "10+", label: "CREATIVE ROLES" },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(30,32,41,0.6)', border: '1px solid rgba(188,168,142,0.12)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, color: '#BCA88E' }}>{stat.val}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#F0EBE0', opacity: 0.6, letterSpacing: 5, fontWeight: 700 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* SECTION 3 — THE CORE TEAM */}
      <section style={{ padding: '120px 0', maxWidth: 1200, margin: '0 auto', paddingLeft: 40, paddingRight: 40 }}>
        <div style={{ marginBottom: 60 }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 8, fontWeight: 700, display: 'block', marginBottom: 12 }}>
            THE CORE TEAM
          </span>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontStyle: 'italic', color: '#F0EBE0', margin: '0 0 24px' }}>
            The Minds Behind The Reel
          </h2>
          <div style={{ width: 120 }}>
            <GoldDivider />
          </div>
        </div>

        {/* UNIFIED 12-COLUMN GRID FOR 3-AND-4 LAYOUT */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', 
          gap: isMobile ? 32 : 40 
        }}>
          {TEAM_MEMBERS.map((member, i) => (
            <div key={i} style={{ 
              gridColumn: isMobile ? 'auto' : (i < 3 ? 'span 4' : 'span 3'),
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{ width: '100%', maxWidth: '320px' }}>
                <TeamMemberCard member={member} index={i} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — CONTACT US */}
      <section style={{ padding: '100px 0', background: 'rgba(30,32,41,0.3)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingLeft: 40, paddingRight: 40 }}>
          <div style={{ marginBottom: 60 }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 8, fontWeight: 700, display: 'block', marginBottom: 12 }}>
              GET IN TOUCH
            </span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontStyle: 'italic', color: '#F0EBE0', margin: 0 }}>
              Join the collective. Pitch your story. Ask anything.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 80 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {[
                { icon: "✉", label: "GENERAL ENQUIRIES", email: "hello@supremetalkies.com" },
                { icon: "🎬", label: "SUBMISSIONS", email: "submissions@supremetalkies.com" },
                { icon: "⚙", label: "TECHNICAL SUPPORT", email: "support@supremetalkies.com" },
              ].map((item, i) => (
                <a 
                  key={i} 
                  href={`mailto:${item.email}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#BCA88E', letterSpacing: 4, fontWeight: 700, display: 'block', marginBottom: 4 }}>{item.label}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#F0EBE0', opacity: 0.6 }}>{item.email}</span>
                    <motion.div style={{ height: 1, background: '#BCA88E', width: 0 }} whileHover={{ width: '100%' }} />
                  </div>
                </a>
              ))}
            </div>

            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#BCA88E', letterSpacing: 3, fontWeight: 700 }}>NAME</label>
                  <input name="name" required style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(188,168,142,0.2)', padding: '12px 16px', color: '#F0EBE0', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#BCA88E', letterSpacing: 3, fontWeight: 700 }}>EMAIL</label>
                  <input name="email" type="email" required style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(188,168,142,0.2)', padding: '12px 16px', color: '#F0EBE0', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, color: '#BCA88E', letterSpacing: 3, fontWeight: 700 }}>MESSAGE</label>
                <textarea name="message" rows={4} required style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(188,168,142,0.2)', padding: '12px 16px', color: '#F0EBE0', outline: 'none', fontFamily: 'Inter, sans-serif', resize: 'none' }} />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: 'none', border: '1px solid #BCA88E', color: '#BCA88E',
                  padding: '14px 44px', fontFamily: 'Montserrat, sans-serif',
                  fontSize: 11, fontWeight: 600, letterSpacing: 5, cursor: 'pointer',
                  alignSelf: 'flex-start', transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#BCA88E';
                  (e.currentTarget as HTMLElement).style.color = '#0a0a0a';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'none';
                  (e.currentTarget as HTMLElement).style.color = '#BCA88E';
                }}
              >
                SEND MESSAGE
              </motion.button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
