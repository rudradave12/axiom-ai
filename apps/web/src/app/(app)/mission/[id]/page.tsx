'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useMissionStore } from '@/shared/stores/mission-store';
import { useWorkspaceStore } from '@/shared/stores/workspace-store';
import { 
  Home, 
  Layout, 
  FileText, 
  CheckSquare, 
  Map, 
  Calendar, 
  BarChart2, 
  Briefcase, 
  DollarSign, 
  Compass, 
  Layers, 
  HelpCircle, 
  BookOpen, 
  Bookmark, 
  Share2, 
  Clock, 
  Edit3, 
  HardDrive, 
  Columns, 
  Search, 
  ShieldAlert, 
  TrendingUp, 
  Play, 
  PenTool, 
  Megaphone, 
  Presentation, 
  ClipboardList, 
  Book, 
  Copy, 
  Clipboard, 
  AlertCircle, 
  GraduationCap, 
  Award, 
  Heart, 
  Activity, 
  Globe, 
  Sun, 
  Smile
} from 'lucide-react';

import { MissionProfileView } from './components/mission-profile-view';
import { MissionRoadmapView } from './components/mission-roadmap-view';
import { ExecutionGraphView } from './components/execution-graph-view';
import { MissionTimelineView } from './components/mission-timeline-view';
import { CopilotTabView } from './components/copilot-tab-view';
import { InteractiveSubToolConsole, SubToolRightPanel } from './components/sub-tool-consoles';

// 1. Dynamic workspace tab generator based on mission Goal Type
const getWorkspaceTabs = (goalType: string): Array<{ id: string; label: string; icon: React.ComponentType<{ size?: number }> }> => {
  switch (goalType) {
    case 'CAREER':
    case 'SKILL_LEARNING':
      return [
        { id: 'overview', label: 'Overview', icon: Layout },
        { id: 'resume', label: 'Resume Builder', icon: FileText },
        { id: 'ats', label: 'ATS Analysis', icon: CheckSquare },
        { id: 'roadmap', label: 'Roadmap Generator', icon: Map },
        { id: 'interview', label: 'Interview Planner', icon: Calendar },
        { id: 'skills', label: 'Skill Gap Analysis', icon: BarChart2 },
        { id: 'jobs', label: 'Job Tracker', icon: Briefcase },
        { id: 'salary', label: 'Salary Intel', icon: DollarSign },
        { id: 'company', label: 'Company Prep', icon: Compass },
        { id: 'portfolio', label: 'Portfolio Builder', icon: Layers },
      ];
    case 'RESEARCH':
      return [
        { id: 'overview', label: 'Overview', icon: Layout },
        { id: 'assistant', label: 'Research Assistant', icon: HelpCircle },
        { id: 'lit-review', label: 'Literature Review', icon: BookOpen },
        { id: 'citations', label: 'Citation Manager', icon: Bookmark },
        { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
        { id: 'timeline', label: 'Research Timeline', icon: Clock },
        { id: 'notebook', label: 'Notebook', icon: Edit3 },
        { id: 'sources', label: 'Source Manager', icon: HardDrive },
      ];
    case 'STARTUP':
      return [
        { id: 'overview', label: 'Overview', icon: Layout },
        { id: 'canvas', label: 'Business Canvas', icon: Columns },
        { id: 'market', label: 'Market Research', icon: Search },
        { id: 'competitor', label: 'Competitor Intel', icon: ShieldAlert },
        { id: 'financials', label: 'Financial Planner', icon: TrendingUp },
        { id: 'mvp', label: 'MVP Planner', icon: Play },
        { id: 'branding', label: 'Branding Kit', icon: PenTool },
        { id: 'marketing', label: 'Marketing Strategy', icon: Megaphone },
        { id: 'deck', label: 'Investor Deck', icon: Presentation },
        { id: 'checklist', label: 'Launch Checklist', icon: ClipboardList },
      ];
    case 'ACADEMIC':
    case 'EXAM_PREP':
      return [
        { id: 'overview', label: 'Overview', icon: Layout },
        { id: 'semester', label: 'Semester Planner', icon: Calendar },
        { id: 'subjects', label: 'Subject Manager', icon: Book },
        { id: 'assignments', label: 'Assignment Tracker', icon: CheckSquare },
        { id: 'flashcards', label: 'Flashcards', icon: Copy },
        { id: 'notes', label: 'Notes Library', icon: Clipboard },
        { id: 'countdown', label: 'Exam Countdown', icon: AlertCircle },
        { id: 'gpa', label: 'GPA Planner', icon: GraduationCap },
        { id: 'tutor', label: 'AI Tutor', icon: Award },
        { id: 'questions', label: 'Question Gen', icon: HelpCircle },
      ];
    case 'PERSONAL':
    default:
      return [
        { id: 'overview', label: 'Overview', icon: Layout },
        { id: 'habits', label: 'Habit Tracker', icon: Heart },
        { id: 'health', label: 'Health Goals', icon: Activity },
        { id: 'finance', label: 'Finance Goals', icon: DollarSign },
        { id: 'travel', label: 'Travel Planner', icon: Globe },
        { id: 'reading', label: 'Reading Tracker', icon: BookOpen },
        { id: 'journal', label: 'Daily Journal', icon: Book },
        { id: 'routine', label: 'Routine Builder', icon: Sun },
        { id: 'coach', label: 'AI Coach', icon: Smile },
      ];
  }
};



// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDate = (dateInput: any): string => {
  if (!dateInput) return '';
  if (typeof dateInput.toDate === 'function') {
    return dateInput.toDate().toLocaleDateString();
  }
  const dateObj = new Date(dateInput);
  return isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString();
};

// Main Workspace Component
export default function MissionWorkspacePage(): React.JSX.Element {
  const { id } = useParams() as { id: string };
  const { user, signInWithGoogle } = useAuthStore();
  const {
    currentMission,
    initializeMissions,
    selectMission,
    softDeleteMission,
    permanentlyDeleteMission,
  } = useMissionStore();
  
  const { settings, loadWorkspaceSettings, setActiveTab } = useWorkspaceStore();
  const router = useRouter();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      initializeMissions();
      loadWorkspaceSettings(id);
      selectMission(user.uid, id).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error loading mission details';
        setErrorMsg(msg);
      });
    }
  }, [id, user, initializeMissions, loadWorkspaceSettings, selectMission]);

  const handleDelete = async (): Promise<void> => {
    if (window.confirm('Are you sure you want to archive this mission workspace? It can be restored later.')) {
      try {
        await softDeleteMission(id);
        router.push('/');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to archive mission');
      }
    }
  };

  const handlePermanentDelete = async (): Promise<void> => {
    const confirmation = window.prompt('DANGER: Type "DELETE" to permanently destroy this mission and all its data. This cannot be undone.');
    if (confirmation === 'DELETE') {
      try {
        await permanentlyDeleteMission(id);
        router.push('/');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to permanently delete mission');
      }
    }
  };

  if (user?.isAnonymous) {
    return (
      <div style={styles.centerContainer}>
        <div style={modalStyles.card}>
          <h3 style={modalStyles.title}>Google Authorization Required</h3>
          <p style={modalStyles.desc}>
            AXIOM requires a validated Google identity to allocate secure cloud databases, sync live telemetry, and persist workspace blueprints.
          </p>
          <div style={modalStyles.actions}>
            <button onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (e) {
                console.error(e);
              }
            }} style={modalStyles.primaryBtn}>
              Sign In with Google
            </button>
            <button onClick={() => router.push('/')} style={modalStyles.secondaryBtn}>
              Back to Command Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !currentMission || !settings) {
    return (
      <div style={styles.centerContainer}>
        {errorMsg ? (
          <div style={{ color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{errorMsg}</div>
        ) : (
          <div style={styles.spinner} />
        )}
        <span style={{ marginTop: '1rem', color: 'var(--sys-txt-secondary)', fontFamily: 'var(--font-mono)' }}>
          {errorMsg ? 'WORKSPACE FAULT' : 'BOOTING MISSION WORKSPACE...'}
        </span>
      </div>
    );
  }

  const tabs = getWorkspaceTabs(currentMission.goalType);

  return (
    <div style={styles.container}>
      {/* 1. Collapsible Sidebar Navigation */}
      <aside style={isSidebarCollapsed ? styles.sidebarCollapsed : styles.sidebar}>
        <div style={styles.sidebarBrandRow}>
          {!isSidebarCollapsed && <span style={styles.brandTitle} onClick={() => router.push('/')}>AXIOM</span>}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={styles.toggleCollapseBtn}
            title={isSidebarCollapsed ? "Expand Navigation" : "Collapse Navigation"}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <div style={styles.sidebarSection}>
          {!isSidebarCollapsed && <span style={styles.sidebarSectionHeader}>WORKSPACE TABS</span>}
          <div style={styles.sidebarNav}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isTabActive = settings.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={isTabActive ? styles.sidebarLinkActive : styles.sidebarLink}
                >
                  <IconComponent size={16} />
                  {!isSidebarCollapsed && <span>{tab.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.sidebarFooter}>
          <button onClick={() => router.push('/')} style={styles.sidebarLink}>
            <Home size={16} />
            {!isSidebarCollapsed && <span>Command Center</span>}
          </button>
        </div>
      </aside>

      {/* 2. Main Content Viewport & Docked Copilot Split */}
      <div style={styles.mainLayout}>
        <div style={styles.viewport}>
          {/* Workspace Header */}
          <header style={styles.header}>
            <div style={styles.breadcrumbRow}>
              <span style={styles.breadcrumbText} onClick={() => router.push('/')}>
                Missions
              </span>
              <span style={styles.breadcrumbDivider}>/</span>
              <span style={styles.breadcrumbActive}>{currentMission.title}</span>
            </div>

            <div style={styles.headerMain}>
              <div style={styles.headerMeta}>
                <div style={styles.titleRow}>
                  <h1 style={styles.viewportTitle}>{currentMission.title}</h1>
                  <span style={styles.statusBadge}>{currentMission.status}</span>
                  <span style={styles.categoryBadge}>{currentMission.goalType}</span>
                </div>
                <p style={styles.timestamp}>
                  Created {formatDate(currentMission.createdAt)} • Version {currentMission.version}
                </p>
              </div>

              <div style={styles.actionsBar}>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  style={isFavorite ? styles.actionBtnActive : styles.actionBtn}
                >
                  {isFavorite ? '★ Favorited' : '☆ Favorite'}
                </button>
                <button onClick={handleDelete} style={styles.deleteBtn}>
                  Archive
                </button>
                <button onClick={handlePermanentDelete} style={{ ...styles.deleteBtn, backgroundColor: '#ef4444', color: '#fff' }}>
                  Destroy
                </button>
              </div>
            </div>
          </header>

          {/* Dynamic Tab Layout content panel */}
          <main style={styles.content}>
            {settings.activeTab === 'overview' && (
              <div style={styles.overviewGrid}>
                {/* Summary Goal */}
                <section style={styles.card}>
                  <h3 style={styles.cardTitle}>Goal Objective Summary</h3>
                  <p style={styles.goalText}>{currentMission.goal}</p>
                  <div style={styles.tagRow}>
                    <span style={styles.tag}>Version {currentMission.version}</span>
                    <span style={styles.tag}>{currentMission.goalType} category</span>
                  </div>
                </section>

                {/* Health and Progress metrics */}
                <section style={styles.card}>
                  <h3 style={styles.cardTitle}>Execution Health</h3>
                  <div style={styles.progressRow}>
                    <div style={styles.progressCircle}>
                      <span style={styles.progressNum}>{currentMission.health.composite}%</span>
                      <span style={styles.progressLbl}>Composite</span>
                    </div>
                    <div style={styles.progressStats}>
                      <div style={styles.metricItem}>
                        <span>Pulse Indicator:</span>
                        <strong style={styles.pulseSteady}>
                          {currentMission.health.pulse.toUpperCase()}
                        </strong>
                      </div>
                      <div style={styles.metricItem}>
                        <span>Momentum Rating:</span>
                        <span>{currentMission.health.momentum}/100</span>
                      </div>
                      <div style={styles.metricItem}>
                        <span>Information Sufficiency:</span>
                        <span>{currentMission.health.infoSufficiency}/100</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Statistics Grid */}
                <section style={styles.statsSection}>
                  <div style={styles.statBox}>
                    <span style={styles.statNum}>{currentMission.health.completeness}%</span>
                    <span style={styles.statLbl}>Missions Completeness</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statNum}>{currentMission.health.scheduleIntegrity}%</span>
                    <span style={styles.statLbl}>Schedule Integrity</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statNum}>{currentMission.health.knowledgeDepth}%</span>
                    <span style={styles.statLbl}>Knowledge Depth</span>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statNum}>{currentMission.health.riskExposure}%</span>
                    <span style={styles.statLbl}>Risk Exposure</span>
                  </div>
                </section>

                {/* Timeline Preview Widget */}
                <div style={{ gridColumn: 'span 2' }}>
                  <MissionTimelineView missionId={id} />
                </div>

                {/* Knowledge Graph Preview Widget */}
                <div style={{ gridColumn: 'span 2' }}>
                  <ExecutionGraphView missionId={id} />
                </div>

                {/* Roadmap Viewport */}
                <div style={{ gridColumn: 'span 2' }}>
                  <MissionRoadmapView missionId={id} />
                </div>

                {/* Profile Viewport */}
                <div style={{ gridColumn: 'span 2' }}>
                  <MissionProfileView missionId={id} title={currentMission.title} goal={currentMission.goal} />
                </div>
              </div>
            )}

            {settings.activeTab !== 'overview' && (
              <InteractiveSubToolConsole
                missionId={id}
                goalType={currentMission.goalType}
                toolId={settings.activeTab}
              />
            )}
          </main>
        </div>

        {/* Docked AI Architect Copilot Panel */}
        <aside style={styles.copilotDock}>
          {settings.activeTab === 'overview' ? (
            <CopilotTabView missionId={id} isDocked={true} />
          ) : (
            <SubToolRightPanel
              missionId={id}
              goalType={currentMission.goalType}
              toolId={settings.activeTab}
            />
          )}
        </aside>
      </div>
    </div>
  );
}


const styles = {
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: 'var(--sys-bg-default)',
  } as React.CSSProperties,
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid #e5e7eb',
    borderTopColor: '#1a56db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--sys-bg-default)',
    color: 'var(--sys-txt-primary)',
    overflow: 'hidden',
  } as React.CSSProperties,
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    width: '260px',
    backgroundColor: 'var(--sys-bg-surface)',
    borderRight: '1px solid var(--sys-border-subtle)',
    padding: '1.25rem',
    transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    zIndex: 10,
    overflowY: 'auto',
  } as React.CSSProperties,
  sidebarCollapsed: {
    display: 'flex',
    flexDirection: 'column',
    width: '72px',
    backgroundColor: 'var(--sys-bg-surface)',
    borderRight: '1px solid var(--sys-border-subtle)',
    padding: '1.25rem 0.25rem',
    transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    alignItems: 'center',
    zIndex: 10,
  } as React.CSSProperties,
  sidebarBrandRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    width: '100%',
    padding: '0 0.5rem',
  } as React.CSSProperties,
  brandTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--sys-primary)',
    letterSpacing: '-0.03em',
    cursor: 'pointer',
  } as React.CSSProperties,
  toggleCollapseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--sys-txt-muted)',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#f3f4f6',
  } as React.CSSProperties,
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
    width: '100%',
  } as React.CSSProperties,
  sidebarSectionHeader: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--sys-txt-muted)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    paddingLeft: '0.5rem',
  } as React.CSSProperties,
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  } as React.CSSProperties,
  sidebarLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: 'none',
    color: 'var(--sys-txt-secondary)',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  sidebarLinkActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  } as React.CSSProperties,
  sidebarFooter: {
    marginTop: 'auto',
    borderTop: '1px solid var(--sys-border-subtle)',
    paddingTop: '1rem',
    width: '100%',
  } as React.CSSProperties,
  mainLayout: {
    flex: 1,
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  } as React.CSSProperties,
  viewport: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    overflowY: 'auto',
  } as React.CSSProperties,
  header: {
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--sys-border-subtle)',
    paddingBottom: '1.25rem',
  } as React.CSSProperties,
  breadcrumbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--sys-txt-muted)',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  breadcrumbText: {
    cursor: 'pointer',
  } as React.CSSProperties,
  breadcrumbDivider: {
    color: 'var(--sys-txt-muted)',
  } as React.CSSProperties,
  breadcrumbActive: {
    color: 'var(--sys-txt-secondary)',
  } as React.CSSProperties,
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
  } as React.CSSProperties,
  headerMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  } as React.CSSProperties,
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  viewportTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--sys-txt-primary)',
    letterSpacing: '-0.02em',
    margin: 0,
  } as React.CSSProperties,
  statusBadge: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: '#059669',
    backgroundColor: '#d1fae5',
    padding: '0.125rem 0.5rem',
    borderRadius: '4px',
  } as React.CSSProperties,
  categoryBadge: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: '#1d4ed8',
    backgroundColor: '#eff6ff',
    padding: '0.125rem 0.5rem',
    borderRadius: '4px',
  } as React.CSSProperties,
  timestamp: {
    fontSize: '0.75rem',
    color: 'var(--sys-txt-muted)',
    margin: 0,
  } as React.CSSProperties,
  actionsBar: {
    display: 'flex',
    gap: '0.5rem',
  } as React.CSSProperties,
  actionBtn: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid var(--sys-border-subtle)',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: 'var(--sys-txt-secondary)',
    cursor: 'pointer',
  } as React.CSSProperties,
  actionBtnActive: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    cursor: 'pointer',
  } as React.CSSProperties,
  deleteBtn: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid #f8b4b4',
    borderRadius: '6px',
    backgroundColor: '#fde8e8',
    color: '#e02424',
    cursor: 'pointer',
  } as React.CSSProperties,
  content: {
    flex: 1,
  } as React.CSSProperties,
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
  } as React.CSSProperties,
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: 'var(--sys-txt-primary)',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  goalText: {
    fontSize: '0.875rem',
    color: 'var(--sys-txt-secondary)',
    lineHeight: 1.5,
    margin: 0,
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  tagRow: {
    display: 'flex',
    gap: '0.375rem',
  } as React.CSSProperties,
  tag: {
    fontSize: '0.6875rem',
    padding: '0.125rem 0.375rem',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    borderRadius: '4px',
    fontWeight: 500,
  } as React.CSSProperties,
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  } as React.CSSProperties,
  progressCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: '4px solid #eff6ff',
    borderTopColor: '#1a56db',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  progressNum: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#1a56db',
  } as React.CSSProperties,
  progressLbl: {
    fontSize: '0.5625rem',
    color: 'var(--sys-txt-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
  } as React.CSSProperties,
  progressStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  } as React.CSSProperties,
  metricItem: {
    fontSize: '0.75rem',
    color: 'var(--sys-txt-secondary)',
    display: 'flex',
    gap: '0.5rem',
  } as React.CSSProperties,
  pulseSteady: {
    color: '#059669',
  } as React.CSSProperties,
  statsSection: {
    gridColumn: 'span 2',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
  } as React.CSSProperties,
  statBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    textAlign: 'center',
  } as React.CSSProperties,
  statNum: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--sys-txt-primary)',
    display: 'block',
  } as React.CSSProperties,
  statLbl: {
    fontSize: '0.6875rem',
    color: 'var(--sys-txt-muted)',
    display: 'block',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  copilotDock: {
    width: '320px',
    borderLeft: '1px solid var(--sys-border-subtle)',
    backgroundColor: 'var(--sys-bg-surface)',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
};

const modalStyles = {
  card: {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '16px',
    padding: '2.5rem',
    maxWidth: '440px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  } as React.CSSProperties,
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  } as React.CSSProperties,
  desc: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    lineHeight: 1.6,
    margin: 0,
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  primaryBtn: {
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  secondaryBtn: {
    padding: '0.75rem',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: '1px solid #4b5563',
    borderRadius: '8px',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
};
