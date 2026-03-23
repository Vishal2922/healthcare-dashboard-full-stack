import React from 'react';

/**
 * ErrorBoundary — catches any render/lifecycle error in its child tree.
 *
 * Usage (automatically wraps every page via AppRouter):
 *   <ErrorBoundary pageName="Billing">
 *     <InvoicePage />
 *   </ErrorBoundary>
 *
 * Also re-exported as withErrorBoundary(Component, pageName) HOC.
 */

const STYLES = {
  wrapper: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    fontFamily: "'DM Sans', sans-serif",
  },
  box: {
    maxWidth: 520,
    width: '100%',
    background: '#fff',
    border: '1.5px solid #fecdd3',
    borderRadius: 16,
    padding: '36px 40px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 13,
    background: '#fff1f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    marginBottom: 20,
  },
  title: {
    margin: '0 0 8px',
    fontSize: 18,
    fontWeight: 700,
    color: '#0e1b2a',
    fontFamily: "'DM Sans', sans-serif",
  },
  subtitle: {
    margin: '0 0 20px',
    fontSize: 14,
    color: '#718096',
    lineHeight: 1.6,
  },
  detail: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 24,
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: 12,
    color: '#c53030',
    wordBreak: 'break-word',
    maxHeight: 120,
    overflowY: 'auto',
  },
  actions: {
    display: 'flex',
    gap: 10,
  },
  btnPrimary: {
    flex: 1,
    height: 40,
    background: '#0e1b2a',
    color: '#fff',
    border: 'none',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.15s',
  },
  btnSecondary: {
    flex: 1,
    height: 40,
    background: '#f7f9fb',
    color: '#4a5568',
    border: '1.5px solid #e2e8f0',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  pageBadge: {
    display: 'inline-block',
    marginBottom: 16,
    background: '#fff1f2',
    color: '#be123c',
    border: '1px solid #fecdd3',
    borderRadius: 20,
    padding: '3px 11px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError:  false,
      error:     null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console — wire to a real logger (Sentry, etc.) here if needed
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, pageName } = this.props;

    if (!hasError) return children;

    const errorMessage = error?.message || 'An unexpected error occurred.';
    const componentStack = errorInfo?.componentStack || '';

    return (
      <div style={STYLES.wrapper}>
        <div style={STYLES.box}>
          <div style={STYLES.iconWrap}>⚠️</div>

          {pageName && (
            <div style={STYLES.pageBadge}>{pageName}</div>
          )}

          <h2 style={STYLES.title}>Something went wrong</h2>
          <p style={STYLES.subtitle}>
            This section encountered an unexpected error. You can try reloading
            the page or navigating back to the dashboard.
          </p>

          <div style={STYLES.detail}>
            <strong>Error:</strong> {errorMessage}
            {componentStack && (
              <div style={{ marginTop: 6, color: '#718096', fontSize: 11 }}>
                {componentStack.trim().split('\n').slice(0, 4).join('\n')}
              </div>
            )}
          </div>

          <div style={STYLES.actions}>
            <button style={STYLES.btnPrimary} onClick={this.handleReload}>
              Reload Page
            </button>
            <button style={STYLES.btnSecondary} onClick={this.handleReset}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * HOC convenience wrapper:
 *   const SafeComponent = withErrorBoundary(MyComponent, 'My Page');
 */
export function withErrorBoundary(Component, pageName) {
  const displayName = pageName || Component.displayName || Component.name || 'Component';
  function WrappedWithBoundary(props) {
    return (
      <ErrorBoundary pageName={displayName}>
        <Component {...props} />
      </ErrorBoundary>
    );
  }
  WrappedWithBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WrappedWithBoundary;
}

export default ErrorBoundary;