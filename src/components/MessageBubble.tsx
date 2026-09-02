import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { timeAgo } from '../lib/time';
import { filmStill } from '../data/films';
import { ROLE_COLORS, roleColor, type RoleColorId } from '../lib/roleColors';
import { useTheme } from '../context/ThemeContext';
import { displayReelTitle, reelPreviewFromUrl } from '../lib/reelLinks';
import { displayText } from '../lib/errors';
import { IconPencil, IconReply, IconTrash } from './ReelIcons';
import type { GreenRoomMessage, ReactionKind, ReactionBucket } from '../hooks/useGreenRoomMessages';

const REACTIONS: { kind: ReactionKind; mark: string; word: string }[] = [
  { kind: 'hype', mark: '🔥', word: 'Hype' },
  { kind: 'loved', mark: '❤️', word: 'Loved' },
  { kind: 'clap', mark: '👏', word: 'Clap' },
];

function authorRoles(message: GreenRoomMessage): string[] {
  const raw: unknown = message.author?.roles;
  const listed = Array.isArray(raw)
    ? raw.filter((r): r is string => typeof r === 'string')
    : typeof raw === 'string' && raw.trim()
      ? [raw]
      : [];
  return [...listed, message.author?.role]
    .filter((r): r is string => typeof r === 'string' && r.length > 0)
    .map((r) => r.toLowerCase());
}

function authorIsAdmin(message: GreenRoomMessage): boolean {
  return authorRoles(message).includes('admin');
}

function authorRole(message: GreenRoomMessage): RoleColorId | null {
  for (const role of authorRoles(message)) {
    if (role === 'admin') continue;
    if (role in ROLE_COLORS) return role as RoleColorId;
  }
  return null;
}

function quoteText(message: GreenRoomMessage): string {
  const body = displayText(message.reply_to?.body);
  if (body) return body;
  const title = displayText(message.reply_to?.external_link_title);
  if (title) return title;
  return 'Earlier on the floor';
}

function isInternalPath(href: string | null | undefined): href is string {
  return !!href && href.startsWith('/');
}

export default function MessageBubble({
  message,
  reactions,
  flash,
  mine,
  onCallback,
  onReact,
  onScrollTo,
  onOpenExternal,
  onEdit,
  onDelete,
  isAdmin = false,
}: {
  message: GreenRoomMessage;
  reactions: Record<ReactionKind, ReactionBucket>;
  flash: boolean;
  mine: boolean;
  onCallback: (message: GreenRoomMessage) => void;
  onReact: (kind: ReactionKind) => void;
  onScrollTo: (id: string) => void;
  onOpenExternal: (url: string) => void;
  onEdit: (id: string, body: string) => Promise<{ error: string | null }>;
  onDelete: (message: GreenRoomMessage) => void;
  isAdmin?: boolean;
}) {
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body || '');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const role = authorRole(message);
  const accent = role ? roleColor(role, theme) : undefined;
  const name = displayText(message.author?.full_name, 'Member').trim() || 'Member';
  const initial = name.charAt(0).toUpperCase();
  const derivedReel =
    !message.film && message.external_link && /^https?:\/\//i.test(message.external_link)
      ? reelPreviewFromUrl(message.external_link)
      : null;
  const filmImage = message.film
    ? filmStill({
        reel_image: message.film.reel_image,
        poster_image: message.film.poster_image,
        stills: message.film.stills,
      })
    : message.external_link_image || derivedReel?.image || null;
  const filmTitle = message.film?.title || displayReelTitle(message.external_link_title, message.external_link);
  const filmMeta = message.film
    ? [message.film.coming_soon ? 'Coming soon' : 'Short', message.film.duration, message.film.director]
        .filter(Boolean)
        .join(' / ')
    : message.external_link
      ? 'Pinned reel'
      : '';
  const internalHref = message.reel_film_id
    ? `/film/${message.reel_film_id}`
    : isInternalPath(message.external_link)
      ? message.external_link
      : null;
  const externalHref = !internalHref && message.external_link ? message.external_link : null;

  useEffect(() => {
    if (!editing) setDraft(message.body || '');
  }, [message.body, editing]);

  const saveEdit = async () => {
    setSaving(true);
    setEditError('');
    const result = await onEdit(message.id, draft);
    setSaving(false);
    if (result.error) {
      setEditError(result.error);
      return;
    }
    setEditing(false);
  };

  const poster = (filmTitle || filmImage) && (
    internalHref ? (
      <Link to={internalHref} className="green-room-reel">
        {filmImage && (
          <span className="green-room-reel-still">
            <img src={filmImage} alt="" />
          </span>
        )}
        <span className="green-room-reel-copy">
          <strong>{displayText(filmTitle)}</strong>
          {filmMeta && <small>{displayText(filmMeta)}</small>}
        </span>
      </Link>
    ) : (
      <button
        type="button"
        className={`green-room-reel${filmImage ? ' is-screen' : ''}`}
        onClick={() => externalHref && onOpenExternal(externalHref)}
      >
        {filmImage && (
          <span className="green-room-reel-screen">
            <img src={filmImage} alt="" />
          </span>
        )}
        <span className="green-room-reel-copy">
          <strong>{displayText(filmTitle)}</strong>
          {filmMeta && <small>{displayText(filmMeta)}</small>}
        </span>
      </button>
    )
  );

  return (
    <article
      id={`green-room-msg-${message.id}`}
      className={`green-room-msg${flash ? ' is-flash' : ''}${mine ? ' is-mine' : ''}`}
      style={accent ? { ['--role-accent' as string]: accent } : undefined}
    >
      <div className="crew-avatar">
        {message.author?.avatar_url ? (
          <img src={message.author.avatar_url} alt="" />
        ) : (
          initial
        )}
      </div>
      <div className="green-room-msg-body">
        <div className="green-room-msg-top">
          <strong>{name}</strong>
          {authorIsAdmin(message) && <span className="green-room-admin">ADMIN</span>}
          {role && <i className="green-room-role-dot" aria-hidden="true" />}
          <small className="green-room-time">
            {timeAgo(message.created_at)}
            {message.edited_at ? ' · EDITED' : ''}
          </small>
        </div>
        {message.reply_to_id && (
          <button
            type="button"
            className="green-room-callback"
            onClick={() => onScrollTo(message.reply_to_id!)}
          >
            <span>Callback</span>
            <em>{quoteText(message)}</em>
          </button>
        )}
        {editing ? (
          <div className="green-room-edit">
            <textarea
              value={draft}
              rows={3}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            {editError && <p className="green-room-picker-error">{editError}</p>}
            <div className="green-room-edit-actions">
              <button type="button" className="primary-button" disabled={saving} onClick={() => void saveEdit()}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="dash-ghost-btn"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setEditError('');
                  setDraft(message.body || '');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          message.body && <p>{displayText(message.body)}</p>
        )}
        {poster}
        <div className="green-room-msg-actions">
          <div className="green-room-rxn-row">
            {REACTIONS.map(({ kind, mark, word }) => (
              <button
                key={kind}
                type="button"
                className={`green-room-rxn${reactions[kind]?.mine ? ' is-on' : ''}`}
                onClick={() => onReact(kind)}
                aria-label={word}
              >
                <span className="green-room-rxn-mark" aria-hidden="true">{mark}</span>
                <span className="green-room-rxn-word">{word}</span>
                {reactions[kind]?.count ? <b>{reactions[kind].count}</b> : null}
              </button>
            ))}
          </div>
          <div className="green-room-msg-tools">
            <button type="button" className="green-room-tool-btn" onClick={() => onCallback(message)} aria-label="Reply">
              <IconReply size={15} />
            </button>
            {mine && !editing && (
              <button type="button" className="green-room-tool-btn" onClick={() => setEditing(true)} aria-label="Edit">
                <IconPencil size={15} />
              </button>
            )}
            {(mine || isAdmin) && !editing && (
              <button type="button" className="green-room-tool-btn is-danger" onClick={() => onDelete(message)} aria-label="Delete">
                <IconTrash size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
