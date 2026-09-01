import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsableRoles } from '../lib/profile';

export default function AuthCallback() {
  const { user, profile, profileAttempted, profileFetchFailed, loading, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (isAdmin) {
      navigate('/call-sheet', { replace: true });
      return;
    }

    if (!profileAttempted) return;

    if (profile && getUsableRoles(profile).length > 0) {
      navigate('/call-sheet', { replace: true });
      return;
    }

    if (!profileFetchFailed) {
      navigate('/role-select', { replace: true });
    }
  }, [user, profile, profileAttempted, profileFetchFailed, isAdmin, loading, navigate]);

  const showRetry = !loading && user && profileAttempted && profileFetchFailed
    && (!profile || getUsableRoles(profile).length === 0);

  const handleRetry = async () => {
    setRetrying(true);
    await refreshProfile();
    setRetrying(false);
  };

  return (
    <div className="auth-callback">
      <p className="auth-callback-status">
        {showRetry ? 'Could not load your profile' : 'Authenticating'}
      </p>

      {showRetry && (
        <>
          <p>
            You&apos;re signed in, but we couldn&apos;t load your profile — this is usually a slow connection, not a missing account.
          </p>
          <button
            type="button"
            className="auth-callback-retry"
            onClick={handleRetry}
            disabled={retrying}
          >
            {retrying ? 'Retrying…' : 'Retry'}
          </button>
        </>
      )}
    </div>
  );
}
