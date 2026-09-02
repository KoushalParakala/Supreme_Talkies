import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isChunkError(error: Error | null) {
  const msg = error?.message || '';
  return /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(msg);
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    if (!isChunkError(error) || typeof window === 'undefined') return;
    try {
      const key = 'st-chunk-reload';
      const last = Number(sessionStorage.getItem(key) || '0');
      if (Date.now() - last < 12000) return;
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    } catch {
      /* private mode */
    }
  }

  private retry = () => {
    if (isChunkError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="crew-empty" style={{ margin: 48 }}>
          <h3>This panel hit an error</h3>
          <p>
            {isChunkError(this.state.error)
              ? 'A new build is live. Refresh to load the floor again.'
              : this.state.error?.message || 'Hard-refresh the page, then try again.'}
          </p>
          <button type="button" className="dash-ghost-btn" onClick={this.retry} style={{ marginTop: 16 }}>
            {isChunkError(this.state.error) ? 'Refresh' : 'Retry'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
