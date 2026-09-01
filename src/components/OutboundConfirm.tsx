import { AnimatePresence, motion } from 'framer-motion';

export default function OutboundConfirm({
  url,
  open,
  onClose,
}: {
  url: string | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && url && (
        <motion.div
          className="profile-modal-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="profile-modal"
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow" style={{ color: 'var(--vermilion)' }}>Outside the lot</p>
            <h2>Leave the <em>lot?</em></h2>
            <p>This opens an outside link in a new tab. Stay if you meant to keep walking the floor.</p>
            <div className="profile-modal-actions">
              <a
                className="primary-button"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
              >
                Open
              </a>
              <button type="button" className="dash-ghost-btn" onClick={onClose}>
                Stay
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
