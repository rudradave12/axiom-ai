'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMissionStore } from '@/shared/stores/mission-store';
import { useIntelligenceStore } from '@/shared/stores/intelligence-store';
import { usePlannerStore } from '@/shared/stores/planner-store';
import { useExecutionStore } from '@/shared/stores/execution-store';
import { useTimelineStore } from '@/shared/stores/timeline-store';
import { useTaskStore } from '@/shared/stores/task-store';
import { writeBatch } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { GoalType } from '@/features/mission/domain/entities/mission';
import { 
  Send, 
  ArrowRight, 
  Briefcase, 
  Microscope, 
  Rocket, 
  GraduationCap, 
  User, 
  Bot,
  Terminal,
  Paperclip,
  X
} from 'lucide-react';

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

export default function MissionCreatePage(): React.JSX.Element {
  const router = useRouter();
  const { createMissionFromDraft, setDraftGoal, setDraftType } = useMissionStore();

  const [category, setCategory] = useState<'CAREER' | 'RESEARCH' | 'STARTUP' | 'ACADEMIC' | 'PERSONAL' | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [step, setStep] = useState<number>(0); // 0: select cat, 1: ask goal, 2: ask timeline, 3: ask constraints, 4: synthesizing
  const [synthesisStep, setSynthesisStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectCategory = (cat: 'CAREER' | 'RESEARCH' | 'STARTUP' | 'ACADEMIC' | 'PERSONAL'): void => {
    setCategory(cat);
    
    let draftType: GoalType = 'CUSTOM';
    if (cat === 'ACADEMIC') draftType = 'EXAM_PREP';
    else if (cat === 'CAREER') draftType = 'SKILL_LEARNING';
    else if (cat === 'RESEARCH') draftType = 'RESEARCH';
    else if (cat === 'STARTUP') draftType = 'STARTUP';
    
    setDraftType(draftType);
    setStep(1);
    
    let welcomeText = "";
    switch(cat) {
      case 'CAREER':
        welcomeText = "Initiating Career Workspace. What is the target job title or technical skill gap you want to bridge?";
        break;
      case 'RESEARCH':
        welcomeText = "Initiating Research Workspace. What is the domain area, literature review topic, or hypothesis you want to explore?";
        break;
      case 'STARTUP':
        welcomeText = "Initiating Startup Workspace. What is the business idea, MVP concept, or market opportunity you want to plan?";
        break;
      case 'ACADEMIC':
        welcomeText = "Initiating Academic Workspace. What is the subject syllabus, certification scope, or exam syllabus you are preparing for?";
        break;
      case 'PERSONAL':
        welcomeText = "Initiating Personal Growth Workspace. What habit, travel timeline, or financial budget targets would you like to structure?";
        break;
    }

    setMessages([
      { sender: 'ai', text: welcomeText }
    ]);
  };

  const handleSend = async (): Promise<void> => {
    if (!inputValue.trim() && !attachedFile) return;
    
    let userText = inputValue.trim();
    if (attachedFile) {
      userText += ` [Attached File: ${attachedFile.name}]`;
    }
    
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');
    setAttachedFile(null);

    // Wait a brief moment for AI follow-up
    setTimeout(() => {
      if (step === 1) {
        setStep(2);
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: "Understood. To help map this out accurately, do you have a target completion deadline or schedule constraint in mind? (e.g. '3 months', 'by September', or 'none')"
        }]);
      } else if (step === 2) {
        setStep(3);
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: "Excellent. Finally, are there any specific tools, resource constraints, or regional focus parameters we should prioritize?"
        }]);
      } else if (step === 3) {
        triggerSynthesis();
      }
    }, 1000);
  };

  const triggerSynthesis = async (): Promise<void> => {
    setStep(4);
    setErrorMsg(null);
    setSynthesisStep(1); // Creating local workspace repositories

    try {
      // Compile final consolidated goal string
      const userResponses = messages.filter(m => m.sender === 'user').map(m => m.text);
      const compiledGoal = `Goal: ${userResponses[0] || 'Unknown'} | Timeline Constraints: ${userResponses[1] || 'None'} | System Bounds: ${userResponses[2] || 'Default'}`;
      
      setDraftGoal(compiledGoal);
      
      const title = `${category} - ${userResponses[0].slice(0, 35)}`;
      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + 3); // Default to 3 months out

      const batch = writeBatch(db);
      
      const mission = await createMissionFromDraft({
        title,
        deadline,
        activeModules: ['TASKS', 'TIMELINE', 'KNOWLEDGE', 'FLASHCARDS', 'DOCUMENTS'],
      }, batch);

      setSynthesisStep(2); // Analyzing mission parameters
      const intelligenceStore = useIntelligenceStore.getState();
      await intelligenceStore.triggerAIAnalysis(mission.id, title, compiledGoal, batch);

      setSynthesisStep(3); // Partitioning goals roadmap
      const plannerStore = usePlannerStore.getState();
      await plannerStore.triggerAIRoadmap(mission.id, batch);

      setSynthesisStep(4); // Sequencing dependencies
      const executionStore = useExecutionStore.getState();
      await executionStore.triggerAIGraph(mission.id, batch);

      setSynthesisStep(5); // Scheduling timeline checkpoints
      const timelineStore = useTimelineStore.getState();
      await timelineStore.triggerAITimeline(mission.id, batch);

      setSynthesisStep(6); // Compiling tasks checklist
      const taskStore = useTaskStore.getState();
      await taskStore.triggerAITasks(mission.id, batch);

      // Commit transaction batch atomically
      try {
        await batch.commit();
      } catch (dbErr) {
        console.warn('Firestore batch commit failed, running in local-fallback mode:', dbErr);
      }

      setSynthesisStep(7); // Done
      router.push(`/mission/${mission.id}`);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Autonomous synthesis failed';
      setErrorMsg(msg);
      setStep(3); // Reset to last conversational step to allow retrying
    }
  };

  const renderCategorySelection = (): React.JSX.Element => {
    const categories = [
      { id: 'CAREER', label: 'Career Workspace', desc: 'Resume builders, ATS review, skill-gap analysis, and salary intelligence.', icon: Briefcase, color: '#3b82f6' },
      { id: 'RESEARCH', label: 'Research Tracks', desc: 'AI research assistant, literature reviews, citations, and timeline tracks.', icon: Microscope, color: '#10b981' },
      { id: 'STARTUP', label: 'Startup Launchpad', desc: 'Business model canvas, market research, competitor analytics, and decks.', icon: Rocket, color: '#f59e0b' },
      { id: 'ACADEMIC', label: 'Academic Studies', desc: 'Semester planner, assignment tracking, flashcards, and GPA predictors.', icon: GraduationCap, color: '#8b5cf6' },
      { id: 'PERSONAL', label: 'Personal Growth', desc: 'Habit tracking, daily journals, routines, and fitness metrics.', icon: User, color: '#ec4899' },
    ];

    return (
      <div style={styles.catGrid}>
        <div style={styles.catHeader}>
          <h2 style={styles.catTitle}>Booting Workspace Interface...</h2>
          <p style={styles.catDesc}>Select a category template below to structure your AI Mission Operating System.</p>
        </div>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id as 'CAREER' | 'RESEARCH' | 'STARTUP' | 'ACADEMIC' | 'PERSONAL')}
              style={styles.catCard}
            >
              <div style={{ ...styles.iconWrapper, backgroundColor: `${cat.color}15` }}>
                <Icon size={24} style={{ color: cat.color }} />
              </div>
              <div style={styles.catCardMeta}>
                <span style={styles.catCardLabel}>{cat.label}</span>
                <p style={styles.catCardDesc}>{cat.desc}</p>
              </div>
              <ArrowRight size={16} style={styles.catCardArrow} />
            </button>
          );
        })}
      </div>
    );
  };

  const renderChatFlow = (): React.JSX.Element => {
    return (
      <div style={styles.chatWrapper}>
        <div style={styles.chatHeaderRow}>
          <div style={styles.chatHeaderTitle}>
            <Bot size={18} style={{ color: '#1a56db' }} />
            <span>AXIOM Assistant</span>
          </div>
          <span style={styles.catBadge}>{category} Workspace</span>
        </div>

        <div style={styles.messagesContainer}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={m.sender === 'ai' ? styles.msgRowAi : styles.msgRowUser}
            >
              {m.sender === 'ai' && (
                <div style={styles.avatarAi}>
                  <Bot size={14} style={{ color: '#ffffff' }} />
                </div>
              )}
              <div style={m.sender === 'ai' ? styles.bubbleAi : styles.bubbleUser}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {errorMsg && (
          <div style={styles.errorBanner}>
            <strong>Synthesis Error:</strong> {errorMsg}
          </div>
        )}

        {attachedFile && (
          <div style={styles.attachmentPreview}>
            <span style={styles.attachmentName}>📎 {attachedFile.name} (Ready)</span>
            <button onClick={() => setAttachedFile(null)} style={styles.clearAttachmentBtn}>
              <X size={12} />
            </button>
          </div>
        )}

        <div style={styles.inputComposer}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            style={styles.attachButton}
            title="Attach file or image (Max 5MB)"
          >
            <Paperclip size={16} />
          </button>

          <textarea
            placeholder="Type your response here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={styles.composerArea}
            rows={2}
          />
          <button onClick={handleSend} style={styles.sendButton}>
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderLoadingScreen = (): React.JSX.Element => {
    const steps = [
      'Creating local workspace repositories...',
      'Analyzing mission domain & risk parameters...',
      'Partitioning goals roadmap & milestones objectives...',
      'Sequencing dependency paths & critical windows...',
      'Scheduling timeline checkpoints target dates...',
      'Compiling executable task checklist...',
    ];

    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingBox}>
          <div style={styles.loadingHeader}>
            <div style={styles.pulsingRing}>
              <Terminal size={18} style={{ color: '#1a56db' }} />
            </div>
            <div>
              <h2 style={styles.loadingTitle}>Compiling Mission Workspace</h2>
              <p style={styles.loadingSubtitle}>Please hold while AXIOM initializes database collections.</p>
            </div>
          </div>

          <div style={styles.stepsList}>
            {steps.map((text, idx) => {
              const stepNum = idx + 1;
              const isDone = synthesisStep > stepNum;
              const isActive = synthesisStep === stepNum;

              return (
                <div key={idx} style={styles.stepItem}>
                  <span style={isDone ? styles.stepDotDone : isActive ? styles.stepDotActive : styles.stepDotTodo}>
                    {isDone ? '✓' : stepNum}
                  </span>
                  <span style={isActive ? styles.stepTextActive : styles.stepText}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => router.push('/')} style={styles.backButton}>
          ← Return to Command Center
        </button>
      </header>

      <main style={styles.main}>
        {step === 0 && renderCategorySelection()}
        {(step > 0 && step < 4) && renderChatFlow()}
        {step === 4 && renderLoadingScreen()}
      </main>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  } as React.CSSProperties,
  header: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  backButton: {
    background: 'none',
    border: 'none',
    color: 'var(--sys-txt-muted)',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
  } as React.CSSProperties,
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  catGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
  } as React.CSSProperties,
  catHeader: {
    marginBottom: '1rem',
  } as React.CSSProperties,
  catTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--sys-txt-primary)',
    letterSpacing: '-0.025em',
  } as React.CSSProperties,
  catDesc: {
    fontSize: '0.875rem',
    color: 'var(--sys-txt-secondary)',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  catCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    width: '100%',
    position: 'relative',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
  } as React.CSSProperties,
  iconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '1rem',
    flexShrink: 0,
  } as React.CSSProperties,
  catCardMeta: {
    flex: 1,
  } as React.CSSProperties,
  catCardLabel: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: 'var(--sys-txt-primary)',
  } as React.CSSProperties,
  catCardDesc: {
    fontSize: '0.75rem',
    color: 'var(--sys-txt-muted)',
    marginTop: '0.125rem',
    margin: 0,
  } as React.CSSProperties,
  catCardArrow: {
    color: 'var(--sys-txt-muted)',
    marginLeft: '1rem',
  } as React.CSSProperties,
  chatWrapper: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    height: '560px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
  } as React.CSSProperties,
  chatHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  chatHeaderTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#1e293b',
  } as React.CSSProperties,
  catBadge: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    padding: '0.125rem 0.5rem',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  messagesContainer: {
    flex: 1,
    padding: '1.25rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  msgRowAi: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    maxWidth: '85%',
  } as React.CSSProperties,
  msgRowUser: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    maxWidth: '85%',
  } as React.CSSProperties,
  avatarAi: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#1a56db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '0.125rem',
  } as React.CSSProperties,
  bubbleAi: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f3f4f6',
    color: '#1e293b',
    borderRadius: '0 12px 12px 12px',
    fontSize: '0.875rem',
    lineHeight: 1.45,
  } as React.CSSProperties,
  bubbleUser: {
    padding: '0.75rem 1rem',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    borderRadius: '12px 0 12px 12px',
    fontSize: '0.875rem',
    lineHeight: 1.45,
  } as React.CSSProperties,
  errorBanner: {
    padding: '0.75rem 1rem',
    backgroundColor: '#fde8e8',
    color: '#e02424',
    borderTop: '1px solid #f8b4b4',
    borderBottom: '1px solid #f8b4b4',
    fontSize: '0.8125rem',
  } as React.CSSProperties,
  inputComposer: {
    padding: '1rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  } as React.CSSProperties,
  composerArea: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  } as React.CSSProperties,
  attachButton: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  } as React.CSSProperties,
  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as React.CSSProperties,
  attachmentPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    backgroundColor: '#eff6ff',
    borderTop: '1px solid #bfdbfe',
    borderBottom: '1px solid #bfdbfe',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 0',
  } as React.CSSProperties,
  loadingBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  } as React.CSSProperties,
  loadingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  } as React.CSSProperties,
  pulsingRing: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #bfdbfe',
  } as React.CSSProperties,
  loadingTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: 'var(--sys-txt-primary)',
  } as React.CSSProperties,
  loadingSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--sys-txt-muted)',
    margin: 0,
  } as React.CSSProperties,
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
    marginTop: '0.5rem',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1.25rem',
  } as React.CSSProperties,
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  } as React.CSSProperties,
  stepDotTodo: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6875rem',
    fontWeight: 700,
  } as React.CSSProperties,
  stepDotActive: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    border: '1px dashed #1a56db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6875rem',
    fontWeight: 700,
  } as React.CSSProperties,
  stepDotDone: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#d1fae5',
    color: '#059669',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6875rem',
    fontWeight: 700,
  } as React.CSSProperties,
  stepText: {
    fontSize: '0.8125rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  stepTextActive: {
    fontSize: '0.8125rem',
    color: '#111827',
    fontWeight: 600,
  } as React.CSSProperties,
};
