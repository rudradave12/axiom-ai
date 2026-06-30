'use client';

import React, { useEffect, useState } from 'react';
import { useTimelineStore } from '@/shared/stores/timeline-store';
import { useExecutionStore } from '@/shared/stores/execution-store';

interface MissionTimelineViewProps {
  missionId: string;
}

export function MissionTimelineView({ missionId }: MissionTimelineViewProps): React.JSX.Element {
  const { timeline, loading, error, subscribeToTimeline, triggerAITimeline } = useTimelineStore();
  const { graph } = useExecutionStore();

  const [zoomLevel, setZoomLevel] = useState<'weekly' | 'monthly'>('weekly');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Sync timeline on mount
  useEffect(() => {
    const unsubscribe = subscribeToTimeline(missionId);
    return (): void => {
      if (unsubscribe) unsubscribe();
    };
  }, [missionId, subscribeToTimeline]);

  const handleGenerateTimeline = async (): Promise<void> => {
    try {
      await triggerAITimeline(missionId);
    } catch (err: unknown) {
      // Handled by store state
    }
  };

  const calculateDaysBetween = (start: Date, end: Date): number => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Filter checkpoints
  const filteredCheckpoints = (timeline?.checkpoints || []).filter((c) => {
    if (filterType === 'ALL') return true;
    return c.type === filterType.toLowerCase();
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h3 style={styles.title}>AI Scheduled Timeline</h3>
        {!timeline && !loading && (
          <button
            onClick={handleGenerateTimeline}
            disabled={!graph}
            style={graph ? styles.generateBtn : styles.disabledBtn}
            title={graph ? 'Generate Scheduled Timeline' : 'Generate execution graph first'}
          >
            Generate Timeline
          </button>
        )}
      </header>

      {!graph && (
        <div style={styles.emptyState}>
          Please generate the AI Execution Graph first. The Timeline requires dependency nodes to calculate schedule durations.
        </div>
      )}

      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Gemini is scheduling checkpoints and mapping calendar windows...</span>
        </div>
      )}

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Scheduling failed: {error}</p>
          <button onClick={handleGenerateTimeline} style={styles.retryBtn}>
            Retry Timeline
          </button>
        </div>
      )}

      {timeline && !loading && (
        <div style={styles.timelineGrid}>
          {/* Scheduling Statistics */}
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>
                {calculateDaysBetween(timeline.criticalWindow.startDate, timeline.criticalWindow.endDate)} days
              </span>
              <span style={styles.statLbl}>Target Track Range</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>
                {new Date(timeline.estimatedCompletion).toLocaleDateString()}
              </span>
              <span style={styles.statLbl}>Estimated Completion</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{timeline.checkpoints.length}</span>
              <span style={styles.statLbl}>Target Checkpoints</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{timeline.schedulingConfidence}%</span>
              <span style={styles.statLbl}>Scheduling Confidence</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={styles.controlsBar}>
            <div style={styles.controlsGroup}>
              <button
                onClick={() => setZoomLevel('weekly')}
                style={zoomLevel === 'weekly' ? styles.toggleBtnActive : styles.toggleBtn}
              >
                Weekly Zoom
              </button>
              <button
                onClick={() => setZoomLevel('monthly')}
                style={zoomLevel === 'monthly' ? styles.toggleBtnActive : styles.toggleBtn}
              >
                Monthly Zoom
              </button>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">All Nodes</option>
              <option value="MILESTONE">Milestones Only</option>
              <option value="CHECKPOINT">Checkpoints Only</option>
              <option value="GATE">Gates Only</option>
            </select>
          </div>

          {/* Horizontal Roadmap View summary */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Horizontal Timeline Map ({zoomLevel.toUpperCase()})</h4>
            <div style={styles.horizontalTrack}>
              {timeline.phases
                .sort((a, b) => a.order - b.order)
                .map((phase) => (
                  <div key={phase.id} style={styles.horizontalPhaseBlock}>
                    <div style={styles.horizontalPhaseHeader}>
                      <strong style={styles.hPhaseTitle}>{phase.title}</strong>
                      <span style={styles.hPhaseDuration}>{phase.estimatedDuration}</span>
                    </div>
                    <span style={styles.hPhaseDateRange}>
                      {new Date(phase.startDate).toLocaleDateString()} -{' '}
                      {new Date(phase.endDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Vertical Timeline View */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Vertical Trace Nodes</h4>
            {filteredCheckpoints.length === 0 ? (
              <p style={styles.emptyText}>No scheduled nodes fit this filter.</p>
            ) : (
              <div style={styles.verticalTimeline}>
                {filteredCheckpoints
                  .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
                  .map((cp) => (
                    <div key={cp.id} style={styles.vTimelineItem}>
                      <div style={styles.vTimelineMarker}>
                        <div style={styles.vMarkerDot} />
                        <div style={styles.vMarkerLine} />
                      </div>
                      <div style={styles.vTimelineContent}>
                        <div style={styles.cpMetaRow}>
                          <span style={styles.cpDate}>
                            {new Date(cp.targetDate).toLocaleDateString()}
                          </span>
                          <span style={styles.cpTypeBadge}>{cp.type.toUpperCase()}</span>
                        </div>
                        <strong style={styles.cpTitle}>{cp.title}</strong>
                        <p style={styles.cpDesc}>{cp.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
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
  timelineGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  statsRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  statBox: {
    flex: 1,
    minWidth: '120px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  statNum: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1a56db',
  } as React.CSSProperties,
  statLbl: {
    fontSize: '0.6875rem',
    color: '#6b7280',
    marginTop: '0.25rem',
    textAlign: 'center',
  } as React.CSSProperties,
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  controlsGroup: {
    display: 'flex',
    gap: '0.5rem',
  } as React.CSSProperties,
  toggleBtn: {
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  toggleBtnActive: {
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    border: '1px solid #1a56db',
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  filterSelect: {
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    fontSize: '0.75rem',
    cursor: 'pointer',
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
  horizontalTrack: {
    display: 'flex',
    gap: '1rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  } as React.CSSProperties,
  horizontalPhaseBlock: {
    flex: '0 0 200px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  } as React.CSSProperties,
  horizontalPhaseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  hPhaseTitle: {
    fontSize: '0.8125rem',
    color: '#111827',
  } as React.CSSProperties,
  hPhaseDuration: {
    fontSize: '0.625rem',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  } as React.CSSProperties,
  hPhaseDateRange: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  verticalTimeline: {
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  vTimelineItem: {
    display: 'flex',
    gap: '1rem',
  } as React.CSSProperties,
  vTimelineMarker: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as React.CSSProperties,
  vMarkerDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#1a56db',
    marginTop: '0.375rem',
  } as React.CSSProperties,
  vMarkerLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#e5e7eb',
    minHeight: '40px',
  } as React.CSSProperties,
  vTimelineContent: {
    flex: 1,
    paddingBottom: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  } as React.CSSProperties,
  cpMetaRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  } as React.CSSProperties,
  cpDate: {
    fontSize: '0.75rem',
    color: '#1a56db',
    fontWeight: 600,
  } as React.CSSProperties,
  cpTypeBadge: {
    fontSize: '0.5625rem',
    padding: '0.0625rem 0.25rem',
    borderRadius: '4px',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontWeight: 700,
  } as React.CSSProperties,
  cpTitle: {
    fontSize: '0.875rem',
    color: '#111827',
  } as React.CSSProperties,
  cpDesc: {
    fontSize: '0.75rem',
    color: '#6b7280',
    lineHeight: 1.4,
    margin: 0,
  } as React.CSSProperties,
  emptyText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    margin: 0,
  } as React.CSSProperties,
};
