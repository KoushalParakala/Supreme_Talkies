import { useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useFilms } from '../hooks/useFilms';
import { IconArrowUpRight } from '../components/ReelIcons';

function filmImage(film: { reelImage?: string; posterImage?: string; stills?: string[] }) {
  return film.reelImage || film.posterImage || film.stills?.[0] || '/hero-bg.webp';
}

export default function Films() {
  const { films } = useFilms();
  const [active, setActive] = useState(0);
  const film = films[active] ?? films[0];
  const count = String(films.length).padStart(2, '0');

  return (
    <div className="site-page sub-page">
      <Nav scrolled={true} />
      <main>
        <section className="sub-hero">
          <p className="eyebrow">SUPREME TALKIES / THE REEL</p>
          <h1>The films<br /><em>in motion.</em></h1>
          <p>A living archive of independent releases. Choose a frame and enter the full story.</p>
        </section>
        {film && (
          <section className="films-index-redraft">
            <div className="index-stage">
              <div className="index-feature">
                <img src={filmImage(film)} alt={`${film.title} still`} />
                <div>
                  <span>{String(active + 1).padStart(2, '0')} / {count}</span>
                  <h2>{film.title}</h2>
                  <p>{film.productionNote}</p>
                  <Link to={`/film/${film.id}`} className="text-link light-link">Enter film <IconArrowUpRight /></Link>
                </div>
              </div>
              <div className="index-orbit">
                <span>THE RELEASED REEL</span>
                <strong>{String(active + 1).padStart(2, '0')}</strong>
                <small>/ {count}</small>
              </div>
            </div>
            <div className="index-selector">
              <div className="section-line">
                <span>ARCHIVE / CHOOSE A FRAME</span>
                <span>SELECT <i /></span>
              </div>
              {films.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={`index-selector-row ${i === active ? 'active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.comingSoon ? 'COMING SOON' : 'SHORT'} / {item.duration} / {item.rating}</small>
                  </div>
                  <IconArrowUpRight size={15} />
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
