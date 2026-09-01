import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <a href="/" className="brand-lockup" aria-label="Supreme Talkies home">
        <img src="/logo-main.webp" alt="" />
        <span>SUPREME<br />TALKIES</span>
      </a>
      <p>
        Independent film, held in common.<br />
        <span>© {new Date().getFullYear()} Supreme Talkies</span>
      </p>
      <div>
        <a href="mailto:hello@supremetalkies.com">Contact</a>
        <Link to="/films">Films</Link>
        <Link to="/" state={{ scrollTo: 'join-section' }}>Join</Link>
      </div>
    </footer>
  );
}
