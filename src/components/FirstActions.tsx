import { useNavigate } from 'react-router-dom';

const ACTIONS: Record<string, { title: string; steps: { label: string; hint: string; to?: string; hash?: string }[] }> = {
  writer: {
    title: 'First actions',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Submit your first script', hint: 'DNA tags + PDF link', hash: 'writer-scripts' },
      { label: 'Browse open briefs', hint: 'Find producer calls', hash: 'writer-briefs' },
    ],
  },
  technician: {
    title: 'First actions',
    steps: [
      { label: 'Fill your crew card', hint: 'Niche, skills, portfolio', to: '/profile' },
      { label: 'Set availability', hint: 'Show you are open to work', hash: 'tech-portfolio' },
      { label: 'Send a collab request', hint: 'Search crew by name', hash: 'tech-collab' },
    ],
  },
  producer: {
    title: 'First actions',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Post a film brief', hint: 'Tell writers what you need', hash: 'producer-briefs' },
      { label: 'Browse scripts', hint: 'React to stories you love', hash: 'producer-scripts' },
    ],
  },
  presenter: {
    title: 'First actions',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Propose a screening', hint: 'Share venue + contact', hash: 'presenter-form' },
      { label: 'Track your proposals', hint: 'Watch approval status', hash: 'presenter-list' },
    ],
  },
  marketing: {
    title: 'First actions',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Join a campaign', hint: 'Grab the share kit', hash: 'marketing-campaigns' },
      { label: 'Drop a marketing idea', hint: 'Sticky note board', hash: 'marketing-ideas' },
    ],
  },
  amplifier: {
    title: 'First actions',
    steps: [
      { label: 'Complete your profile', hint: 'Earn SUPR Verified', to: '/profile' },
      { label: 'Log a daily share', hint: 'Marked as logged by you', hash: 'amp-impact' },
      { label: 'Post on the shoutout wall', hint: 'Cheer the set', hash: 'amp-wall' },
    ],
  },
  admin: {
    title: 'First actions',
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
    <div className="dash-first">
      <p className="eyebrow">{pack.title}</p>
      <div className="dash-first-grid">
        {pack.steps.map((step, i) => (
          <button
            key={step.label}
            type="button"
            className="dash-first-step"
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
          >
            <span>0{i + 1}</span>
            <strong>{step.label}</strong>
            <em>{step.hint}</em>
          </button>
        ))}
      </div>
    </div>
  );
}
