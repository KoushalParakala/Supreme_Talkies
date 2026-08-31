import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFilms } from '../hooks/useFilms';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { IconChevronLeft, IconPlay, IconCheck } from '../components/ReelIcons';

export default function FilmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { films, loading } = useFilms();
  const film = films.find((f) => f.id === id);

  useEffect(() => {
    if (!loading && !film) navigate('/', { replace: true });
  }, [film, loading, navigate]);

  if (loading || !film) {
    return <div className="site-page" style={{ minHeight: '100vh' }} />;
  }

  const handleBack = () => {
    navigate('/', { state: { returnToFilm: film.id } });
  };

  const hero = film.stills?.[0] || film.reelImage || film.posterImage || '/hero-bg.webp';

  const credits = (film.customCredits && film.customCredits.length > 0
    ? film.customCredits
        .filter((c) => c.role?.trim() && c.value?.trim())
        .map((c) => ({ label: c.role.trim().toUpperCase(), value: c.value.trim() }))
    : [
        { label: 'DIRECTION', value: film.director },
        { label: 'PRODUCER', value: film.producer },
        { label: 'WRITTEN BY', value: film.writtenBy },
        { label: 'CINEMATOGRAPHY', value: film.cinematography },
        { label: 'EDITING', value: film.editing },
        { label: 'MUSIC', value: film.music },
        { label: 'CAST', value: film.cast },
        { label: 'ASSOCIATE DIRECTOR', value: film.associateDirector },
        { label: 'COLOURIST', value: film.colourist },
        { label: 'PUBLICITY DESIGN', value: film.publicityDesign },
        { label: 'PRESENTED BY', value: film.presentedBy },
        { label: 'TELUGU DUBBING TEAM', value: film.teluguDubbingTeam },
        { label: 'SUPREME TALKIES TEAM', value: film.supremeTalkiesTeam },
      ].filter((c) => c.value)
  );

  const runtime = film.duration || '';

  return (
    <div className="site-page detail-page">
      <Nav scrolled={true} />
      <main>
        <section className="detail-hero">
          <img src={hero} alt={`${film.title} still`} />
          <div className="detail-overlay" />
          <div className="detail-content">
            <button type="button" className="back-link" onClick={handleBack}>
              <IconChevronLeft size={15} /> Back to films
            </button>
            <p className="eyebrow">
              {film.comingSoon ? 'COMING SOON' : 'RELEASE'} / {film.rating} / {runtime}
            </p>
            <h1>
              {film.title}<br />
              <em>{film.comingSoon ? 'soon.' : runtime.toLowerCase()}</em>
            </h1>
            <p>{film.productionNote || film.synopsis}</p>
            {film.comingSoon ? (
              <span className="primary-button" style={{ opacity: 0.6, pointerEvents: 'none' }}>Details dropping soon</span>
            ) : film.videoLink ? (
              <a className="primary-button" href={film.videoLink} target="_blank" rel="noopener noreferrer">
                <IconPlay /> Watch now
              </a>
            ) : (
              <span className="primary-button" style={{ opacity: 0.6, pointerEvents: 'none' }}>Releasing soon</span>
            )}
          </div>
          <span className="detail-vertical">DIRECTED BY {(film.director || 'SUPREME TALKIES').toUpperCase()}</span>
        </section>
        {!film.comingSoon && (
          <section className="detail-body">
            <div className="detail-body-main">
              <div className="section-line">
                <span>FILM NOTES</span>
                <span>THE FULL CUT <i /></span>
              </div>
              <h2>A small film<br /><em>with a long echo.</em></h2>
              <p>{film.synopsis}</p>
              {film.specialNote && <p>{film.specialNote}</p>}
            </div>
            <aside>
              <p className="eyebrow">CAST &amp; CREDITS</p>
              <div className="credit-set">
                <span>CREDITS</span>
                {credits.map((c) => (
                  <p key={c.label}>{c.label} <b>{c.value}</b></p>
                ))}
              </div>
              <div className="verified"><IconCheck /> RELEASE VERIFIED / SUPREME TALKIES</div>
              <Link to="/films" className="text-link" style={{ marginTop: 24 }}>All films</Link>
            </aside>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
