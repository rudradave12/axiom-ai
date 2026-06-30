'use client';

import React from 'react';

export function KnowledgeTabView(): React.JSX.Element {
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
        </div>
        <h2 style={styles.title}>Knowledge Graph Engine</h2>
        <p style={styles.description}>
          Semantic vectorization, autonomous concept extraction, and RAG pipelines are unlocking for AXIOM V2. The hackathon MVP operates purely on live LLM context injection without requiring persistent vector storage.
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
