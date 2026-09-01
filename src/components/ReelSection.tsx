import { useEffect, useRef, useState, type ComponentType } from 'react';
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
    const onScroll = () => update();
    const onResize = () => update();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('lenis-scroll', onLenis);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('lenis-scroll', onLenis);
      window.removeEventListener('resize', onResize);
    };
  }, [ref]);
  return { progress, inZone };
}

const FLOATERS: { className: string; Icon?: ComponentType<{ size?: number }> }[] = [
  { className: 'camera', Icon: IconCamera },
  { className: 'clap', Icon: IconClapper },
  { className: 'light', Icon: IconLight },
  { className: 'seat', Icon: IconSeat },
  { className: 'lens', Icon: IconLens },
  { className: 'plus' },
];

function AmbientIcons({ hostRef }: { hostRef: React.RefObject<HTMLElement | null> }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef(FLOATERS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, rot: 0 })));
  const mouseRef = useRef({ x: -4000, y: -4000 });
  const nodeRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (reduced || !fine) return;

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouseRef.current = { x: -4000, y: -4000 };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    let raf = 0;
    let running = false;
    const avoidEls: Element[] = [];

    const collectAvoid = () => {
      const host = hostRef.current;
      avoidEls.length = 0;
      if (!host) return;
      host.querySelectorAll('.card-cluster, .projector-header, .projector-footer, .cluster-arrow, .projection-line').forEach((el) => avoidEls.push(el));
    };

    const tick = (now: number) => {
      if (!running) return;
      const wrap = wrapRef.current;
      if (!wrap) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const wrapBox = wrap.getBoundingClientRect();
      const obstacles = avoidEls.map((el) => el.getBoundingClientRect());
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      nodeRef.current.forEach((node, i) => {
        if (!node) return;
        const body = motionRef.current[i];
        const box = node.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;

        body.vx += Math.sin(now * 0.00022 + i * 1.7) * 0.014;
        body.vy += Math.cos(now * 0.00018 + i * 2.05) * 0.012;

        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 88) {
          const push = ((88 - dist) / 88) ** 2 * 1.35;
          body.vx -= (dx / dist) * push;
          body.vy -= (dy / dist) * push;
          body.rot += (-dy / dist) * push * 0.35;
        }

        for (let a = 0; a < obstacles.length; a += 1) {
          const rect = obstacles[a];
          const ox = cx - (rect.left + rect.width / 2);
          const oy = cy - (rect.top + rect.height / 2);
          const hw = rect.width / 2 + 20;
          const hh = rect.height / 2 + 20;
          const nx = ox / hw;
          const ny = oy / hh;
          const d2 = nx * nx + ny * ny;
          if (d2 < 1 && d2 > 0.0001) {
            const d = Math.sqrt(d2);
            const push = (1 - d) * 0.22;
            body.vx += (nx / d) * push;
            body.vy += (ny / d) * push;
          }
        }

        const margin = 18;
        if (cx < wrapBox.left + margin) body.vx += 0.08;
        if (cx > wrapBox.right - margin) body.vx -= 0.08;
        if (cy < wrapBox.top + margin) body.vy += 0.08;
        if (cy > wrapBox.bottom - margin) body.vy -= 0.08;

        body.vx *= 0.994;
        body.vy *= 0.994;
        body.x += body.vx;
        body.y += body.vy;
        body.rot += body.vx * 0.05;
        body.rot *= 0.992;

        node.style.transform = `translate3d(${body.x.toFixed(2)}px, ${body.y.toFixed(2)}px, 0) rotate(${body.rot.toFixed(2)}deg)`;
      });
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      const next = !!entry?.isIntersecting;
      if (next && !running) {
        running = true;
        collectAvoid();
        raf = requestAnimationFrame(tick);
      } else if (!next && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }, { rootMargin: '80px' });

    if (wrapRef.current) io.observe(wrapRef.current);
    collectAvoid();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [hostRef]);

  return (
    <div className="ambient-icons" ref={wrapRef} aria-hidden="true">
      {FLOATERS.map((item, i) => (
        <span
          key={item.className}
          className={`ambient ${item.className}`}
          ref={(el) => { nodeRef.current[i] = el; }}
        >
          {item.Icon ? <item.Icon size={28} /> : '+'}
        </span>
      ))}
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
  const stickyRef = useRef<HTMLDivElement>(null);
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
    <section ref={ref} id="reel-section" className="projector-zone" style={{ minHeight: reelMinHeight, background: 'var(--paper-2)' }}>
      <div
        ref={stickyRef}
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
        <AmbientIcons hostRef={stickyRef} />
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
