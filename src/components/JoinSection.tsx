import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconArrowUpRight } from './ReelIcons';

const ROLES = [
  { cue: 'LIGHT', slug: 'writer', title: 'Writer', line: 'Shape the first frame.' },
  { cue: 'CAMERA', slug: 'technician', title: 'Technician', line: 'Make the frame hold.' },
  { cue: 'ACTION', slug: 'producer', title: 'Producer', line: 'Make the impossible legible.' },
  { cue: 'SIGNAL', slug: 'presenter', title: 'Presenter', line: 'Keep the room alive.' },
  { cue: 'PULSE', slug: 'marketing', title: 'Marketer', line: 'Find the audience.' },
  { cue: 'WAVE', slug: 'amplifier', title: 'Member', line: 'Be the first wave.' },
] as const;

export default function JoinSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEntry = (cue?: string, slug?: string) => {
    if (user) {
      if (cue === 'LIGHT') navigate('/dashboard', { state: { activeRole: 'writer' } });
      else if (cue === 'CAMERA') navigate('/dashboard', { state: { activeRole: 'technician' } });
      else if (cue === 'ACTION') navigate('/dashboard', { state: { activeRole: 'producer' } });
      else if (slug === 'presenter' || slug === 'marketing' || slug === 'amplifier') {
        navigate('/dashboard', { state: { activeRole: slug } });
      } else navigate('/role-select');
    } else {
      navigate('/auth', { state: { mode: cue ? 'signup' : 'login' } });
    }
  };

  return (
    <section id="join-section" className="members-section">
      <div className="section-line">
        <span>02 / PEOPLE IN THE ROOM</span>
        <span>NO SMALL ROLES <i /></span>
      </div>
      <div className="members-heading">
        <p className="eyebrow">THE COMMUNITY IS THE MEDIUM</p>
        <h2>Every film<br />needs <em>a room.</em></h2>
        <p>Writers, producers, technicians, marketers, presenters — the people who carry a film from a thought to a shared experience.</p>
      </div>
      <div className="member-grid roles-six">
        {ROLES.map((role, i) => (
          <button
            type="button"
            className="member-tile"
            key={role.slug}
            onClick={() => handleEntry(role.cue, role.slug)}
          >
            <span className="tile-index">0{i + 1}</span>
            <div>
              <h3>{role.title}</h3>
              <p>{role.line}</p>
            </div>
            <IconArrowUpRight size={18} />
          </button>
        ))}
      </div>
    </section>
  );
}
