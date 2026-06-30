'use client';

import React, { useEffect } from 'react';
import { usePlannerStore } from '@/shared/stores/planner-store';
import { useIntelligenceStore } from '@/shared/stores/intelligence-store';

interface MissionRoadmapViewProps {
  missionId: string;
}

export function MissionRoadmapView({ missionId }: MissionRoadmapViewProps): React.JSX.Element {
  const { roadmap, loading, error, subscribeToRoadmap, triggerAIRoadmap } =
    usePlannerStore();
  const { profile } = useIntelligenceStore();

  // Sync roadmap on mount
  useEffect(() => {
    const unsubscribe = subscribeToRoadmap(missionId);
    return (): void => {
      if (unsubscribe) unsubscribe();
    };
  }, [missionId, subscribeToRoadmap]);

  const handleGenerateRoadmap = async (): Promise<void> => {
    try {
      await triggerAIRoadmap(missionId);
    } catch (err: unknown) {
      // Handled by store state
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h3 style={styles.title}>AI Mission Planner Roadmap</h3>
        {!roadmap && !loading && (
          <button
            onClick={handleGenerateRoadmap}
            disabled={!profile}
            style={profile ? styles.generateBtn : styles.disabledBtn}
            title={profile ? 'Generate Roadmap' : 'Understand the mission first'}
          >
            Generate Roadmap
          </button>
        )}
      </header>

      {!profile && (
        <div style={styles.emptyState}>
          Please run AI Mission Analysis first. The AI Planner requires a completed Mission Profile context to generate a roadmap.
        </div>
      )}

      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Gemini is partitioning objectives and mapping milestones dependencies...</span>
        </div>
      )}

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Generation failed: {error}</p>
          <button onClick={handleGenerateRoadmap} style={styles.retryBtn}>
            Retry Roadmap
          </button>
        </div>
      )}

      {roadmap && !loading && (
        <div style={styles.roadmapGrid}>
          {/* Timeline Phases */}
          <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <h4 style={styles.cardTitle}>Structured Phases & Milestones</h4>
            {roadmap.phases.length === 0 ? (
              <p style={styles.emptyText}>No phases structured.</p>
            ) : (
              <div style={styles.phasesTimeline}>
                {roadmap.phases
                  .sort((a, b) => a.order - b.order)
                  .map((phase) => (
                    <div key={phase.id} style={styles.phaseBlock}>
                      <div style={styles.phaseHeader}>
                        <div style={styles.phaseOrderCircle}>{phase.order}</div>
                        <div style={styles.phaseMetaCol}>
                          <strong style={styles.phaseTitleText}>{phase.title}</strong>
                          <span style={styles.phaseDesc}>{phase.description}</span>
                          <span style={styles.phaseEstimate}>
                            Duration: {phase.estimatedDuration} • Effort: {phase.estimatedEffort}
                          </span>
                        </div>
                      </div>

                      {/* Phase Milestones */}
                      <div style={styles.milestonesCol}>
                        <strong style={styles.milestonesSubtitle}>Phase Milestones:</strong>
                        {phase.milestoneIds.length === 0 ? (
                          <span style={styles.emptyMilestones}>No milestones link.</span>
                        ) : (
                          <div style={styles.milestonesGrid}>
                            {phase.milestoneIds.map((mId) => {
                              const milestone = roadmap.milestones.find((m) => m.id === mId);
                              if (!milestone) return null;
                              return (
                                <div key={milestone.id} style={styles.milestoneItem}>
                                  <strong style={styles.milestoneTitle}>{milestone.title}</strong>
                                  <p style={styles.milestoneDesc}>{milestone.description}</p>
                                  <span style={styles.milestoneCriteria}>
                                    Success Metric: {milestone.successCriteria}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Success Criteria Metrics */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Success Criteria Targets</h4>
            {roadmap.successCriteria.length === 0 ? (
              <p style={styles.emptyText}>None defined.</p>
            ) : (
              <ul style={styles.successList}>
                {roadmap.successCriteria.map((c) => (
                  <li key={c.id} style={styles.successItem}>
                    <span>Metric:</span>
                    <strong style={styles.successVal}>{c.metric}</strong>
                    <span>Target:</span>
                    <strong style={styles.successVal}>{c.target}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Prerequisites & Required Resources */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Prerequisites & Required Resources</h4>
            <div style={styles.sectionCol}>
              <strong style={styles.subTitle}>Required Resources:</strong>
              {roadmap.requiredResources.length === 0 ? (
                <p style={styles.emptyText}>None specified.</p>
              ) : (
                <ul style={styles.bulletList}>
                  {roadmap.requiredResources.map((r, index) => (
                    <li key={index}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
            <div style={styles.sectionCol}>
              <strong style={styles.subTitle}>Prerequisites:</strong>
              {roadmap.prerequisites.length === 0 ? (
                <p style={styles.emptyText}>None specified.</p>
              ) : (
                <ul style={styles.bulletList}>
                  {roadmap.prerequisites.map((p, index) => (
                    <li key={index}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Risk Summary */}
          <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <h4 style={styles.cardTitle}>Execution Risks Summary</h4>
            <p style={styles.riskText}>{roadmap.riskSummary}</p>
            <div style={styles.confidenceRow}>
              <span>Planner AI Confidence:</span>
              <strong>{roadmap.plannerConfidence}%</strong>
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
    marginTop: '1.5rem',
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
  generateBtn: {
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
  disabledBtn: {
    padding: '0.5rem 1.25rem',
    borderRadius: '8px',
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  emptyState: {
    padding: '2rem 1rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.875rem',
    lineHeight: 1.5,
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
  roadmapGrid: {
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
  phasesTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  } as React.CSSProperties,
  phaseBlock: {
    borderLeft: '3px solid #1a56db',
    paddingLeft: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  phaseHeader: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  phaseOrderCircle: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
  } as React.CSSProperties,
  phaseMetaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  } as React.CSSProperties,
  phaseTitleText: {
    fontSize: '0.925rem',
    color: '#111827',
  } as React.CSSProperties,
  phaseDesc: {
    fontSize: '0.8125rem',
    color: '#4b5563',
    lineHeight: 1.4,
  } as React.CSSProperties,
  phaseEstimate: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    fontWeight: 500,
  } as React.CSSProperties,
  milestonesCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  milestonesSubtitle: {
    fontSize: '0.75rem',
    color: '#4b5563',
    fontWeight: 700,
  } as React.CSSProperties,
  emptyMilestones: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  milestonesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  milestoneItem: {
    backgroundColor: '#ffffff',
    border: '1px solid #f3f4f6',
    borderRadius: '6px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  } as React.CSSProperties,
  milestoneTitle: {
    fontSize: '0.8125rem',
    color: '#111827',
  } as React.CSSProperties,
  milestoneDesc: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.4,
  } as React.CSSProperties,
  milestoneCriteria: {
    fontSize: '0.6875rem',
    color: '#047857',
    fontWeight: 600,
    marginTop: '0.125rem',
  } as React.CSSProperties,
  successList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  successItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    backgroundColor: '#ffffff',
    border: '1px solid #f3f4f6',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.8125rem',
    color: '#4b5563',
  } as React.CSSProperties,
  successVal: {
    color: '#111827',
    marginBottom: '0.25rem',
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
  riskText: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: 1.5,
    margin: 0,
  } as React.CSSProperties,
  confidenceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#4b5563',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '0.5rem',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  emptyText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    margin: 0,
  } as React.CSSProperties,
};
