import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Nav from '../components/Nav';
import { useNotifications, type AppNotification } from '../hooks/useNotifications';
import { timeAgo } from '../lib/time';

function SheetList({
  items,
  emptyTitle,
  emptyBody,
  loading,
  onOpen,
}: {
  items: AppNotification[];
  emptyTitle: string;
  emptyBody: string;
  loading: boolean;
  onOpen: (item: AppNotification) => void;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="dash-loading dash-loading-inline">
        <p>Pulling the sheet…</p>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="crew-empty">
        <h3>{emptyTitle}</h3>
        <p>{emptyBody}</p>
      </div>
    );
  }
  return (
    <div className="crew-list">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`crew-row call-sheet-row${item.read_at ? '' : ' is-unread'}`}
          onClick={() => onOpen(item)}
        >
          <div>
            <h2>{item.title}</h2>
            {item.body && <p className="call-sheet-body">{item.body}</p>}
            <p className="call-sheet-time">{timeAgo(item.created_at)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function CallSheet() {
  const navigate = useNavigate();
  const { loading, offlineItems, liveItems, markRead } = useNotifications();

  const openItem = (item: AppNotification) => {
    void markRead([item.id]);
    if (item.link) navigate(item.link);
  };

  return (
    <motion.div
      className="dash-shell site-page sub-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Nav scrolled={true} />
      <div className="dash-body">
        <div className="dash-masthead">
          <div className="section-line dash-section-line">
            <span>08 / THE CALL SHEET</span>
            <span>WHAT HAPPENED ON THE LOT <i /></span>
          </div>
          <h1>The Call <em>Sheet</em></h1>
          <p className="dash-meta">What happened on the lot. Then back to the floor.</p>
        </div>

        <section className="call-sheet-section">
          <div className="section-line">
            <span className="call-sheet-kicker">While You Were Out</span>
            <span>{String(offlineItems.length).padStart(2, '0')} NOTES</span>
          </div>
          <SheetList
            items={offlineItems}
            emptyTitle="Quiet on set"
            emptyBody="Nothing stacked up while you were away."
            loading={loading}
            onOpen={openItem}
          />
        </section>

        <section className="call-sheet-section">
          <div className="section-line">
            <span className="call-sheet-kicker">Today’s Sheet</span>
            <span>{String(liveItems.length).padStart(2, '0')} LIVE</span>
          </div>
          <SheetList
            items={liveItems}
            emptyTitle="Quiet on set"
            emptyBody="No new moves since you walked in."
            loading={loading}
            onOpen={openItem}
          />
        </section>

        <div className="dash-footer-actions">
          <button type="button" className="primary-button" onClick={() => navigate('/green-room')}>
            Open the Green Room
          </button>
          <button type="button" className="dash-ghost-btn" onClick={() => navigate('/dashboard')}>
            Craft rooms
          </button>
        </div>
      </div>
    </motion.div>
  );
}
