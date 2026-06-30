'use client';

import React, { useEffect, useState } from 'react';
import { useExecutionStore } from '@/shared/stores/execution-store';
import { usePlannerStore } from '@/shared/stores/planner-store';

interface ExecutionGraphViewProps {
  missionId: string;
}

export function ExecutionGraphView({ missionId }: ExecutionGraphViewProps): React.JSX.Element {
  const { graph, loading, error, subscribeToGraph, triggerAIGraph } = useExecutionStore();
  const { roadmap } = usePlannerStore();
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});

  // Sync graph on mount
  useEffect(() => {
    const unsubscribe = subscribeToGraph(missionId);
    return (): void => {
      if (unsubscribe) unsubscribe();
    };
  }, [missionId, subscribeToGraph]);

  const handleGenerateGraph = async (): Promise<void> => {
    try {
      await triggerAIGraph(missionId);
    } catch (err: unknown) {
      // Handled by store state
    }
  };

  const togglePhase = (phaseId: string): void => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const isCriticalPath = (nodeId: string): boolean => {
    return !!graph?.criticalPathNodeIds.includes(nodeId);
  };

  const getBlockingPredecessors = (nodeId: string): string[] => {
    if (!graph) return [];
    return graph.dependencies
      .filter((d) => d.toNodeId === nodeId && d.dependencyType === 'blocking')
      .map((d) => {
        const fromNode = graph.nodes.find((n) => n.id === d.fromNodeId);
        return fromNode ? fromNode.title : 'Prior Step';
      });
  };

  // Group nodes by phase
  const phasesList = roadmap?.phases || [];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h3 style={styles.title}>AI Execution Dependency Graph</h3>
        {!graph && !loading && (
          <button
            onClick={handleGenerateGraph}
            disabled={!roadmap}
            style={roadmap ? styles.generateBtn : styles.disabledBtn}
            title={roadmap ? 'Generate Execution Graph' : 'Generate roadmap first'}
          >
            Generate Execution Graph
          </button>
        )}
      </header>

      {!roadmap && (
        <div style={styles.emptyState}>
          Please generate the AI Mission Roadmap first. The Execution Graph requires roadmap phase coordinates.
        </div>
      )}

      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Gemini is generating node sequencing maps and trace paths...</span>
        </div>
      )}

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Generation failed: {error}</p>
          <button onClick={handleGenerateGraph} style={styles.retryBtn}>
            Retry Graph
          </button>
        </div>
      )}

      {graph && !loading && (
        <div style={styles.graphGrid}>
          {/* Graph Overview / Statistics */}
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{graph.nodes.length}</span>
              <span style={styles.statLbl}>Dependency Nodes</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{graph.criticalPathNodeIds.length}</span>
              <span style={styles.statLbl}>Critical Path Steps</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>
                {graph.nodes.reduce((sum, n) => sum + n.estimatedMinutes, 0)}m
              </span>
              <span style={styles.statLbl}>Total Active Effort</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{graph.executionConfidence}%</span>
              <span style={styles.statLbl}>Confidence Index</span>
            </div>
          </div>

          {/* Collapsible phases list rendering */}
          <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <h4 style={styles.cardTitle}>Execution Nodes & Trace Paths</h4>
            {phasesList.length === 0 ? (
              <p style={styles.emptyText}>No phases coordinate available.</p>
            ) : (
              <div style={styles.phasesList}>
                {phasesList.map((phase) => {
                  const isCollapsed = !!collapsedPhases[phase.id];
                  const displayNodes = graph.nodes.filter((n) => n.phaseId === phase.id);

                  return (
                    <div key={phase.id} style={styles.phaseAccordion}>
                      <button onClick={() => togglePhase(phase.id)} style={styles.accordionHeader}>
                        <strong>{phase.title}</strong>
                        <span>{isCollapsed ? 'Expand ┼' : 'Collapse ─'}</span>
                      </button>

                      {!isCollapsed && (
                        <div style={styles.nodesContainer}>
                          {displayNodes.length === 0 ? (
                            <p style={styles.emptyText}>No execution nodes mapped in this phase.</p>
                          ) : (
                            <div style={styles.nodesList}>
                              {displayNodes.map((node) => {
                                const onCritical = isCriticalPath(node.id);
                                const predecessors = getBlockingPredecessors(node.id);
                                return (
                                  <div
                                    key={node.id}
                                    style={onCritical ? styles.nodeCardCritical : styles.nodeCard}
                                  >
                                    <div style={styles.nodeMetaRow}>
                                      <span style={styles.nodeTypeBadge}>{node.type.toUpperCase()}</span>
                                      <span style={styles.nodeMinutes}>{node.estimatedMinutes}m effort</span>
                                    </div>
                                    <h5 style={styles.nodeTitle}>{node.title}</h5>
                                    <p style={styles.nodeDesc}>{node.description}</p>

                                    {predecessors.length > 0 && (
                                      <div style={styles.predecessorsBlock}>
                                        <span style={styles.predecessorsTitle}>Depends on:</span>
                                        <ul style={styles.predecessorsList}>
                                          {predecessors.map((pTitle, idx) => (
                                            <li key={idx} style={styles.predecessorItem}>
                                              {pTitle}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {onCritical && (
                                      <span style={styles.criticalPathBadge}>✦ CRITICAL PATH</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completion Criteria list */}
          <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <h4 style={styles.cardTitle}>AI Completion Criteria</h4>
            {graph.completionCriteria.length === 0 ? (
              <p style={styles.emptyText}>No criteria defined.</p>
            ) : (
              <ul style={styles.bulletList}>
                {graph.completionCriteria.map((c, index) => (
                  <li key={index} style={styles.criteriaItemText}>
                    {c}
                  </li>
                ))}
              </ul>
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
  graphGrid: {
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
  phasesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  phaseAccordion: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  } as React.CSSProperties,
  accordionHeader: {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    border: 'none',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
  } as React.CSSProperties,
  nodesContainer: {
    padding: '1rem',
  } as React.CSSProperties,
  nodesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  nodeCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
  } as React.CSSProperties,
  nodeCardCritical: {
    backgroundColor: '#ffffff',
    border: '2px solid #ea580c',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    boxShadow: '0 2px 4px rgba(234, 88, 12, 0.05)',
  } as React.CSSProperties,
  nodeMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  nodeTypeBadge: {
    fontSize: '0.625rem',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontWeight: 700,
  } as React.CSSProperties,
  nodeMinutes: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  nodeTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  nodeDesc: {
    fontSize: '0.75rem',
    color: '#6b7280',
    lineHeight: 1.4,
    margin: 0,
  } as React.CSSProperties,
  predecessorsBlock: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '0.5rem',
    marginTop: '0.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  } as React.CSSProperties,
  predecessorsTitle: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    fontWeight: 700,
  } as React.CSSProperties,
  predecessorsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  } as React.CSSProperties,
  predecessorItem: {
    fontSize: '0.6875rem',
    color: '#4b5563',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  criticalPathBadge: {
    fontSize: '0.625rem',
    color: '#ea580c',
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginTop: 'auto',
    paddingTop: '0.25rem',
  } as React.CSSProperties,
  bulletList: {
    paddingLeft: '1.25rem',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  criteriaItemText: {
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: 1.5,
  } as React.CSSProperties,
  emptyText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    margin: 0,
  } as React.CSSProperties,
};
