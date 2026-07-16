import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function AuthCallback() {
  const { user, profile, profileAttempted, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (user) {
      if (isAdmin) {
        navigate('/dashboard', { state: { activeRole: 'admin' }, replace: true });
      } else if (profileAttempted) {
        if (profile) {
          navigate('/dashboard', { replace: true });
        } else {
          // If profile fetch failed or doesn't exist, go to role-select to cast/complete profile setup
          navigate('/role-select', { replace: true });
        }
      }
    } else {
      // If auth exchange failed or no user is logged in
      navigate('/auth', { replace: true });
    }
  }, [user, profile, profileAttempted, isAdmin, loading, navigate]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 99998 }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', letterSpacing: 8 }}>
        AUTHENTICATING
      </motion.div>
    </div>
  );
}
