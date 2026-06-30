'use client';

import React, { useEffect, useState } from 'react';
import { useTaskStore } from '@/shared/stores/task-store';
import { useTimelineStore } from '@/shared/stores/timeline-store';
import { MissionTask } from '@/features/task/domain/entities/task';

interface TasksTabViewProps {
  missionId: string;
}

export function TasksTabView({ missionId }: TasksTabViewProps): React.JSX.Element {
  const {
    tasks,
    loading,
    error,
    subscribeToTasks,
    triggerAITasks,
    updateTaskStatus,
    duplicateTask,
    deleteTaskItem,
    undoLastAction,
    historyStack,
  } = useTaskStore();
  const { timeline } = useTimelineStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'table'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<MissionTask | null>(null);

  // Sync tasks on mount
  useEffect(() => {
    const unsubscribe = subscribeToTasks(missionId);
    return (): void => {
      if (unsubscribe) unsubscribe();
    };
  }, [missionId, subscribeToTasks]);

  const handleGenerateTasks = async (): Promise<void> => {
    try {
      await triggerAITasks(missionId);
    } catch (err: unknown) {
      // Handled by store state
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.titleCol}>
          <h2 style={styles.title}>AI Execution Task Workspace</h2>
          <p style={styles.subtitle}>Traceable step objectives compiled from scheduled milestones.</p>
        </div>

        <div style={styles.actionsGroup}>
          {historyStack.length > 0 && (
            <button onClick={() => undoLastAction(missionId)} style={styles.undoBtn}>
              ↶ Undo Status ({historyStack.length})
            </button>
          )}
          {tasks.length === 0 && !loading && (
            <button
              onClick={handleGenerateTasks}
              disabled={!timeline}
              style={timeline ? styles.generateBtn : styles.disabledBtn}
              title={timeline ? 'Compile execution tasks' : 'Schedule timeline first'}
            >
              Generate AI Tasks
            </button>
          )}
        </div>
      </header>

      {!timeline && (
        <div style={styles.emptyState}>
          Please generate the AI Scheduled Timeline first. The AI Task Engine translates scheduled milestone timelines into executable checklists.
        </div>
      )}

      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Gemini is compiling executable steps and setting up traceability anchors...</span>
        </div>
      )}

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Task compilation failed: {error}</p>
          <button onClick={handleGenerateTasks} style={styles.retryBtn}>
            Retry Tasks Compilation
          </button>
        </div>
      )}

      {timeline && tasks.length > 0 && !loading && (
        <div style={styles.workspaceBody}>
          {/* Controls Panel */}
          <div style={styles.controlsRow}>
            {/* View Switchers */}
            <div style={styles.viewGroup}>
              <button
                onClick={() => setViewMode('kanban')}
                style={viewMode === 'kanban' ? styles.viewBtnActive : styles.viewBtn}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={viewMode === 'list' ? styles.viewBtnActive : styles.viewBtn}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={viewMode === 'table' ? styles.viewBtnActive : styles.viewBtn}
              >
                Table
              </button>
            </div>

            {/* Filter Tools */}
            <div style={styles.filtersGroup}>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Kanban Board View */}
          {viewMode === 'kanban' && (
            <div style={styles.kanbanBoard}>
              {/* To Do Column */}
              <div style={styles.kanbanColumn}>
                <div style={styles.colHeader}>
                  <span style={styles.colIndicatorTodo} />
                  <strong style={styles.colTitle}>To Do ({todoTasks.length})</strong>
                </div>
                <div style={styles.kanbanCardsList}>
                  {todoTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      style={styles.taskCard}
                    >
                      <div style={styles.cardHeaderRow}>
                        <span style={styles.priorityBadge}>{t.priority.toUpperCase()}</span>
                        <span style={styles.durationText}>{t.estimatedMinutes}m</span>
                      </div>
                      <h4 style={styles.cardTitleText}>{t.title}</h4>
                      <p style={styles.cardDescText}>{t.description}</p>
                      <div style={styles.cardActionsRow}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(missionId, t.id, 'in-progress');
                          }}
                          style={styles.statusChangeBtn}
                        >
                          Start ➔
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div style={styles.kanbanColumn}>
                <div style={styles.colHeader}>
                  <span style={styles.colIndicatorProgress} />
                  <strong style={styles.colTitle}>In Progress ({inProgressTasks.length})</strong>
                </div>
                <div style={styles.kanbanCardsList}>
                  {inProgressTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      style={styles.taskCard}
                    >
                      <div style={styles.cardHeaderRow}>
                        <span style={styles.priorityBadge}>{t.priority.toUpperCase()}</span>
                        <span style={styles.durationText}>{t.estimatedMinutes}m</span>
                      </div>
                      <h4 style={styles.cardTitleText}>{t.title}</h4>
                      <p style={styles.cardDescText}>{t.description}</p>
                      <div style={styles.cardActionsRow}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(missionId, t.id, 'todo');
                          }}
                          style={styles.statusChangeBtn}
                        >
                          ⇠ Back
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(missionId, t.id, 'done');
                          }}
                          style={styles.statusChangeDoneBtn}
                        >
                          Complete ✓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div style={styles.kanbanColumn}>
                <div style={styles.colHeader}>
                  <span style={styles.colIndicatorDone} />
                  <strong style={styles.colTitle}>Completed ({doneTasks.length})</strong>
                </div>
                <div style={styles.kanbanCardsList}>
                  {doneTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      style={styles.taskCardDone}
                    >
                      <div style={styles.cardHeaderRow}>
                        <span style={styles.priorityBadgeDone}>{t.priority.toUpperCase()}</span>
                        <span style={styles.durationText}>{t.estimatedMinutes}m</span>
                      </div>
                      <h4 style={styles.cardTitleTextDone}>{t.title}</h4>
                      <p style={styles.cardDescTextDone}>{t.description}</p>
                      <div style={styles.cardActionsRow}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(missionId, t.id, 'in-progress');
                          }}
                          style={styles.statusChangeBtn}
                        >
                          Reopen ↺
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div style={styles.listViewContainer}>
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  style={t.status === 'done' ? styles.listRowDone : styles.listRow}
                >
                  <div style={styles.listRowMain}>
                    <div style={styles.listRowHeader}>
                      <span style={styles.priorityBadge}>{t.priority.toUpperCase()}</span>
                      <strong style={styles.listRowTitle}>{t.title}</strong>
                    </div>
                    <p style={styles.listRowDesc}>{t.description}</p>
                  </div>
                  <div style={styles.listRowMeta}>
                    <span style={styles.listRowDuration}>{t.estimatedMinutes} mins</span>
                    <span style={styles.listRowStatus}>{t.status.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Priority</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Duration</th>
                    <th style={styles.th}>Phase Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      style={t.status === 'done' ? styles.trDone : styles.tr}
                    >
                      <td style={styles.td}>{t.title}</td>
                      <td style={styles.td}>{t.priority.toUpperCase()}</td>
                      <td style={styles.td}>{t.status.toUpperCase()}</td>
                      <td style={styles.td}>{t.estimatedMinutes}m</td>
                      <td style={styles.td}>{t.phaseId || 'Overview'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Task Details Drawer */}
          {selectedTask && (
            <div style={styles.drawerOverlay} onClick={() => setSelectedTask(null)}>
              <div style={styles.drawerBody} onClick={(e) => e.stopPropagation()}>
                <header style={styles.drawerHeader}>
                  <span style={styles.drawerPriority}>{selectedTask.priority.toUpperCase()}</span>
                  <button onClick={() => setSelectedTask(null)} style={styles.closeBtn}>
                    ✕
                  </button>
                </header>

                <div style={styles.drawerContent}>
                  <h3 style={styles.drawerTitle}>{selectedTask.title}</h3>
                  <div style={styles.drawerMetaRow}>
                    <span>Estimated: <strong>{selectedTask.estimatedMinutes} mins</strong></span>
                    <span>Status: <strong>{selectedTask.status.toUpperCase()}</strong></span>
                  </div>

                  <div style={styles.drawerSection}>
                    <strong style={styles.secTitle}>Detailed Instructions:</strong>
                    <p style={styles.secText}>{selectedTask.description}</p>
                  </div>

                  <div style={styles.drawerSection}>
                    <strong style={styles.secTitle}>Traceability Markers:</strong>
                    <div style={styles.traceRow}>
                      <span style={styles.traceBadge}>Timeline Target: {selectedTask.timelineCheckpointId || 'TBD'}</span>
                      <span style={styles.traceBadge}>Evidence Ref: {selectedTask.evidenceReferencePlaceholder || 'None'}</span>
                    </div>
                  </div>

                  <div style={styles.drawerActions}>
                    <button
                      onClick={() => {
                        duplicateTask(missionId, selectedTask);
                        setSelectedTask(null);
                      }}
                      style={styles.drawerActionBtn}
                    >
                      Duplicate Task
                    </button>
                    <button
                      onClick={() => {
                        deleteTaskItem(missionId, selectedTask.id);
                        setSelectedTask(null);
                      }}
                      style={styles.drawerDeleteBtn}
                    >
                      Delete Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
    minHeight: '400px',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '1rem',
  } as React.CSSProperties,
  titleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  } as React.CSSProperties,
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0,
  } as React.CSSProperties,
  actionsGroup: {
    display: 'flex',
    gap: '0.75rem',
  } as React.CSSProperties,
  undoBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
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
    padding: '3rem 1.5rem',
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
    padding: '4rem 1.5rem',
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
  workspaceBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  } as React.CSSProperties,
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  viewGroup: {
    display: 'flex',
    gap: '0.375rem',
    backgroundColor: '#f3f4f6',
    padding: '0.25rem',
    borderRadius: '8px',
  } as React.CSSProperties,
  viewBtn: {
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#4b5563',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  viewBtnActive: {
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#ffffff',
    color: '#1a56db',
    fontSize: '0.75rem',
    fontWeight: 600,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    cursor: 'pointer',
  } as React.CSSProperties,
  filtersGroup: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  } as React.CSSProperties,
  searchInput: {
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.75rem',
    width: '180px',
  } as React.CSSProperties,
  filterSelect: {
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.75rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  kanbanBoard: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1.25rem',
  } as React.CSSProperties,
  kanbanColumn: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minHeight: '300px',
  } as React.CSSProperties,
  colHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  colIndicatorTodo: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#9ca3af',
  } as React.CSSProperties,
  colIndicatorProgress: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
  } as React.CSSProperties,
  colIndicatorDone: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  } as React.CSSProperties,
  colTitle: {
    fontSize: '0.875rem',
    color: '#374151',
  } as React.CSSProperties,
  kanbanCardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
  } as React.CSSProperties,
  taskCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    transition: 'transform 0.15s ease',
  } as React.CSSProperties,
  taskCardDone: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    boxShadow: 'none',
  } as React.CSSProperties,
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  priorityBadge: {
    fontSize: '0.5625rem',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    fontWeight: 700,
  } as React.CSSProperties,
  priorityBadgeDone: {
    fontSize: '0.5625rem',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    fontWeight: 700,
  } as React.CSSProperties,
  durationText: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  cardTitleText: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  cardTitleTextDone: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#9ca3af',
    textDecoration: 'line-through',
  } as React.CSSProperties,
  cardDescText: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.4,
  } as React.CSSProperties,
  cardDescTextDone: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    margin: 0,
    lineHeight: 1.4,
  } as React.CSSProperties,
  cardActionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.375rem',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  statusChangeBtn: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    fontSize: '0.6875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  statusChangeDoneBtn: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '0.6875rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  listViewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
  listRowDone: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    opacity: 0.6,
  } as React.CSSProperties,
  listRowMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  } as React.CSSProperties,
  listRowHeader: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  } as React.CSSProperties,
  listRowTitle: {
    fontSize: '0.875rem',
    color: '#111827',
  } as React.CSSProperties,
  listRowDesc: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: 0,
  } as React.CSSProperties,
  listRowMeta: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  } as React.CSSProperties,
  listRowDuration: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  listRowStatus: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: '#4b5563',
  } as React.CSSProperties,
  tableContainer: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  } as React.CSSProperties,
  tableHeaderRow: {
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  th: {
    padding: '0.75rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#374151',
  } as React.CSSProperties,
  tr: {
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
  } as React.CSSProperties,
  trDone: {
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  } as React.CSSProperties,
  td: {
    padding: '0.75rem 1rem',
    fontSize: '0.75rem',
    color: '#4b5563',
  } as React.CSSProperties,
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 999,
  } as React.CSSProperties,
  drawerBody: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-4px 0 12px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  drawerPriority: {
    fontSize: '0.625rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '4px',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    fontWeight: 700,
  } as React.CSSProperties,
  closeBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '1rem',
    cursor: 'pointer',
    color: '#9ca3af',
  } as React.CSSProperties,
  drawerContent: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    flex: 1,
    overflowY: 'auto',
  } as React.CSSProperties,
  drawerTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  drawerMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8125rem',
    color: '#4b5563',
    backgroundColor: '#f9fafb',
    padding: '0.75rem',
    borderRadius: '6px',
  } as React.CSSProperties,
  drawerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  } as React.CSSProperties,
  secTitle: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    fontWeight: 700,
  } as React.CSSProperties,
  secText: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: 1.5,
    margin: 0,
  } as React.CSSProperties,
  traceRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  traceBadge: {
    fontSize: '0.6875rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  } as React.CSSProperties,
  drawerActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1rem',
  } as React.CSSProperties,
  drawerActionBtn: {
    flex: 1,
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  drawerDeleteBtn: {
    flex: 1,
    padding: '0.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  emptyText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    margin: 0,
  } as React.CSSProperties,
};
