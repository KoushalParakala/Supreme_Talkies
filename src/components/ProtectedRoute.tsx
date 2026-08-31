import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, authSlow } = useAuth();

  if (loading) {
    return (
      <div className="dash-loading">
        <p>Loading set</p>
        <AnimatePresence>
          {authSlow && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="dash-loading-note"
            >
              Taking longer than usual… check your connection
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
