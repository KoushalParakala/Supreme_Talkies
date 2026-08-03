import { useNavigate } from 'react-router-dom';

const ACTIONS: Record<string, { title: string; steps: { label: string; hint: string; to?: string; hash?: string }[] }> = {
  writer: {
    title: 'FIRST ACTIONS',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Submit your first script', hint: 'DNA tags + PDF link', hash: 'writer-scripts' },
      { label: 'Browse open briefs', hint: 'Find producer calls', hash: 'writer-briefs' },
    ],
  },
  technician: {
    title: 'FIRST ACTIONS',
    steps: [
      { label: 'Fill your crew card', hint: 'Niche, skills, portfolio', to: '/profile' },
      { label: 'Set availability', hint: 'Show you are open to work', hash: 'tech-portfolio' },
      { label: 'Send a collab request', hint: 'Search crew by name', hash: 'tech-collab' },
    ],
  },
  producer: {
    title: 'FIRST ACTIONS',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Post a film brief', hint: 'Tell writers what you need', hash: 'producer-briefs' },
      { label: 'Browse scripts', hint: 'React to stories you love', hash: 'producer-scripts' },
    ],
  },
  presenter: {
    title: 'FIRST ACTIONS',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Propose a screening', hint: 'Share venue + contact', hash: 'presenter-form' },
      { label: 'Track your proposals', hint: 'Watch approval status', hash: 'presenter-list' },
    ],
  },
  marketing: {
    title: 'FIRST ACTIONS',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Join a campaign', hint: 'Grab the share kit', hash: 'marketing-campaigns' },
      { label: 'Drop a marketing idea', hint: 'Sticky note board', hash: 'marketing-ideas' },
    ],
  },
  amplifier: {
    title: 'FIRST ACTIONS',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Log a daily share', hint: 'Marked as logged by you', hash: 'amp-impact' },
      { label: 'Post on the shoutout wall', hint: 'Cheer the set', hash: 'amp-wall' },
    ],
  },
  admin: {
    title: 'FIRST ACTIONS',
    steps: [
      { label: 'Open Needs Your Eyes', hint: 'Triage new work', hash: 'admin-inbox' },
      { label: 'Move a script on Kanban', hint: 'Writers get notified', hash: 'admin-writers' },
      { label: 'Review screenings', hint: 'Approve or archive', hash: 'admin-screenings' },
    ],
  },
};

export default function FirstActions({ role }: { role: string }) {
  const navigate = useNavigate();
  const pack = ACTIONS[role];
  if (!pack) return null;

  return (
    <div
      style={{
        marginBottom: 36,
        border: '1px solid rgba(188,168,142,0.15)',
        background: 'rgba(10,10,12,0.55)',
        padding: '20px 22px',
      }}
    >
      <div
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 9,
          letterSpacing: 4,
          color: '#BCA88E',
          marginBottom: 16,
        }}
      >
        {pack.title}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {pack.steps.map((step, i) => (
          <button
            key={step.label}
            type="button"
            onClick={() => {
              if (step.to) {
                navigate(step.to);
                return;
              }
              if (step.hash) {
                const el = document.getElementById(step.hash);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            style={{
              textAlign: 'left',
              background: 'rgba(188,168,142,0.04)',
              border: '1px solid rgba(188,168,142,0.12)',
              padding: '14px 16px',
              cursor: 'pointer',
              color: '#F0EBE0',
            }}
          >
            <div
              style={{
                fontFamily: 'Inter, monospace',
                fontSize: 9,
                color: 'rgba(188,168,142,0.55)',
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              0{i + 1}
            </div>
            <div
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 16,
                color: '#BCA88E',
                marginBottom: 6,
              }}
            >
              {step.label}
            </div>
            <div style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: 'rgba(240,235,224,0.45)' }}>
              {step.hint}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
