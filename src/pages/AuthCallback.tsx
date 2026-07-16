import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function AuthCallback() {
  const { user, profile, profileAttempted, profileFetchFailed, loading, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Auth exchange failed or no user is logged in
      navigate('/auth', { replace: true });
      return;
    }

    if (isAdmin) {
      navigate('/dashboard', { state: { activeRole: 'admin' }, replace: true });
      return;
    }

    if (!profileAttempted) return;

    if (profile) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // profile is null here. Only send a user to onboarding when we've CONFIRMED
    // there's genuinely no row for them (profileFetchFailed === false means every
    // poll came back "not found", not an error/timeout). Anything else — a real
    // returning user whose fetch merely failed or timed out — must never be routed
    // into onboarding, or they'll appear to get a brand-new "fake" account.
    if (!profileFetchFailed) {
      navigate('/role-select', { replace: true });
    }
    // else: fall through to the retry UI below instead of navigating anywhere.
  }, [user, profile, profileAttempted, profileFetchFailed, isAdmin, loading, navigate]);

  const showRetry = !loading && user && profileAttempted && !profile && profileFetchFailed;

  const handleRetry = async () => {
    setRetrying(true);
    await refreshProfile();
    setRetrying(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99998, gap: 20 }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#BCA88E', letterSpacing: 8 }}>
        {showRetry ? 'COULD NOT LOAD YOUR PROFILE' : 'AUTHENTICATING'}
      </motion.div>

      {showRetry && (
        <>
          <p style={{ fontFamily: 'Inter, monospace', fontSize: 10, color: '#F0EBE0', opacity: 0.5, letterSpacing: 1, textAlign: 'center', maxWidth: 320 }}>
            You're signed in, but we couldn't load your profile — this is usually a slow connection, not a missing account.
          </p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(188,168,142,0.3)',
              color: '#BCA88E', padding: '10px 24px', fontFamily: 'Inter, monospace',
              fontSize: 9, letterSpacing: 3, cursor: retrying ? 'default' : 'pointer',
            }}
          >
            {retrying ? 'RETRYING…' : 'RETRY'}
          </button>
        </>
      )}
    </div>
  );
}
