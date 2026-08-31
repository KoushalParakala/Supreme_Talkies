import { useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { IconArrowUpRight, IconCheck } from '../components/ReelIcons';

const TEAM_MEMBERS = [
  { name: 'Sathwik Mallela', role: 'Creative Head', bio: 'The visionary eye behind the Supreme aesthetic. Crafting the visual language of stories that demand to be told.', image: '/Sathwik.webp', initials: 'SM' },
  { name: 'Harsha Relangi', role: 'Co-founder', bio: 'A pillar of the collective. Driving the production engine and ensuring every creative vision reaches its full potential.', image: '/Harsha.webp', initials: 'HR' },
  { name: 'Sriram Jallepalli', role: 'Co-founder', bio: 'Architect of the Supreme mission. Building the infrastructure for a new era of independent cinema.', image: '/Sriram.webp', initials: 'SJ' },
  { name: 'Hari Maddigunta', role: 'Manager', bio: 'The operational heartbeat of the set. Bridging the gap between creative ambition and flawless execution.', image: '/Hari.webp', initials: 'HM' },
  { name: 'Koushal Parakala', role: 'Technical Head', bio: 'Master of the digital craft. Pushing the boundaries of what is possible in cinematic technology and post-production.', image: '/Koushal.webp', initials: 'KP' },
  { name: 'Charak Madha', role: 'Audio Supervisor', bio: 'The architect of sound. Sculpting immersive auditory experiences that breathe life into every frame.', image: '/Charak.webp', initials: 'CM' },
  { name: 'Gopala Atulith', role: 'Marketing Lead', bio: 'The strategic voice of Supreme. Bridging the gap between our cinematic universe and the global audience.', image: '/Atulith.webp', initials: 'GA' },
];

const BTS = [
  { image: '/hero-bg.webp', cap: '09:14 / LIGHT TEST' },
  { image: '/avasarama_bg1.webp', cap: '11:42 / LAST LOOK' },
  { image: '/cinephile_bg1.webp', cap: '16:08 / ROOM TONE' },
  { image: '/swapped_bg1.webp', cap: '18:27 / RESET' },
  { image: '/bd_bg1.webp', cap: '21:03 / WRAP' },
];

function FoundersGallery() {
  const [active, setActive] = useState(0);
  const founder = TEAM_MEMBERS[active];
  return (
    <section className="founders-scroll">
      <div className="founder-sticky">
        <div className="founder-photo">
          <img src={founder.image} alt={founder.name} />
          <span>{founder.initials}</span>
          <small>CORE TEAM / {String(active + 1).padStart(2, '0')} OF {String(TEAM_MEMBERS.length).padStart(2, '0')}</small>
        </div>
        <div className="founder-copy">
          <p className="eyebrow">THE PEOPLE WHO KEPT THE LIGHT ON</p>
          <h2>{founder.name}<br /><em>{founder.role.toLowerCase()}.</em></h2>
          <p>{founder.bio}</p>
          <div className="founder-tabs">
            {TEAM_MEMBERS.map((person, i) => (
              <button key={person.name} type="button" className={i === active ? 'active' : ''} onClick={() => setActive(i)}>
                {String(i + 1).padStart(2, '0')} / {person.name}
              </button>
            ))}
          </div>
          <span className="verified"><IconCheck /> CORE TEAM</span>
        </div>
      </div>
    </section>
  );
}

export default function About() {
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
    <div className="site-page sub-page about-extended">
      <Nav scrolled={true} />
      <main>
        <section className="sub-hero">
          <p className="eyebrow">SUPREME TALKIES / ABOUT</p>
          <h1>Made by people<br /><em>who stayed.</em></h1>
          <p>An independent film collective for people who want to make, show, and find singular work together.</p>
        </section>

        <section className="about-page-body">
          <div className="about-page-image">
            <img src="/hero-bg.webp" alt="Supreme Talkies" />
          </div>
          <div>
            <p className="eyebrow">THE SHORT VERSION</p>
            <h2>Not a platform.<br /><em>A place.</em></h2>
            <p>
              Supreme Talkies is an independent film collective — a platform where writers craft stories worth telling,
              technicians bring visions to life, and audiences discover cinema that actually matters. We don&apos;t follow the industry. We rewrite it.
            </p>
            {TEAM_MEMBERS.slice(0, 3).map((n) => (
              <div className="founder-row" key={n.name}>
                <span>{n.initials}</span>
                <strong>{n.name} / {n.role}</strong>
                <b><IconCheck size={11} /> CORE</b>
              </div>
            ))}
          </div>
        </section>

        <FoundersGallery />

        <section className="bts-section">
          <div className="section-line"><span>02 / BEHIND THE SCREEN</span><span>NOT FOR RELEASE <i /></span></div>
          <div className="bts-heading">
            <div>
              <p className="eyebrow">THE OTHER CUT</p>
              <h2>Before the<br /><em>credits.</em></h2>
            </div>
            <p>Tables, cables, late lunches, bad weather, good questions. The work before the work is part of the film too.</p>
          </div>
          <div className="bts-belt">
            {BTS.map((item, i) => (
              <figure className={`bts-frame bts-${i + 1}`} key={item.cap}>
                <img src={item.image} alt={`Behind the scenes ${i + 1}`} />
                <figcaption>{item.cap}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="about-contact">
          <div>
            <p className="eyebrow">03 / FIND THE DOOR</p>
            <h2>Say <em>hello.</em></h2>
            <p>General enquiries, submissions, technical questions, or just a note from the other side of the screen.</p>
            <a className="text-link" href="mailto:hello@supremetalkies.com">hello@supremetalkies.com <IconArrowUpRight /></a>
          </div>
          <form onSubmit={handleContactSubmit}>
            <label>Name<input name="name" required placeholder="Your name" /></label>
            <label>Email<input name="email" required type="email" placeholder="you@example.com" /></label>
            <label>Message<textarea name="message" required placeholder="What would you like to say?" /></label>
            <button className="primary-button" type="submit">Send a note <IconArrowUpRight /></button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
