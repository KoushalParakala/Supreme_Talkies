import { FormEvent, useEffect, useRef, useState } from 'react';
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
  const { messages, reactions, loading, sendMessage, toggleReaction, emptyBuckets } = useGreenRoomMessages();
  const [body, setBody] = useState('');
  const [reel, setReel] = useState<ReelDraft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<GreenRoomMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [stuckUp, setStuckUp] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [outbound, setOutbound] = useState<string | null>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const scrollToMessage = (id: string) => {
    const node = document.getElementById(`green-room-msg-${id}`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashId(id);
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 1200);
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
                onCallback={setReplyTo}
                onReact={(kind) => void toggleReaction(message.id, kind)}
                onScrollTo={scrollToMessage}
                onOpenExternal={setOutbound}
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
      <OutboundConfirm url={outbound} open={!!outbound} onClose={() => setOutbound(null)} />
    </motion.div>
  );
}
