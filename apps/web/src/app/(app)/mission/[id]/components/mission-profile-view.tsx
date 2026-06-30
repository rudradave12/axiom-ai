'use client';

import React, { useEffect } from 'react';
import { useIntelligenceStore } from '@/shared/stores/intelligence-store';

interface MissionProfileViewProps {
  missionId: string;
  title: string;
  goal: string;
}

export function MissionProfileView({
  missionId,
  title,
  goal,
}: MissionProfileViewProps): React.JSX.Element {
  const { profile, loading, error, subscribeToProfile, triggerAIAnalysis } =
    useIntelligenceStore();

  // Sync profile on mount
  useEffect(() => {
    const unsubscribe = subscribeToProfile(missionId);
    return (): void => {
      if (unsubscribe) unsubscribe();
    };
  }, [missionId, subscribeToProfile]);

  const handleRunAnalysis = async (): Promise<void> => {
    try {
      await triggerAIAnalysis(missionId, title, goal);
    } catch (err: unknown) {
      // Handled by store state
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h3 style={styles.title}>AI Mission Intelligence Profile</h3>
        {!profile && !loading && (
          <button onClick={handleRunAnalysis} style={styles.analyzeBtn}>
            Run AI Analysis
          </button>
        )}
      </header>

      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Gemini is analyzing goal constraints and objective requirements...</span>
        </div>
      )}

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Analysis failed: {error}</p>
          <button onClick={handleRunAnalysis} style={styles.retryBtn}>
            Retry Analysis
          </button>
        </div>
      )}

      {profile && !loading && (
        <div style={styles.profileGrid}>
          {/* Classification & Parameters */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Mission Classification</h4>
            <div style={styles.metaRow}>
              <span>Type:</span>
              <strong style={styles.metaVal}>{profile.missionType}</strong>
            </div>
            <div style={styles.metaRow}>
              <span>Domain:</span>
              <strong style={styles.metaVal}>{profile.domain}</strong>
            </div>
            <div style={styles.metaRow}>
              <span>Complexity Level:</span>
              <strong style={styles.metaVal}>{profile.complexity}</strong>
            </div>
            <div style={styles.metaRow}>
              <span>Estimated Duration:</span>
              <strong style={styles.metaVal}>{profile.estimatedDuration}</strong>
            </div>
            <div style={styles.metaRow}>
              <span>AI Confidence:</span>
              <strong style={styles.metaVal}>{profile.aiConfidence}%</strong>
            </div>
            <div style={styles.metaRow}>
              <span>Risk Level:</span>
              <strong style={styles.metaVal}>{profile.riskLevel}</strong>
            </div>
          </div>

          {/* Core Objectives */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Detected Objectives</h4>
            {profile.objectives.length === 0 ? (
              <p style={styles.emptyText}>No core objectives identified.</p>
            ) : (
              <ul style={styles.list}>
                {profile.objectives.map((o) => (
                  <li key={o.id} style={styles.listItem}>
                    <div style={styles.itemHeader}>
                      <strong style={styles.itemTitle}>{o.title}</strong>
                      <span style={styles.priorityBadge}>{o.priority}</span>
                    </div>
                    <p style={styles.itemDesc}>{o.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Constraints */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Detected Constraints</h4>
            {profile.constraints.length === 0 ? (
              <p style={styles.emptyText}>No technical or temporal constraints identified.</p>
            ) : (
              <ul style={styles.list}>
                {profile.constraints.map((c) => (
                  <li key={c.id} style={styles.listItem}>
                    <div style={styles.itemHeader}>
                      <span style={styles.constraintBadge}>{c.type}</span>
                    </div>
                    <p style={styles.itemDesc}>{c.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Missing Information & Inputs */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Missing Details & Required Inputs</h4>
            <div style={styles.sectionCol}>
              <strong style={styles.subTitle}>Required Inputs:</strong>
              {profile.requiredInputs.length === 0 ? (
                <p style={styles.emptyText}>None specified.</p>
              ) : (
                <ul style={styles.bulletList}>
                  {profile.requiredInputs.map((i, index) => (
                    <li key={index}>{i}</li>
                  ))}
                </ul>
              )}
            </div>
            <div style={styles.sectionCol}>
              <strong style={styles.subTitle}>Missing Information:</strong>
              {profile.missingInformation.length === 0 ? (
                <p style={styles.emptyText}>None identified.</p>
              ) : (
                <ul style={styles.bulletList}>
                  {profile.missingInformation.map((i, index) => (
                    <li key={index}>{i}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  title: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1a56db',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  analyzeBtn: {
    padding: '0.5rem 1.25rem',
    borderRadius: '8px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    gap: '1rem',
  } as React.CSSProperties,
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTopColor: '#1a56db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  loadingText: {
    fontSize: '0.875rem',
    color: '#4b5563',
    textAlign: 'center',
  } as React.CSSProperties,
  errorContainer: {
    backgroundColor: '#fde8e8',
    border: '1px solid #f8b4b4',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  errorText: {
    fontSize: '0.875rem',
    color: '#e02424',
    margin: 0,
  } as React.CSSProperties,
  retryBtn: {
    padding: '0.375rem 1rem',
    borderRadius: '6px',
    backgroundColor: '#e02424',
    color: '#ffffff',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1.25rem',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.5rem',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#4b5563',
  } as React.CSSProperties,
  metaVal: {
    color: '#111827',
  } as React.CSSProperties,
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  listItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #f3f4f6',
    borderRadius: '6px',
    padding: '0.75rem',
  } as React.CSSProperties,
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  itemTitle: {
    fontSize: '0.875rem',
    color: '#111827',
  } as React.CSSProperties,
  priorityBadge: {
    fontSize: '0.625rem',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontWeight: 700,
  } as React.CSSProperties,
  itemDesc: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.4,
  } as React.CSSProperties,
  constraintBadge: {
    fontSize: '0.625rem',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontWeight: 700,
  } as React.CSSProperties,
  subTitle: {
    fontSize: '0.75rem',
    color: '#4b5563',
    fontWeight: 700,
  } as React.CSSProperties,
  sectionCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  } as React.CSSProperties,
  bulletList: {
    paddingLeft: '1.25rem',
    margin: 0,
    fontSize: '0.875rem',
    color: '#4b5563',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  } as React.CSSProperties,
  emptyText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    margin: 0,
  } as React.CSSProperties,
};
