import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
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
    console.error('Dashboard ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: 40, border: '1px solid rgba(255,77,77,0.2)', background: 'rgba(10,10,10,0.4)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#ff4d4d' }}>
            Something went wrong in this panel.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 16, background: 'none', border: '1px solid rgba(188,168,142,0.4)', color: '#BCA88E', padding: '8px 20px', fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 3, cursor: 'pointer' }}
          >
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
