'use client';

import React, { useEffect, useState } from 'react';

interface SplashSequenceProps {
  onComplete: () => void;
}

const STEPS = [
  'Allocating secure sandbox memory...',
  'Connecting AI Generative Copilot gateway...',
  'Retrieving Firestore index collections...',
  'Prerendering local timeline models...',
  'Initializing Mission Control Command Center...',
];

export function SplashSequence({ onComplete }: SplashSequenceProps): React.JSX.Element {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Increment progress and step indices sequentially over 2.2 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 300);
          return 100;
        }
        
        // Calculate which step index should show based on progress
        const nextProgress = prev + 5;
        const targetStep = Math.min(
          Math.floor((nextProgress / 100) * STEPS.length),
          STEPS.length - 1
        );
        setCurrentStepIndex(targetStep);
        return nextProgress;
      });
    }, 100);

    return (): void => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={styles.container}>
      <div style={styles.consoleWrapper}>
        {/* Terminal Header */}
        <div style={styles.consoleHeader}>
          <div style={styles.dots}>
            <span style={{ ...styles.dot, backgroundColor: '#f43f5e' }} />
            <span style={{ ...styles.dot, backgroundColor: '#eab308' }} />
            <span style={{ ...styles.dot, backgroundColor: '#10b981' }} />
          </div>
          <span style={styles.headerTitle}>AXIOM_INITIALIZER.SH</span>
        </div>

        {/* Console Body */}
        <div style={styles.consoleBody}>
          <div style={styles.logoRow}>
            <span style={styles.logoBadge}>OS V2.0</span>
            <h2 style={styles.logoText}>AXIOM</h2>
          </div>

          <div style={styles.statusCol}>
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isActive = idx === currentStepIndex;
              
              return (
                <div
                  key={step}
                  style={{
                    ...styles.stepRow,
                    opacity: isDone || isActive ? 1 : 0.3,
                    color: isDone ? 'var(--sys-success)' : isActive ? 'var(--sys-primary)' : 'var(--sys-txt-secondary)',
                  }}
                >
                  <span style={styles.stepPrefix}>{isDone ? '✓' : isActive ? '▶' : '○'}</span>
                  <span>{step}</span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div style={styles.progressRow}>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
            </div>
            <span style={styles.progressPct}>{progress}%</span>
          </div>

          <footer style={styles.footerText}>
            SYSTEM READINESS STATE: {(progress === 100) ? 'OPTIMAL' : 'INITIALIZING...'}
          </footer>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b', // Deep NASA black space
    padding: '24px',
    zIndex: 9999,
  } as React.CSSProperties,
  consoleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '540px',
    backgroundColor: '#18181b', // Surface dark
    border: '1px solid rgba(63, 63, 70, 0.4)',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    animation: 'cmd-open 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  } as React.CSSProperties,
  consoleHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#09090b',
    borderBottom: '1px solid rgba(63, 63, 70, 0.4)',
  } as React.CSSProperties,
  dots: {
    display: 'flex',
    gap: '6px',
  } as React.CSSProperties,
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  } as React.CSSProperties,
  headerTitle: {
    marginLeft: '16px',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    color: '#a1a1aa',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  consoleBody: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  } as React.CSSProperties,
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  logoBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  } as React.CSSProperties,
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '-0.025em',
    margin: 0,
  } as React.CSSProperties,
  statusCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minHeight: '140px',
    justifyContent: 'center',
  } as React.CSSProperties,
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-mono)',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  stepPrefix: {
    width: '12px',
    textAlign: 'center',
    fontWeight: 700,
  } as React.CSSProperties,
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '8px',
  } as React.CSSProperties,
  progressBarBg: {
    flex: 1,
    height: '6px',
    backgroundColor: '#27272a',
    borderRadius: '9999px',
    overflow: 'hidden',
  } as React.CSSProperties,
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6', // sys-primary in dark
    borderRadius: '9999px',
    transition: 'width 0.1s linear',
  } as React.CSSProperties,
  progressPct: {
    fontSize: '0.8rem',
    fontFamily: 'var(--font-mono)',
    color: '#f8fafc',
    minWidth: '32px',
    textAlign: 'right',
  } as React.CSSProperties,
  footerText: {
    fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
    color: '#52525b',
    textAlign: 'center',
    letterSpacing: '0.05em',
    borderTop: '1px dashed #27272a',
    paddingTop: '16px',
  } as React.CSSProperties,
};
