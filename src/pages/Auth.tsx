import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getUsableRoles } from '../lib/profile';
import { IconMoveRight } from '../components/ReelIcons';
import ThemeToggle from '../components/ThemeToggle';

function AuthField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <label className={`auth-field${error ? ' has-error' : ''}`}>
      <span>
        {label}
        {error && <em>{error}</em>}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function AuthSubmit({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      className="primary-button auth-submit"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="auth-spinner" aria-hidden="true" />}
      {children}
      {!loading && <IconMoveRight size={13} />}
    </button>
  );
}

export default function Auth() {
  const { user, profile, loading: authLoading, profileAttempted, profileFetchFailed, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  useEffect(() => {
    if ((location.state as Record<string, unknown>)?.mode === 'signup') setMode('signup');
  }, [location.state]);

  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      if (isAdmin) navigate('/dashboard', { state: { activeRole: 'admin' } });
      else if (profileAttempted && profile && getUsableRoles(profile).length > 0) navigate('/dashboard', { replace: true });
      else if (profileAttempted && !profileFetchFailed) navigate('/role-select', { replace: true });
    }
  }, [authLoading, user, profile, profileAttempted, profileFetchFailed, isAdmin, navigate]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  const validateLogin = () => {
    const e: Record<string, string> = {};
    if (!loginEmail.includes('@')) e.email = 'invalid email';
    if (loginPassword.length < 6) e.password = 'min 6 chars';
    return e;
  };

  const validateSignup = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'required';
    if (!signupEmail.includes('@')) e.email = 'invalid email';
    if (signupPassword.length < 6) e.password = 'min 6 chars';
    return e;
  };

  const handleLogin = async () => {
    const errs = validateLogin();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({}); setLoading(true); setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (signInError) throw signInError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    const errs = validateSignup();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({}); setLoading(true); setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { data: { full_name: fullName.trim() } },
      });
      if (signUpError) throw signUpError;
      if (!data.user) setError('Check your email to confirm your account.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.includes('@')) { setFieldErrors({ forgotEmail: 'invalid email' }); return; }
    setFieldErrors({}); setLoading(true); setError('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (resetError) throw resetError;
      setResetSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally { setLoading(false); }
  };

  const switchMode = (next: 'login' | 'signup' | 'forgot') => {
    setMode(next);
    setError('');
    setFieldErrors({});
    setResetSuccess(false);
  };

  return (
    <div className="auth-page">
      <ThemeToggle className="nav-bubble auth-theme-toggle" />
      <button type="button" className="auth-back text-link" onClick={() => navigate('/')}>
        ← Home
      </button>

      <div className="auth-layout">
        <aside className="auth-aside" aria-hidden="true">
          <div className="auth-aside-logo">
            <img src="/logo-main.webp" alt="Supreme Talkies" />
          </div>
          <p className="eyebrow">ENTRY / THE PROJECTOR ROOM</p>
          <h1>
            Step into
            <br />
            <em>the reel.</em>
          </h1>
          <p className="auth-aside-copy">
            Writers, producers, technicians, marketers — one room for films that need to be made together.
          </p>
        </aside>

        <main className="auth-main" data-lenis-prevent>
          <div className="auth-card">
            <div className="auth-card-head">
              <span>
                {mode === 'login' && '01 / SIGN IN'}
                {mode === 'signup' && '02 / JOIN THE ROOM'}
                {mode === 'forgot' && '03 / RECOVERY'}
              </span>
              <span>NO SMALL ROLES <i /></span>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.div
                  key="login"
                  className="auth-panel"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.32 }}
                >
                  <div className="auth-heading">
                    <h2>
                      Get back
                      <br />
                      <em>inside.</em>
                    </h2>
                    <p>The set is waiting.</p>
                  </div>
                  <form
                    className="auth-form"
                    onSubmit={(e: FormEvent) => { e.preventDefault(); handleLogin(); }}
                  >
                    <AuthField
                      label="Email"
                      type="email"
                      placeholder="you@domain.com"
                      value={loginEmail}
                      onChange={setLoginEmail}
                      error={fieldErrors.email}
                    />
                    <AuthField
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={setLoginPassword}
                      error={fieldErrors.password}
                    />
                    <button type="button" className="auth-inline-link" onClick={() => switchMode('forgot')}>
                      Forgot password?
                    </button>
                    {error && <p className="auth-error">{error}</p>}
                    <AuthSubmit onClick={handleLogin} loading={loading} disabled={loading}>
                      {loading ? 'Processing' : 'Access the set'}
                    </AuthSubmit>
                  </form>
                  <div className="auth-divider">
                    <span>Or continue with</span>
                  </div>
                  <button
                    type="button"
                    className="auth-oauth"
                    onClick={() => supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback`,
                        queryParams: { prompt: 'select_account' },
                      },
                    })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                </motion.div>
              ) : mode === 'signup' ? (
                <motion.div
                  key="signup"
                  className="auth-panel"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.32 }}
                >
                  <div className="auth-heading">
                    <h2>
                      Join
                      <br />
                      <em>the room.</em>
                    </h2>
                    <p>Name and email now. Finish your profile later for SUPR Verified.</p>
                  </div>
                  <form
                    className="auth-form"
                    onSubmit={(e: FormEvent) => { e.preventDefault(); handleSignup(); }}
                  >
                    <AuthField label="Full name" placeholder="Your name" value={fullName} onChange={setFullName} error={fieldErrors.fullName} />
                    <AuthField label="Email" type="email" placeholder="you@domain.com" value={signupEmail} onChange={setSignupEmail} error={fieldErrors.email} />
                    <AuthField label="Password" type="password" placeholder="Min 6 characters" value={signupPassword} onChange={setSignupPassword} error={fieldErrors.password} />
                    {error && <p className="auth-error">{error}</p>}
                    <AuthSubmit onClick={handleSignup} loading={loading} disabled={loading}>
                      {loading ? 'Processing' : 'Get on board'}
                    </AuthSubmit>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="forgot"
                  className="auth-panel"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.32 }}
                >
                  {resetSuccess ? (
                    <div className="auth-success">
                      <h2>Check your inbox</h2>
                      <p>We&apos;ve sent a reset link to {forgotEmail}.</p>
                      <button type="button" className="auth-inline-link" onClick={() => switchMode('login')}>
                        ← Back to sign in
                      </button>
                    </div>
                  ) : (
                    <form
                      className="auth-form"
                      onSubmit={(e: FormEvent) => { e.preventDefault(); handleForgotPassword(); }}
                    >
                      <div className="auth-heading">
                        <h2>
                          Lost
                          <br />
                          <em>the key?</em>
                        </h2>
                        <p>We&apos;ll send a recovery link to your email.</p>
                      </div>
                      <AuthField
                        label="Recovery email"
                        type="email"
                        placeholder="you@domain.com"
                        value={forgotEmail}
                        onChange={setForgotEmail}
                        error={fieldErrors.forgotEmail}
                      />
                      {error && <p className="auth-error">{error}</p>}
                      <AuthSubmit onClick={handleForgotPassword} loading={loading} disabled={loading}>
                        {loading ? 'Sending…' : 'Send reset link'}
                      </AuthSubmit>
                      <button type="button" className="auth-inline-link auth-inline-link-center" onClick={() => switchMode('login')}>
                        ← Back to sign in
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {mode !== 'forgot' && (
              <div className="auth-switch">
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                >
                  {mode === 'login' ? 'No pass? Join the room →' : '← Already in the reel?'}
                </button>
                <p>{mode === 'login' ? 'Become part of the production.' : 'Return to the screening.'}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
