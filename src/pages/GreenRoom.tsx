import { FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Nav from '../components/Nav';
import MessageBubble from '../components/MessageBubble';
import ReelAttachPicker, { type ReelDraft } from '../components/ReelAttachPicker';
import OutboundConfirm from '../components/OutboundConfirm';
import { IconClapper, IconX } from '../components/ReelIcons';
import {
  useGreenRoomMessages,
  type GreenRoomMessage,
} from '../hooks/useGreenRoomMessages';
import { useAuth } from '../context/AuthContext';

export default function GreenRoom() {
  const { user } = useAuth();
  const location = useLocation();
  const {
    messages,
    reactions,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    emptyBuckets,
  } = useGreenRoomMessages();
  const [body, setBody] = useState('');
  const [reel, setReel] = useState<ReelDraft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<GreenRoomMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [stuckUp, setStuckUp] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [outbound, setOutbound] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GreenRoomMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const floorRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hashDoneRef = useRef(false);

  const scrollToBottom = (smooth = true) => {
    const el = floorRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    stickRef.current = true;
    setStuckUp(false);
  };

  useEffect(() => {
    if (stickRef.current) scrollToBottom(false);
  }, [messages.length]);

  const scrollToMessage = (id: string) => {
    const node = document.getElementById(`green-room-msg-${id}`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashId(id);
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 1200);
  };

  useEffect(() => {
    if (hashDoneRef.current || !location.hash || messages.length === 0) return;
    const raw = location.hash.replace(/^#/, '');
    const id = raw.startsWith('green-room-msg-') ? raw.slice('green-room-msg-'.length) : raw;
    if (!messages.some((m) => m.id === id)) return;
    hashDoneRef.current = true;
    stickRef.current = false;
    requestAnimationFrame(() => scrollToMessage(id));
  }, [location.hash, messages]);

  const onFloorScroll = () => {
    const el = floorRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 48;
    stickRef.current = atBottom;
    setStuckUp(!atBottom);
  };

  const resizeComposer = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!user || sending) return;
    setSending(true);
    setError('');
    const result = await sendMessage({
      body,
      reelFilmId: reel?.reelFilmId || null,
      externalLink: reel?.reelFilmId ? null : (reel?.externalLink || reel?.internalPath || null),
      externalLinkTitle: reel?.reelFilmId ? null : (reel?.title || null),
      externalLinkImage: reel?.reelFilmId ? null : (reel?.image || null),
      replyToId: replyTo?.id || null,
    });
    setSending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setBody('');
    setReel(null);
    setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    stickRef.current = true;
    requestAnimationFrame(() => scrollToBottom(true));
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    const result = await deleteMessage(pendingDelete.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPendingDelete(null);
  };

  return (
    <motion.div
      className="dash-shell site-page sub-page green-room-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Nav scrolled={true} />
      <div className="dash-body green-room-body">
        <div className="dash-masthead">
          <div className="section-line dash-section-line">
            <span>07 / THE GREEN ROOM</span>
            <span>OPEN FLOOR <i /></span>
          </div>
          <h1>The Green <em>Room</em></h1>
          <p className="dash-meta">Open floor — cast and crew</p>
        </div>

        <div className="green-room-stage">
          <div className="green-room-window">
            <div className="green-room-window-head">
              <span>THE FLOOR</span>
              <span>CAST AND CREW <i /></span>
            </div>
            <div
              className="green-room-floor"
              ref={floorRef}
              data-lenis-prevent
              onScroll={onFloorScroll}
            >
              {loading && messages.length === 0 && (
                <div className="dash-loading dash-loading-inline">
                  <p>Opening the floor…</p>
                </div>
              )}
              {!loading && messages.length === 0 && (
                <div className="crew-empty">
                  <h3>The floor is open</h3>
                  <p>First line of the day sets the tone.</p>
                </div>
              )}
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  reactions={reactions[message.id] || emptyBuckets}
                  flash={flashId === message.id}
                  mine={!!user && message.author_id === user.id}
                  onCallback={setReplyTo}
                  onReact={(kind) => void toggleReaction(message.id, kind)}
                  onScrollTo={scrollToMessage}
                  onOpenExternal={setOutbound}
                  onEdit={editMessage}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>

            {stuckUp && (
              <button type="button" className="dash-ghost-btn green-room-jump" onClick={() => scrollToBottom(true)}>
                New in the Green Room
              </button>
            )}

            <form className="green-room-composer" onSubmit={(e) => void submit(e)}>
              {replyTo && (
                <div className="green-room-reply-chip">
                  <span>
                    Callback to <b>{replyTo.author?.full_name || 'Member'}</b>
                    {replyTo.body ? ` — ${replyTo.body.slice(0, 72)}` : ''}
                  </span>
                  <button type="button" className="green-room-icon-btn" onClick={() => setReplyTo(null)} aria-label="Cancel callback">
                    <IconX size={12} />
                  </button>
                </div>
              )}
              {reel && (
                <div className="green-room-reply-chip">
                  <span>Pinned: <b>{reel.title}</b></span>
                  <button type="button" className="green-room-icon-btn" onClick={() => setReel(null)} aria-label="Remove reel">
                    <IconX size={12} />
                  </button>
                </div>
              )}
              <textarea
                ref={textareaRef}
                rows={1}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  resizeComposer();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                placeholder="Speak to the floor"
              />
              {error && <p className="green-room-picker-error">{error}</p>}
              <div className="green-room-composer-bar">
                <div className="green-room-composer-tools">
                  <button
                    type="button"
                    className="dash-ghost-btn"
                    onClick={() => setPickerOpen((v) => !v)}
                  >
                    <IconClapper size={14} /> Pin a Reel
                  </button>
                  <ReelAttachPicker
                    open={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    onAttach={setReel}
                  />
                </div>
                <button type="submit" className="primary-button" disabled={sending}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <OutboundConfirm url={outbound} open={!!outbound} onClose={() => setOutbound(null)} />
      {pendingDelete && (
        <div className="profile-modal-scrim" onClick={() => !deleting && setPendingDelete(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow" style={{ color: 'var(--vermilion)' }}>Strike the line</p>
            <h2>Delete this <em>line?</em></h2>
            <p>
              {pendingDelete.body
                ? `“${pendingDelete.body.slice(0, 140)}${pendingDelete.body.length > 140 ? '…' : ''}” comes off the floor for everyone.`
                : 'This pinned reel comes off the floor for everyone.'}
            </p>
            <div className="profile-modal-actions">
              <button type="button" className="primary-button danger-button" disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button type="button" className="dash-ghost-btn" disabled={deleting} onClick={() => setPendingDelete(null)}>
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
