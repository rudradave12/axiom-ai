'use client';

import React from 'react';

export function FilesTabView(): React.JSX.Element {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.iconWrapper}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--sys-txt-secondary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h2 style={styles.title}>Secure Storage & Attachments</h2>
        <p style={styles.description}>
          End-to-end encrypted file uploads, PDF processing, and asset management are currently unlocking for AXIOM V2. For the hackathon MVP, AXIOM relies strictly on the AI Engine and Firestore to ensure maximum speed and zero dependencies on external buckets.
        </p>
        <div style={styles.badge}>Coming Soon in V2</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '400px',
    padding: '2rem',
    textAlign: 'center',
  },
  content: {
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
  },
  iconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    backgroundColor: 'var(--sys-bg-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    border: '1px solid var(--sys-border-light)',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--sys-txt-primary)',
    letterSpacing: '-0.02em',
  },
  description: {
    margin: 0,
    fontSize: '1rem',
    lineHeight: 1.6,
    color: 'var(--sys-txt-secondary)',
  },
  badge: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '100px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--sys-txt-primary)',
    fontSize: '0.875rem',
    fontWeight: 500,
    border: '1px solid var(--sys-border-light)',
    letterSpacing: '0.02em',
  },
};
