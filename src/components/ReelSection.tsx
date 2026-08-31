import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFilms } from '../hooks/useFilms';
import type { Film } from '../data/films';
import {
  IconArrowUpRight, IconCamera, IconClapper, IconLight, IconSeat, IconLens,
  IconChevronLeft, IconChevronRight,
} from './ReelIcons';

function filmImage(film: Film) {
  return film.reelImage || film.posterImage || film.stills?.[0] || '/hero-bg.webp';
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function useZoneProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const [inZone, setInZone] = useState(false);
  useEffect(() => {
    const update = (scrollY?: number) => {
      const el = ref.current;
      if (!el) return;
      const y = scrollY ?? window.scrollY;
      const start = el.offsetTop;
      const end = start + el.offsetHeight - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, (y - start) / Math.max(1, end - start))));
      setInZone(y >= start - 4 && y <= end + window.innerHeight * 0.12);
    };
    const onLenis = (e: Event) => update((e as CustomEvent<number>).detail);
    update();
    window.addEventListener('scroll', () => update(), { passive: true });
    window.addEventListener('lenis-scroll', onLenis);
    window.addEventListener('resize', () => update());
    return () => {
      window.removeEventListener('lenis-scroll', onLenis);
      window.removeEventListener('resize', () => update());
    };
  }, [ref]);
  return { progress, inZone };
}

function AmbientIcons() {
  return (
    <div className="ambient-icons" aria-hidden="true">
      <span className="ambient camera"><IconCamera /></span>
      <span className="ambient clap"><IconClapper /></span>
      <span className="ambient light"><IconLight /></span>
      <span className="ambient seat"><IconSeat /></span>
      <span className="ambient lens"><IconLens /></span>
      <span className="ambient plus">+</span>
    </div>
  );
}

export default function ReelSection({
  onFilmClick,
  returnFilmId,
}: {
  onFilmClick: (id: string) => void;
  returnFilmId?: string;
}) {
  const { films } = useFilms();
  const ref = useRef<HTMLElement>(null);
  const { progress, inZone } = useZoneProgress(ref);
  const steps = Math.max(1, films.length - 1);
  const reelMinHeight = `calc(100vh + ${steps * 12}vh)`;
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const last = Math.max(0, films.length - 1);
  const active = Math.min(last, Math.max(0, Math.round(progress * last + drag / 170)));
  const film = films[active] ?? films[0];

  useEffect(() => {
    if (!returnFilmId || films.length === 0 || !ref.current) return;
    const idx = films.findIndex((f) => f.id === returnFilmId);
    if (idx < 0) return;
    const top = ref.current.offsetTop + ((idx / Math.max(1, last)) * Math.max(1, ref.current.offsetHeight - window.innerHeight));
    window.dispatchEvent(new CustomEvent('lenis-scroll-to', { detail: { target: top } }));
  }, [returnFilmId, films, last]);

  const cycle = (dir: number) => {
    const target = Math.max(0, Math.min(last, active + dir));
    const el = ref.current;
    if (!el) return;
    const top = el.offsetTop + ((target / Math.max(1, last)) * Math.max(1, el.offsetHeight - window.innerHeight));
    window.dispatchEvent(new CustomEvent('lenis-scroll-to', { detail: { target: top } }));
  };

  if (!film) return null;

  return (
    <section ref={ref} id="reel-section" className="projector-zone" style={{ minHeight: reelMinHeight }}>
      <div
        className="projector-sticky"
        onPointerMove={(e) => { if (dragging) setDrag(Math.max(-125, Math.min(125, e.clientX - dragStart))); }}
        onPointerDown={(e) => { setDragging(true); setDragStart(e.clientX); setDrag(0); }}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <div className="projector-header">
          <div>
            <p className="eyebrow">01 / THE PROJECTOR ROOM</p>
            <h2>Move through<br /><em>the work.</em></h2>
          </div>
          <p className="projector-intro">
            {films.length} films. One living archive. Drag the frame, scroll the room, or choose a card.
          </p>
        </div>
        <AmbientIcons />
        <div className="projection-line">
          <span>{pad(1)}</span>
          <div><i style={{ height: `${((active + 1) / Math.max(1, films.length)) * 100}%` }} /></div>
          <span>{pad(films.length)}</span>
        </div>
        <div className="card-cluster" style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
          {films.map((item, i) => {
            const offset = i - active;
            const visible = Math.abs(offset) <= 2;
            return (
              <Link
                key={item.id}
                to={`/film/${item.id}`}
                className={`float-card ${i === active ? 'active' : ''} ${visible ? '' : 'hidden-card'}`}
                style={{
                  transform: `translate3d(calc(-50% + ${offset * 174 + drag * (offset === 0 ? .72 : .18)}px), calc(-50% + ${offset * 15}px), ${-Math.abs(offset) * 90}px) rotate(${offset * 4.5 - drag * .025}deg) scale(${1 - Math.abs(offset) * .12})`,
                  zIndex: 10 - Math.abs(offset),
                }}
                onClick={(e) => {
                  if (Math.abs(drag) > 8) e.preventDefault();
                  else onFilmClick(item.id);
                }}
              >
                <div className="float-card-image">
                  <img src={filmImage(item)} alt={`${item.title} still`} />
                  <span className="card-shade" />
                </div>
                <div className="float-card-meta">
                  <span>{pad(i + 1)} / {pad(films.length)}</span>
                  <span>{item.rating}</span>
                </div>
                <div className="float-card-copy">
                  <p>{item.comingSoon ? 'COMING SOON' : 'SHORT'} / {item.duration}</p>
                  <h3>{item.title}</h3>
                  <span>BY {(item.director || 'SUPREME TALKIES').toUpperCase()}</span>
                </div>
              </Link>
            );
          })}
        </div>
        <button type="button" className={`cluster-arrow prev${inZone ? ' is-pinned' : ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => cycle(-1)} aria-label="Previous film"><IconChevronLeft /></button>
        <button type="button" className={`cluster-arrow next${inZone ? ' is-pinned' : ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => cycle(1)} aria-label="Next film"><IconChevronRight /></button>
        <div className="projector-footer">
          <span>DRAG TO BROWSE</span>
          <span className="active-title">{film.title.toUpperCase()} / {pad(active + 1)}</span>
          <Link to={`/film/${film.id}`} className="text-link" onClick={() => onFilmClick(film.id)}>
            Open film <IconArrowUpRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
