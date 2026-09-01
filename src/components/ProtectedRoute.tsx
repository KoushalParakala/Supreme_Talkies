import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, authSlow } = useAuth();

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99998 }}>
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', letterSpacing: 8, textTransform: 'uppercase' }}
        >
          Loading Set
        </motion.div>
        
        <AnimatePresence>
          {authSlow && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ 
                fontFamily: 'Inter, monospace', 
                fontSize: 9, 
                color: '#BCA88E', 
                letterSpacing: 2, 
                marginTop: 12,
                textAlign: 'center'
              }}
            >
              Taking longer than usual... check your connection
            </motion.p>
          )}
        </AnimatePresence>

        <div style={{ width: 40, height: 1, background: '#BCA88E', opacity: 0.2, marginTop: 24 }} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
