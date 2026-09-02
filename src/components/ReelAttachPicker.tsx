import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFilms } from '../hooks/useFilms';
import { filmStill } from '../data/films';
import { IconX } from './ReelIcons';
import { errorMessage } from '../lib/errors';
import { normalizeHttpUrl, reelPreviewFromUrl } from '../lib/reelLinks';

export interface ReelDraft {
  reelFilmId?: string | null;
  externalLink?: string | null;
  title: string;
  image: string | null;
  meta?: string | null;
  internalPath?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ReelAttachPicker({
  open,
  onClose,
  onAttach,
}: {
  open: boolean;
  onClose: () => void;
  onAttach: (draft: ReelDraft) => void;
}) {
  const { films } = useFilms();
  const [tab, setTab] = useState<'house' | 'link'>('house');
  const [query, setQuery] = useState('');
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<ReelDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      setUrl('');
      setPreview(null);
      setError('');
      setTab('house');
    }
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? films.filter((f) => f.title.toLowerCase().includes(q) || f.director?.toLowerCase().includes(q))
      : films;
    return list.slice(0, 8);
  }, [films, query]);

  const attachFilm = (id: string, title: string, image: string, meta: string) => {
    if (UUID_RE.test(id)) {
      onAttach({ reelFilmId: id, title, image, meta });
    } else {
      onAttach({
        externalLink: `/film/${id}`,
        title,
        image,
        meta,
        internalPath: `/film/${id}`,
      });
    }
    onClose();
  };

  const fetchPreview = async (source?: string) => {
    const raw = (source ?? url).trim();
    if (!raw) return;
    const trimmed = normalizeHttpUrl(raw);
    const local = reelPreviewFromUrl(trimmed);
    const fallback: ReelDraft = { externalLink: local.url, title: local.title, image: local.image };
    setUrl(trimmed);
    setBusy(true);
    setError('');
    setPreview(fallback);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('link-preview', {
        body: { url: trimmed },
      });
      const remoteTitle = typeof data?.title === 'string' ? data.title.trim() : '';
      const titleLooksLikeUrl = /^https?:\/\//i.test(remoteTitle);
      if (data?.url || data?.title || data?.image) {
        setPreview({
          externalLink: data.url || trimmed,
          title: remoteTitle && !titleLooksLikeUrl ? remoteTitle : local.title,
          image: data.image || local.image,
        });
        return;
      }
      setPreview(fallback);
      if (!local.image) {
        const fromFn = typeof data?.error === 'string' ? data.error : null;
        setError(fromFn || (fnError ? errorMessage(fnError) : 'Could not fetch a preview — pin the link anyway'));
      }
    } catch (err) {
      setPreview(fallback);
      if (!local.image) setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="green-room-picker" data-lenis-prevent>
      <div className="green-room-picker-head">
        <div className="green-room-picker-tabs">
          <button type="button" className={tab === 'house' ? 'is-on' : ''} onClick={() => setTab('house')}>
            From Supreme Talkies
          </button>
          <button type="button" className={tab === 'link' ? 'is-on' : ''} onClick={() => setTab('link')}>
            Paste a link
          </button>
        </div>
        <button type="button" className="green-room-icon-btn" onClick={onClose} aria-label="Close picker">
          <IconX size={14} />
        </button>
      </div>

      {tab === 'house' && (
        <>
          <input
            className="green-room-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles"
            autoFocus
          />
          <div className="green-room-picker-list">
            {matches.length === 0 && <p className="green-room-picker-empty">No titles on that search.</p>}
            {matches.map((film) => {
              const image = filmStill(film);
              const meta = [film.comingSoon ? 'Coming soon' : 'Short', film.duration, film.director]
                .filter(Boolean)
                .join(' / ');
              return (
                <button
                  key={film.id}
                  type="button"
                  className="green-room-picker-row"
                  onClick={() => attachFilm(film.id, film.title, image, meta)}
                >
                  <img src={image} alt="" />
                  <span>
                    <strong>{film.title}</strong>
                    <small>{meta}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === 'link' && (
        <div className="green-room-link-pane">
          <input
            className="green-room-search"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text').trim();
              if (pasted) {
                setUrl(pasted);
                void fetchPreview(pasted);
              }
            }}
            placeholder="https://"
            autoFocus
          />
          <button type="button" className="dash-ghost-btn green-room-preview-btn" onClick={() => void fetchPreview()} disabled={busy || !url.trim()}>
            {busy ? 'Fetching…' : 'Fetch preview'}
          </button>
          {error && <p className="green-room-picker-error">{error}</p>}
          {preview && (
            <button
              type="button"
              className="green-room-picker-row"
              onClick={() => {
                onAttach(preview);
                onClose();
              }}
            >
              {preview.image && <img src={preview.image} alt="" />}
              <span>
                <strong>{preview.title}</strong>
                <small>Confirm this reel</small>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
