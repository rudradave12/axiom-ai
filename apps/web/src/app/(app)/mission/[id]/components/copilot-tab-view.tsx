'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/shared/stores/chat-store';
import { useMissionStore } from '@/shared/stores/mission-store';
import { useIntelligenceStore } from '@/shared/stores/intelligence-store';
import { useTimelineStore } from '@/shared/stores/timeline-store';
import { useTaskStore } from '@/shared/stores/task-store';
import { Markdown } from '@/shared/components/markdown';


interface CopilotTabViewProps {
  missionId: string;
  isDocked?: boolean;
}

export function CopilotTabView({ missionId, isDocked = false }: CopilotTabViewProps): React.JSX.Element {
  const {
    activeConversation,
    loading,
    sendMessage,
    subscribeToConversations,
    searchQuery,
    setSearchQuery,
    suggestedActions,
  } = useChatStore();

  const { currentMission } = useMissionStore();
  const { profile } = useIntelligenceStore();
  const { timeline } = useTimelineStore();
  const { tasks } = useTaskStore();

  const [composerText, setComposerText] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB free-tier upload limit.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = (): void => {
      setAttachedFile({
        name: file.name,
        base64: (reader.result as string).split(',')[1],
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // Sync conversations on mount
  useEffect(() => {
    const unsubscribe = subscribeToConversations(missionId);
    return (): void => {
      if (unsubscribe) unsubscribe();
    };
  }, [missionId, subscribeToConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSend = async (text: string): Promise<void> => {
    if (!text.trim() && !attachedFile) return;
    setComposerText('');
    const fileToSend = attachedFile ? { mimeType: attachedFile.mimeType, base64: attachedFile.base64 } : undefined;
    
    let fullText = text;
    if (attachedFile) {
      fullText += `\n\n[Attachment: ${attachedFile.name}]`;
    }
    
    setAttachedFile(null);
    try {
      await sendMessage(missionId, fullText, fileToSend);
    } catch (err: unknown) {
      // Handled by store
    }
  };

  const handleActionClick = async (action: string, msgContent: string): Promise<void> => {
    if (action === 'Create Tasks') {
      const taskStore = useTaskStore.getState();
      await taskStore.triggerAITasks(missionId);
      alert('Task checklist compiled successfully!');
    } else if (action === 'Improve Plan') {
      await sendMessage(missionId, `Please improve plan and optimize schedules for: "${msgContent.substring(0, 100)}..."`);
    } else if (action === 'Find Risks') {
      await sendMessage(missionId, `Analyze risks parameters for: "${msgContent.substring(0, 100)}..."`);
    } else {
      await sendMessage(missionId, `${action} for: "${msgContent.substring(0, 100)}..."`);
    }
  };

  const filteredMessages = (activeConversation?.messages || []).filter((m) => {
    if (!searchQuery) return true;
    return m.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getAIStatus = (): string => {
    if (loading) return 'Thinking...';
    if (activeConversation?.messages.some((m) => m.status === 'generating')) {
      return 'Generating Response...';
    }
    return 'Copilot Active';
  };

  const todoTasks = tasks.filter((t) => t.status === 'todo').slice(0, 3);

  const getGreetingAndChips = (goalType: string): { greeting: string; chips: string[] } => {
    switch (goalType) {
      case 'SKILL_LEARNING':
        return {
          greeting: `Welcome to the Career Workspace. I can help you:

• Build a professional ATS resume
• Prepare for interviews
• Analyze job descriptions
• Build a cloud roadmap
• Improve LinkedIn
• Create projects
• Find skill gaps

Tell me your career goal.`,
          chips: ['Build AWS Roadmap', 'Mock Interview', 'Optimize LinkedIn']
        };
      case 'RESEARCH':
        return {
          greeting: `Welcome to the Research Workspace. I can help you:

• Write literature reviews
• Parse complex PDFs
• Map citation networks
• Keep notes & graphs

What is your hypothesis?`,
          chips: ['Summarize Paper', 'Map Citations', 'Generate Notebook']
        };
      case 'STARTUP':
        return {
          greeting: `Welcome to the Startup Workspace. I can help you:

• Draft Business Canvas
• Outline pitch deck slides
• Simulate runway burn-rate
• Plan market research

What is your business idea?`,
          chips: ['Draft Financials', 'Competitor Audit', 'Investor Checklist']
        };
      case 'EXAM_PREP':
        return {
          greeting: `Welcome to the Academic Workspace. I can help you:

• Organize syllabus timeline
• Generate flashcard quizzes
• Track task deadlines
• Answer complex questions

What subject are you preparing?`,
          chips: ['Generate Study Plan', 'Create Flashcards', 'Solve Math Problem']
        };
      default:
        return {
          greeting: `Welcome to your Personal Growth Workspace. I can help you:

• Set healthy routines
• Map travel logs
• Track finance balance
• Check off habit streaks

Tell me your personal target.`,
          chips: ['Log Finance Entry', 'Routine Planner', 'Habit Check-in']
        };
    }
  };

  const { greeting, chips } = getGreetingAndChips(currentMission?.goalType || 'CUSTOM');

  return (
    <div style={isDocked ? styles.containerDocked : styles.container}>
      {/* Center workspace: Conversation & composer */}
      <div style={styles.centerPanel}>
        {/* Header tools */}
        <header style={styles.chatHeader}>
          <div style={styles.headerTitleCol}>
            <strong style={styles.chatTitle}>{activeConversation?.title || 'Mission Copilot'}</strong>
            <span style={styles.chatSubtitle}>Traceable guidance engine</span>
          </div>

          {!isDocked && (
            <div style={styles.headerTools}>
              <input
                type="text"
                placeholder="Search conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          )}
        </header>

        {/* Conversation list */}
        <div style={styles.messagesContainer}>
          {filteredMessages.length === 0 ? (
            <div style={styles.welcomeContainer}>
              <h3 style={styles.welcomeTitle}>{currentMission?.title || 'Nexus Mission Copilot'}</h3>
              <div style={styles.welcomeText}>
                <Markdown content={greeting} />
              </div>
              <div style={styles.chipsRow}>
                {chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    style={styles.chipBtn}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {filteredMessages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} style={styles.messageRow}>
                    <div style={isUser ? styles.msgCardUser : styles.msgCardAssistant}>
                      <header style={styles.msgHeader}>
                        <strong style={styles.msgRole}>{isUser ? 'YOU' : 'COPILOT'}</strong>
                        <span style={styles.msgTime}>{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </header>
                      <div style={styles.msgContent}><Markdown content={m.content} /></div>

                      {/* Dynamic Productive Action Bar */}
                      {!isUser && (
                        <div style={styles.actionBar}>
                          {['Create Tasks', 'Improve Plan', 'Find Risks', 'Summarize'].map((action) => (
                            <button
                              key={action}
                              onClick={() => handleActionClick(action, m.content)}
                              style={styles.actionPill}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Suggested actions list */}
        <div style={styles.suggestedActionsTrack}>
          {suggestedActions.map((action, idx) => (
            <button key={idx} onClick={() => handleSend(action)} style={styles.suggestedActionBtn}>
              {action}
            </button>
          ))}
        </div>

        {/* Composer */}
        {attachedFile && (
          <div style={styles.attachmentPreview}>
            <span style={styles.attachmentName}>📎 {attachedFile.name} (Ready)</span>
            <button onClick={() => setAttachedFile(null)} style={styles.clearAttachmentBtn}>
              ✕
            </button>
          </div>
        )}

        <div style={styles.composerBox}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            style={styles.attachBtn}
            title="Attach file or image (Max 5MB)"
          >
            📎
          </button>

          <textarea
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(composerText);
              }
            }}
            placeholder="Ask Copilot..."
            style={styles.textarea}
          />
          <button
            onClick={() => handleSend(composerText)}
            disabled={!composerText.trim() && !attachedFile}
            style={(composerText.trim() || attachedFile) ? styles.sendBtn : styles.disabledSendBtn}
          >
            ➔
          </button>
        </div>
      </div>

      {/* Right panel: Sidebar context summary panel (only when not docked) */}
      {!isDocked && (
        <aside style={styles.rightPanel}>
          {/* AI Status */}
          <section style={styles.sidebarCard}>
            <strong style={styles.cardTitle}>AI Copilot Status</strong>
            <div style={styles.statusRow}>
              <span style={styles.statusDot} />
              <span style={styles.statusText}>{getAIStatus()}</span>
            </div>
          </section>

          {/* Active Mission Metadata context */}
          <section style={styles.sidebarCard}>
            <strong style={styles.cardTitle}>Active Mission</strong>
            <p style={styles.sidebarMetaItem}>
              Title: <strong>{currentMission?.title || 'Loading'}</strong>
            </p>
            <p style={styles.sidebarMetaItem}>
              Goal: <span style={styles.sidebarGoalText}>{currentMission?.goal || 'Loading'}</span>
            </p>
            {profile && (
              <p style={styles.sidebarMetaItem}>
                Confidence Index: <strong>{profile.aiConfidence}%</strong>
              </p>
            )}
          </section>

          {/* Today's Tasks */}
          <section style={styles.sidebarCard}>
            <strong style={styles.cardTitle}>Today's Task Queue</strong>
            {todoTasks.length === 0 ? (
              <p style={styles.emptyText}>No pending todo tasks.</p>
            ) : (
              <ul style={styles.checklist}>
                {todoTasks.map((t) => (
                  <li key={t.id} style={styles.checkItem}>
                    <input type="checkbox" readOnly style={styles.checkbox} />
                    <span style={styles.checkText}>{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Timeline Checkpoints */}
          <section style={styles.sidebarCard}>
            <strong style={styles.cardTitle}>Scheduled Milestones</strong>
            {!timeline ? (
              <p style={styles.emptyText}>No active schedule timeline.</p>
            ) : (
              <div style={styles.milestonesList}>
                {timeline.checkpoints.slice(0, 2).map((cp) => (
                  <div key={cp.id} style={styles.milestoneItem}>
                    <strong style={styles.milestoneTitle}>{cp.title}</strong>
                    <span style={styles.milestoneDate}>{new Date(cp.targetDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '1.5rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
    minHeight: '550px',
  } as React.CSSProperties,
  containerDocked: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e5e7eb',
    padding: '1.5rem',
    width: '320px',
    height: '100%',
  } as React.CSSProperties,
  centerPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    height: '100%',
    flex: 1,
  } as React.CSSProperties,
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.75rem',
  } as React.CSSProperties,
  headerTitleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  } as React.CSSProperties,
  chatTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  chatSubtitle: {
    fontSize: '0.75rem',
    color: '#6b7280',
  } as React.CSSProperties,
  headerTools: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  } as React.CSSProperties,
  searchInput: {
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.75rem',
    width: '150px',
  } as React.CSSProperties,
  messagesContainer: {
    flex: 1,
    minHeight: '300px',
    maxHeight: '400px',
    overflowY: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    padding: '1rem',
  } as React.CSSProperties,
  welcomeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '2rem',
    textAlign: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  welcomeTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#1a56db',
  } as React.CSSProperties,
  welcomeText: {
    fontSize: '0.875rem',
    color: '#6b7280',
    lineHeight: 1.5,
    maxWidth: '400px',
  } as React.CSSProperties,
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  messageRow: {
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  msgCardUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '1rem',
    maxWidth: '90%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  } as React.CSSProperties,
  msgCardAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    maxWidth: '90%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  } as React.CSSProperties,
  msgHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.6875rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  msgRole: {
    fontWeight: 700,
  } as React.CSSProperties,
  msgTime: {
    fontSize: '0.625rem',
  } as React.CSSProperties,
  msgContent: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    margin: 0,
  } as React.CSSProperties,
  actionBar: {
    display: 'flex',
    gap: '0.375rem',
    flexWrap: 'wrap',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '0.5rem',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  actionPill: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid #bfdbfe',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '0.6875rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  suggestedActionsTrack: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '0.25rem',
  } as React.CSSProperties,
  suggestedActionBtn: {
    flex: '0 0 auto',
    padding: '0.375rem 0.75rem',
    borderRadius: '16px',
    border: '1px solid #1a56db',
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  composerBox: {
    display: 'flex',
    gap: '0.75rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '0.75rem',
  } as React.CSSProperties,
  textarea: {
    flex: 1,
    height: '40px',
    border: 'none',
    backgroundColor: 'transparent',
    resize: 'none',
    fontSize: '0.875rem',
    color: '#374151',
    outline: 'none',
  } as React.CSSProperties,
  attachBtn: {
    alignSelf: 'flex-end',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1rem',
  } as React.CSSProperties,
  sendBtn: {
    alignSelf: 'flex-end',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  disabledSendBtn: {
    alignSelf: 'flex-end',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  attachmentPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    backgroundColor: '#eff6ff',
    borderTop: '1px solid #bfdbfe',
    borderBottom: '1px solid #bfdbfe',
    borderRadius: '6px',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  attachmentName: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#1d4ed8',
  } as React.CSSProperties,
  clearAttachmentBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    borderLeft: '1px solid #e5e7eb',
    paddingLeft: '1.5rem',
  } as React.CSSProperties,
  sidebarCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.375rem',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  } as React.CSSProperties,
  statusText: {
    fontSize: '0.8125rem',
    color: '#4b5563',
    fontWeight: 600,
  } as React.CSSProperties,
  sidebarMetaItem: {
    fontSize: '0.75rem',
    color: '#4b5563',
    margin: 0,
    lineHeight: 1.4,
  },
  sidebarGoalText: {
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    fontSize: '0.75rem',
    color: '#6b7280',
  } as React.CSSProperties,
  checklist: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  } as React.CSSProperties,
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  checkbox: {
    cursor: 'not-allowed',
  } as React.CSSProperties,
  checkText: {
    fontSize: '0.75rem',
    color: '#4b5563',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  milestonesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  milestoneItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
  } as React.CSSProperties,
  milestoneTitle: {
    color: '#4b5563',
    fontWeight: 500,
  } as React.CSSProperties,
  milestoneDate: {
    color: '#1a56db',
    fontWeight: 600,
  } as React.CSSProperties,
  emptyText: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    margin: 0,
  } as React.CSSProperties,
  chipsRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '16px',
  } as React.CSSProperties,
  chipBtn: {
    padding: '6px 12px',
    borderRadius: '16px',
    border: '1px solid #1a56db',
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
};
