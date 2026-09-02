import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { timeAgo } from '../lib/time';
import { filmStill } from '../data/films';
import { ROLE_COLORS, type RoleColorId } from '../lib/roleColors';
import type { GreenRoomMessage, ReactionKind, ReactionBucket } from '../hooks/useGreenRoomMessages';

const REACTIONS: { kind: ReactionKind; label: string }[] = [
  { kind: 'hype', label: 'Hype 🔥' },
  { kind: 'loved', label: 'Loved ❤️' },
  { kind: 'clap', label: 'Clap 👍' },
];

function authorRoles(message: GreenRoomMessage): string[] {
  return [
    ...(Array.isArray(message.author?.roles) ? message.author!.roles : []),
    message.author?.role,
  ]
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
  if (message.reply_to?.body) return message.reply_to.body;
  if (message.reply_to?.external_link_title) return message.reply_to.external_link_title;
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body || '');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const role = authorRole(message);
  const accent = role ? ROLE_COLORS[role] : undefined;
  const name = message.author?.full_name?.trim() || 'Member';
  const initial = name.charAt(0).toUpperCase();
  const filmImage = message.film
    ? filmStill({
        reel_image: message.film.reel_image,
        poster_image: message.film.poster_image,
        stills: message.film.stills,
      })
    : message.external_link_image;
  const filmTitle = message.film?.title || message.external_link_title;
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
          <span className="float-card-image green-room-reel-still">
            <img src={filmImage} alt="" />
          </span>
        )}
        <span>
          <strong>{filmTitle}</strong>
          {filmMeta && <small>{filmMeta}</small>}
        </span>
      </Link>
    ) : (
      <button type="button" className="green-room-reel" onClick={() => externalHref && onOpenExternal(externalHref)}>
        {filmImage && (
          <span className="float-card-image green-room-reel-still">
            <img src={filmImage} alt="" />
          </span>
        )}
        <span>
          <strong>{filmTitle}</strong>
          {filmMeta && <small>{filmMeta}</small>}
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
          message.body && <p>{message.body}</p>
        )}
        {poster}
        <div className="green-room-msg-actions">
          {REACTIONS.map(({ kind, label }) => (
            <button
              key={kind}
              type="button"
              className={`green-room-rxn${reactions[kind]?.mine ? ' is-on' : ''}`}
              onClick={() => onReact(kind)}
            >
              {label}
              {reactions[kind]?.count ? <b>{reactions[kind].count}</b> : null}
            </button>
          ))}
          <button type="button" className="green-room-callback-btn" onClick={() => onCallback(message)}>
            Callback
          </button>
          {mine && !editing && (
            <button type="button" className="green-room-own-btn" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          {(mine || isAdmin) && !editing && (
            <button type="button" className="green-room-own-btn is-danger" onClick={() => onDelete(message)}>
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
