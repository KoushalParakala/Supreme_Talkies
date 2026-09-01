import { IconMoon, IconSun } from './ReelIcons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = 'nav-bubble' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`${className}${dark ? ' is-open' : ''}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
      onClick={toggle}
    >
      {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
    </button>
  );
}
