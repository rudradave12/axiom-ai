'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/shared/stores/auth-store';

export default function LoginPage(): React.JSX.Element {
  const { signInWithGoogle, signInAnonymously, error } = useAuthStore();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const handleGoogleLogin = async (): Promise<void> => {
    setLoadingGoogle(true);
    setUiError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed.';
      setUiError(msg);
      setLoadingGoogle(false);
    }
  };

  const handleGuestLogin = async (): Promise<void> => {
    setLoadingGuest(true);
    setUiError(null);
    try {
      await signInAnonymously();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Guest session failed.';
      setUiError(msg);
      setLoadingGuest(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Aurora Ambient Mesh Background */}
      <div style={styles.bgMesh} />
      
      <div style={styles.card}>
        <header style={styles.header}>
          <div style={styles.brandBadge}>AXIOM V2.0</div>
          <h1 style={styles.title}>AI Mission Operating System</h1>
          <p style={styles.subtitle}>
            Connect goals to autonomous execution pipelines. Map, execute, and evolve.
          </p>
        </header>

        {(uiError || error) && (
          <div style={styles.errorBanner} role="alert">
            <span style={{ fontWeight: 600 }}>Authorization Warning:</span> {uiError || error}
          </div>
        )}

        <div style={styles.buttonStack}>
          {/* Active OAuth Sign-Ins */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || loadingGuest}
            style={loadingGoogle ? { ...styles.buttonPrimary, opacity: 0.7 } : styles.buttonPrimary}
            aria-busy={loadingGoogle}
          >
            <span style={styles.buttonIcon}>G</span>
            {loadingGoogle ? 'Initializing Identity...' : 'Authorize with Google'}
          </button>

          <button
            onClick={handleGuestLogin}
            disabled={loadingGoogle || loadingGuest}
            style={loadingGuest ? { ...styles.buttonSecondary, opacity: 0.7 } : styles.buttonSecondary}
            aria-busy={loadingGuest}
          >
            <span style={styles.buttonIcon}>⚡</span>
            {loadingGuest ? 'Allocating Workspace...' : 'Explore as Anonymous Guest'}
          </button>

          {/* Locked / Planned OAuth Sign-Ins */}
          <div style={styles.divider}>
            <span style={styles.dividerText}>Upcoming Integrations</span>
          </div>

          <button disabled style={styles.buttonDisabled}>
            <span style={styles.buttonIconDisabled}>🪟</span>
            Connect Microsoft Account
          </button>

          <button disabled style={styles.buttonDisabled}>
            <span style={styles.buttonIconDisabled}>🐙</span>
            Connect GitHub Identity
          </button>
        </div>

        <footer style={styles.footer}>
          <p style={styles.disclaimer}>
            By entering the environment, you authorize AXIOM to allocate local storage cache and coordinate AI generative tracks.
          </p>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--sys-bg-default)',
    padding: 'var(--space-xl)',
    overflow: 'hidden',
  } as React.CSSProperties,
  bgMesh: {
    position: 'absolute',
    top: '-30%',
    left: '-20%',
    width: '140%',
    height: '140%',
    backgroundImage: 'radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 40%), radial-gradient(circle at 60% 60%, rgba(139, 92, 246, 0.06) 0%, transparent 40%)',
    animation: 'aurora 30s infinite linear',
    pointerEvents: 'none',
    zIndex: 0,
  } as React.CSSProperties,
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '440px',
    padding: 'var(--space-3xl)',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--sys-bg-surface)',
    border: '1px solid var(--sys-border-subtle)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    zIndex: 1,
    backdropFilter: 'blur(8px)',
  } as React.CSSProperties,
  header: {
    textAlign: 'center',
    marginBottom: 'var(--space-2xl)',
  } as React.CSSProperties,
  brandBadge: {
    display: 'inline-flex',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    border: '1px solid var(--sys-border-subtle)',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--sys-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 'var(--space-md)',
  } as React.CSSProperties,
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--sys-txt-primary)',
    marginBottom: 'var(--space-sm)',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--sys-txt-secondary)',
    lineHeight: 1.4,
  } as React.CSSProperties,
  errorBanner: {
    padding: 'var(--space-md) var(--space-lg)',
    backgroundColor: 'var(--sys-error-bg)',
    color: 'var(--sys-error)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    marginBottom: 'var(--space-xl)',
    border: '1px solid var(--sys-error)',
    textAlign: 'left',
    lineHeight: 1.4,
  } as React.CSSProperties,
  buttonStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
  } as React.CSSProperties,
  buttonPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-lg)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--sys-txt-primary)',
    color: 'var(--sys-bg-default)',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
  } as React.CSSProperties,
  buttonSecondary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-lg)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--sys-bg-surface)',
    color: 'var(--sys-txt-primary)',
    border: '1px solid var(--sys-border-strong)',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s, transform 0.1s',
  } as React.CSSProperties,
  buttonDisabled: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-lg)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    color: 'var(--sys-txt-muted)',
    border: '1px dashed var(--sys-border-subtle)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'not-allowed',
    opacity: 0.6,
  } as React.CSSProperties,
  buttonIcon: {
    marginRight: '8px',
    fontSize: '1rem',
    fontWeight: 700,
  } as React.CSSProperties,
  buttonIconDisabled: {
    marginRight: '8px',
    fontSize: '1rem',
    opacity: 0.4,
  } as React.CSSProperties,
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: 'var(--space-sm) 0',
  } as React.CSSProperties,
  dividerText: {
    fontSize: '0.7rem',
    color: 'var(--sys-txt-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    width: '100%',
    textAlign: 'center',
  } as React.CSSProperties,
  footer: {
    marginTop: 'var(--space-2xl)',
    textAlign: 'center',
  } as React.CSSProperties,
  disclaimer: {
    fontSize: '0.72rem',
    color: 'var(--sys-txt-muted)',
    lineHeight: 1.4,
  } as React.CSSProperties,
};
