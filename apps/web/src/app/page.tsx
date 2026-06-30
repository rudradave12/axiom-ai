'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useMissionStore } from '@/shared/stores/mission-store';
import { 
  Folder, 
  Briefcase, 
  Microscope, 
  Rocket, 
  User, 
  BookOpen, 
  Settings, 
  LogOut,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  BookOpenText
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDate = (dateInput: any): string => {
  if (!dateInput) return '';
  if (typeof dateInput.toDate === 'function') {
    return dateInput.toDate().toLocaleDateString();
  }
  const dateObj = new Date(dateInput);
  return isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString();
};

export default function HomePage(): React.JSX.Element {
  const { user, signOut, signInWithGoogle } = useAuthStore();
  const {
    missions,
    initializeMissions,
  } = useMissionStore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Career Workspace States
  const [resumeBullets, setResumeBullets] = useState<string[]>([]);
  const [newBullet, setNewBullet] = useState('');
  const [atsScore, setAtsScore] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [activeInterviewsCount, setActiveInterviewsCount] = useState(0);
  const [roadmapStatus, setRoadmapStatus] = useState('None');
  const [completedMilestonesCount, setCompletedMilestonesCount] = useState(0);

  // Research Workspace States
  const [papers, setPapers] = useState<Array<{ id: string; title: string; authors: string; summary: string; year: number }>>([]);
  const [newPaperTitle, setNewPaperTitle] = useState('');
  const [newPaperSummary, setNewPaperSummary] = useState('');
  const [citationLinkageCount, setCitationLinkageCount] = useState(0);
  const [activeNotebooksCount, setActiveNotebooksCount] = useState(0);

  // Startup Canvas States
  const [burnRate, setBurnRate] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const canvasSegments = {
    valueProp: 'Autonomous AI Mission Operating System mapping complex timelines.',
    customerSegments: 'SaaS founders, advanced research scientists, self-taught engineers.',
    revenueStreams: 'SaaS subscription, serverless API execution telemetry.'
  };

  // Academic States
  const [flashcards, setFlashcards] = useState<Array<{ question: string; answer: string }>>([]);
  const [flippedCardIdx, setFlippedCardIdx] = useState<number | null>(null);
  const [academicCoursesCount, setAcademicCoursesCount] = useState(0);
  const [semesterGpa, setSemesterGpa] = useState(0.0);
  const [curriculum, setCurriculum] = useState<Array<{ name: string; grade: string }>>([]);

  // Personal States
  const [habits, setHabits] = useState<Array<{ id: string; name: string; streak: number; done: boolean }>>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [longestStreak, setLongestStreak] = useState(0);

  // Synchronize localStorage or default Guest user mockup values on user load
  useEffect(() => {
    if (!user) return;

    if (user.isAnonymous) {
      // Pre-add sandbox mockup data for guest user preview
      setResumeBullets([
        'Designed AWS migration steps.',
        'Optimized serverless Lambda executions.',
        'Engineered CI/CD cloud pipelines.'
      ]);
      setAtsScore(82);
      setApplicationsCount(14);
      setActiveInterviewsCount(3);
      setRoadmapStatus('Senior AWS');
      setCompletedMilestonesCount(2);

      setPapers([
        { id: '1', title: 'Attention Is All You Need', authors: 'Vaswani et al.', summary: 'Introduced Transformer self-attention architecture.', year: 2017 },
        { id: '2', title: 'BERT: Pre-training of Deep Bidirectional Transformers', authors: 'Devlin et al.', summary: 'Bidirectional language representation training framework.', year: 2018 },
        { id: '3', title: 'Generative Adversarial Nets', authors: 'Goodfellow et al.', summary: 'Dual networks competing framework for image synthesis.', year: 2014 }
      ]);
      setCitationLinkageCount(142);
      setActiveNotebooksCount(5);

      setBurnRate(15000);
      setCashBalance(250000);

      setFlashcards([
        { question: 'What is the runtime of binary search?', answer: 'O(log n)' },
        { question: 'Explain CAP theorem.', answer: 'Consistency, Availability, Partition tolerance - pick two.' },
        { question: 'What is Backpropagation?', answer: 'Reverse pass chain rule computing gradients for weight updates.' }
      ]);
      setAcademicCoursesCount(4);
      setSemesterGpa(3.9);
      setCurriculum([
        { name: 'Design & Analysis of Algorithms', grade: 'A+' },
        { name: 'Database Systems (SQL/NoSQL)', grade: 'A' },
        { name: 'Distributed Cloud Architectures', grade: 'A+' }
      ]);

      setHabits([
        { id: '1', name: 'Write Code', streak: 14, done: true },
        { id: '2', name: 'Read Research Papers', streak: 5, done: false },
        { id: '3', name: 'Cardio Workout', streak: 8, done: true }
      ]);
      setLongestStreak(14);
    } else {
      // Logged in user: load saved telemetry or initialize to empty/zero
      const savedBullets = localStorage.getItem(`axiom_bullets_${user.uid}`);
      setResumeBullets(savedBullets ? JSON.parse(savedBullets) : []);

      const savedScore = localStorage.getItem(`axiom_ats_score_${user.uid}`);
      setAtsScore(savedScore ? Number(savedScore) : 0);

      setApplicationsCount(0);
      setActiveInterviewsCount(0);
      setRoadmapStatus('None');
      setCompletedMilestonesCount(0);

      const savedPapers = localStorage.getItem(`axiom_papers_${user.uid}`);
      setPapers(savedPapers ? JSON.parse(savedPapers) : []);
      setCitationLinkageCount(0);
      setActiveNotebooksCount(0);

      const savedBurn = localStorage.getItem(`axiom_burn_rate_${user.uid}`);
      setBurnRate(savedBurn ? Number(savedBurn) : 0);

      const savedCash = localStorage.getItem(`axiom_cash_balance_${user.uid}`);
      setCashBalance(savedCash ? Number(savedCash) : 0);

      setFlashcards([]);
      setAcademicCoursesCount(0);
      setSemesterGpa(0.0);
      setCurriculum([]);

      const savedHabits = localStorage.getItem(`axiom_habits_${user.uid}`);
      const habitsList = savedHabits ? JSON.parse(savedHabits) : [];
      setHabits(habitsList);
      
      const maxStreak = habitsList.reduce((max: number, h: { streak: number }) => Math.max(max, h.streak || 0), 0);
      setLongestStreak(maxStreak);
    }
  }, [user]);

  // Sync snapshot subscription on mount
  useEffect(() => {
    const unsubscribe = initializeMissions();
    return (): void => {
      if (unsubscribe) unsubscribe();
    };
  }, [initializeMissions, user]);

  // Synchronize dynamic stats back into user profile
  useEffect(() => {
    if (!user || !missions) return;
    const activeCount = missions.filter((m) => m.status === 'ACTIVE').length;
    const completedCount = missions.filter((m) => m.status === 'COMPLETED').length;
    
    const profileState = useAuthStore.getState().profile;
    if (profileState) {
      if (
        profileState.stats.missionsActive !== activeCount ||
        profileState.stats.missionsCompleted !== completedCount
      ) {
        useAuthStore.getState().updateProfileStats({
          missionsActive: activeCount,
          missionsCompleted: completedCount,
        }).catch(() => {});
      }
    }
  }, [missions, user]);

  // Handle dynamic additions
  const addResumeBullet = (): void => {
    if (!newBullet.trim()) return;
    const updated = [...resumeBullets, newBullet.trim()];
    setResumeBullets(updated);
    setNewBullet('');
    const newScore = Math.min(atsScore + 4, 100);
    setAtsScore(newScore);
    if (user && !user.isAnonymous) {
      localStorage.setItem(`axiom_bullets_${user.uid}`, JSON.stringify(updated));
      localStorage.setItem(`axiom_ats_score_${user.uid}`, String(newScore));
    }
  };

  const addPaper = (): void => {
    if (!newPaperTitle.trim()) return;
    const newPaper = {
      id: Date.now().toString(),
      title: newPaperTitle.trim(),
      authors: 'User Contributor',
      summary: newPaperSummary.trim() || 'No summary compiled.',
      year: new Date().getFullYear()
    };
    const updated = [...papers, newPaper];
    setPapers(updated);
    setNewPaperTitle('');
    setNewPaperSummary('');
    if (user && !user.isAnonymous) {
      localStorage.setItem(`axiom_papers_${user.uid}`, JSON.stringify(updated));
    }
  };

  const addHabit = (): void => {
    if (!newHabitName.trim()) return;
    const newHabit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      streak: 0,
      done: false
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    setNewHabitName('');
    const maxStreak = updated.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    setLongestStreak(maxStreak);
    if (user && !user.isAnonymous) {
      localStorage.setItem(`axiom_habits_${user.uid}`, JSON.stringify(updated));
    }
  };

  const toggleHabit = (id: string): void => {
    const updated = habits.map(h => {
      if (h.id === id) {
        const nextDone = !h.done;
        return { ...h, done: nextDone, streak: nextDone ? h.streak + 1 : Math.max(h.streak - 1, 0) };
      }
      return h;
    });
    setHabits(updated);
    const maxStreak = updated.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    setLongestStreak(maxStreak);
    if (user && !user.isAnonymous) {
      localStorage.setItem(`axiom_habits_${user.uid}`, JSON.stringify(updated));
    }
  };

  const handleCategoryClick = (catId: string): void => {
    if (user?.isAnonymous && catId !== 'ALL') {
      setShowAuthModal(true);
      return;
    }
    setFilterType(catId);
  };

  const handleServiceLaunch = (targetPath: string): void => {
    if (user?.isAnonymous) {
      setShowAuthModal(true);
    } else {
      router.push(targetPath);
    }
  };

  const handleTrackClick = (missionId: string): void => {
    if (user?.isAnonymous) {
      setShowAuthModal(true);
    } else {
      router.push(`/mission/${missionId}`);
    }
  };

  // Filter based on selected sidebar category or search query
  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.goal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || m.goalType === filterType;
    return matchesSearch && matchesType;
  });

  const activeMissionsCount = missions.filter(m => m.status === 'ACTIVE').length;
  const completedMissionsCount = missions.filter(m => m.status === 'COMPLETED').length;
  const averageHealth = missions.length > 0
    ? Math.round(missions.reduce((sum, m) => sum + m.health.composite, 0) / missions.length)
    : 0;

  const sidebarCategories = [
    { id: 'ALL', label: 'All Operations', icon: Folder },
    { id: 'CAREER', label: 'Career Paths', icon: Briefcase },
    { id: 'RESEARCH', label: 'Research Tracks', icon: Microscope },
    { id: 'STARTUP', label: 'Startup Launchpad', icon: Rocket },
    { id: 'PERSONAL', label: 'Personal Growth', icon: User },
    { id: 'STUDY', label: 'Academic Studies', icon: BookOpen },
  ];

  // 1. Rendering Career OS
  const renderCareerOS = (): React.JSX.Element => (
    <div style={styles.workspaceContainer}>
      <header style={styles.workspaceHeader}>
        <h1 style={styles.workspaceTitle}>Career Intelligence Portal</h1>
        <p style={styles.workspaceSubtitle}>Map industry role gaps, audit resumes, and optimize interview preparedness.</p>
      </header>

      {/* Metrics Row */}
      <section style={styles.analyticsGrid}>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>ATS PROFILE RATING</span>
          <strong style={{ ...styles.metricValue, color: '#10b981' }}>{atsScore}%</strong>
          <span style={styles.metricSub}>Based on bullets</span>
        </div>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>APPLICATIONS LOGGED</span>
          <strong style={styles.metricValue}>{applicationsCount} Submitted</strong>
          <span style={styles.metricSub}>{activeInterviewsCount} Active interviews</span>
        </div>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>ROADMAP STATUS</span>
          <strong style={styles.metricValue}>{roadmapStatus}</strong>
          <span style={styles.metricSub}>{completedMilestonesCount} milestones completed</span>
        </div>
      </section>

      {/* Career Specific Widgets */}
      <div style={styles.workspaceSplit}>
        {/* Resume Analyzer */}
        <div style={styles.card}>
          <h3 style={styles.cardHeaderTitle}>ATS Resume Optimizer</h3>
          <p style={styles.cardHeaderSub}>Review and expand key bullets to match target positions.</p>
          <div style={styles.bulletsList}>
            {resumeBullets.length === 0 ? (
              <p style={{ color: 'var(--sys-txt-muted)', fontSize: '0.8125rem', fontStyle: 'italic', margin: '1rem 0' }}>
                No contribution highlights compiled yet. Add your first achievement bullet below.
              </p>
            ) : (
              resumeBullets.map((b, idx) => (
                <div key={idx} style={styles.bulletItem}>
                  <span style={styles.bulletDot}>•</span>
                  <span style={styles.bulletText}>{b}</span>
                </div>
              ))
            )}
          </div>
          <div style={styles.inputGroup}>
            <input 
              type="text" 
              placeholder="Add professional contribution bullet..." 
              value={newBullet}
              onChange={(e) => setNewBullet(e.target.value)}
              style={styles.inputField}
            />
            <button onClick={addResumeBullet} style={styles.actionBtn}>Optimize Bullet</button>
          </div>
        </div>

        {/* AWS Roadmap */}
        <div style={styles.card}>
          <h3 style={styles.cardHeaderTitle}>AWS Architect Roadmap</h3>
          <p style={styles.cardHeaderSub}>Dynamic competency verification nodes.</p>
          <div style={styles.nodeList}>
            <div style={styles.nodeItem}>
              <CheckCircle size={16} color="#10b981" />
              <div>
                <strong style={styles.nodeTitle}>IAM & Cloud Security Policies</strong>
                <p style={styles.nodeDesc}>RBAC setups, credentials management, keys rotation.</p>
              </div>
            </div>
            <div style={styles.nodeItem}>
              <Clock size={16} color="#3b82f6" />
              <div>
                <strong style={styles.nodeTitle}>Infrastructure as Code (IaC)</strong>
                <p style={styles.nodeDesc}>Terraform modules, state backends, cloud formation drafts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Interview Prep */}
      <div style={styles.fullCard}>
        <div style={styles.fullCardMeta}>
          <Sparkles size={20} color="#3b82f6" />
          <h3 style={styles.fullCardTitle}>AI Mock Interview Simulator</h3>
        </div>
        <p style={styles.fullCardDesc}>Generate custom, domain-specific behavioral mock questions to test your AWS experience.</p>
        <button 
          onClick={() => handleServiceLaunch('/mission/create')}
          style={styles.fullCardLaunchBtn}
        >
          Begin Mock Prep Session →
        </button>
      </div>
    </div>
  );

  // 2. Rendering Research OS
  const renderResearchOS = (): React.JSX.Element => (
    <div style={styles.workspaceContainer}>
      <header style={styles.workspaceHeader}>
        <h1 style={styles.workspaceTitle}>Scientific Knowledge Engine</h1>
        <p style={styles.workspaceSubtitle}>Aggregate literature journals, track cross-citations, and map concept trees.</p>
      </header>

      <section style={styles.analyticsGrid}>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>INDEXED LITERATURE</span>
          <strong style={styles.metricValue}>{papers.length} Papers</strong>
          <span style={styles.metricSub}>Transformer domain focus</span>
        </div>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>CITATION LINKAGE</span>
          <strong style={styles.metricValue}>{citationLinkageCount} Anchors</strong>
          <span style={styles.metricSub}>Cross-linked index</span>
        </div>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>ACTIVE NOTEBOOKS</span>
          <strong style={styles.metricValue}>{activeNotebooksCount} Notebooks</strong>
          <span style={styles.metricSub}>Saved summaries</span>
        </div>
      </section>

      <div style={styles.workspaceSplit}>
        {/* Papers Library */}
        <div style={styles.card}>
          <h3 style={styles.cardHeaderTitle}>Literature Repository</h3>
          <p style={styles.cardHeaderSub}>Review details and summaries of catalogued papers.</p>
          <div style={styles.papersScrollList}>
            {papers.length === 0 ? (
              <p style={{ color: 'var(--sys-txt-muted)', fontSize: '0.8125rem', fontStyle: 'italic', margin: '1rem 0' }}>
                No publications cataloged yet. Submit your first paper title and summary below.
              </p>
            ) : (
              papers.map(p => (
                <div key={p.id} style={styles.paperRow}>
                  <div style={styles.paperMeta}>
                    <strong style={styles.paperTitle}>{p.title}</strong>
                    <span style={styles.paperYear}>{p.year}</span>
                  </div>
                  <p style={styles.paperSummary}>{p.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Paper Form */}
        <div style={styles.card}>
          <h3 style={styles.cardHeaderTitle}>Add Publication Log</h3>
          <p style={styles.cardHeaderSub}>Record references for upcoming literature review timelines.</p>
          <div style={styles.formGroup}>
            <input 
              type="text" 
              placeholder="Paper Title..." 
              value={newPaperTitle} 
              onChange={(e) => setNewPaperTitle(e.target.value)} 
              style={styles.inputField}
            />
            <textarea 
              placeholder="Add key summary insights..." 
              value={newPaperSummary} 
              onChange={(e) => setNewPaperSummary(e.target.value)} 
              style={{ ...styles.inputField, height: '80px', resize: 'none' }}
            />
            <button onClick={addPaper} style={styles.actionBtn}>Catalogue Reference</button>
          </div>
        </div>
      </div>

      {/* Citation Network & Notebook */}
      <div style={styles.fullCard}>
        <div style={styles.fullCardMeta}>
          <BookOpenText size={20} color="#10b981" />
          <h3 style={styles.fullCardTitle}>AI Citation Graph Compiler</h3>
        </div>
        <p style={styles.fullCardDesc}>Generate automated concept links and citations from raw PDF uploads.</p>
        <button 
          onClick={() => handleServiceLaunch('/mission/create')}
          style={{ ...styles.fullCardLaunchBtn, backgroundColor: '#10b981' }}
        >
          Launch Literature Review Setup →
        </button>
      </div>
    </div>
  );

  // 3. Rendering Startup OS
  const renderStartupOS = (): React.JSX.Element => {
    const runwayMonths = Math.round(cashBalance / burnRate);
    return (
      <div style={styles.workspaceContainer}>
        <header style={styles.workspaceHeader}>
          <h1 style={styles.workspaceTitle}>Venture Architecture Lab</h1>
          <p style={styles.workspaceSubtitle}>Build canvases, simulate runway burn, and organize pitch decks.</p>
        </header>

        <section style={styles.analyticsGrid}>
          <div className="hover-card-glow" style={styles.metricCard}>
            <span style={styles.metricLabel}>FINANCIAL RUNWAY</span>
            <strong style={{ ...styles.metricValue, color: '#f59e0b' }}>{runwayMonths} Months</strong>
            <span style={styles.metricSub}>Calculated balance burn</span>
          </div>
          <div className="hover-card-glow" style={styles.metricCard}>
            <span style={styles.metricLabel}>burn-rate / MONTH</span>
            <strong style={styles.metricValue}>${burnRate.toLocaleString()}</strong>
            <span style={styles.metricSub}>Core operating costs</span>
          </div>
          <div className="hover-card-glow" style={styles.metricCard}>
            <span style={styles.metricLabel}>CASH RESERVES</span>
            <strong style={styles.metricValue}>${cashBalance.toLocaleString()}</strong>
            <span style={styles.metricSub}>Bank ledger status</span>
          </div>
        </section>

        <div style={styles.workspaceSplit}>
          {/* Canvas segments */}
          <div style={styles.card}>
            <h3 style={styles.cardHeaderTitle}>Business Model Canvas</h3>
            <p style={styles.cardHeaderSub}>Core value proposition and monetization loops.</p>
            <div style={styles.canvasBlock}>
              <strong style={styles.canvasBlockTitle}>Value Proposition</strong>
              <p style={styles.canvasBlockText}>{canvasSegments.valueProp}</p>
            </div>
            <div style={styles.canvasBlock}>
              <strong style={styles.canvasBlockTitle}>Customer Segments</strong>
              <p style={styles.canvasBlockText}>{canvasSegments.customerSegments}</p>
            </div>
            <div style={styles.canvasBlock}>
              <strong style={styles.canvasBlockTitle}>Revenue Model</strong>
              <p style={styles.canvasBlockText}>{canvasSegments.revenueStreams}</p>
            </div>
          </div>

          {/* Runway Simulator */}
          <div style={styles.card}>
            <h3 style={styles.cardHeaderTitle}>Runway Simulator</h3>
            <p style={styles.cardHeaderSub}>Adjust burn thresholds in real-time to compute runway limits.</p>
            <div style={styles.simulatorRow}>
              <span style={styles.simLabel}>Burn Rate: ${burnRate.toLocaleString()}</span>
              <input 
                type="range" 
                min="5000" 
                max="50000" 
                step="2500" 
                value={burnRate}
                onChange={(e) => setBurnRate(Number(e.target.value))}
                style={styles.rangeSlider}
              />
            </div>
            <div style={styles.simulatorRow}>
              <span style={styles.simLabel}>Cash Balance: ${cashBalance.toLocaleString()}</span>
              <input 
                type="range" 
                min="50000" 
                max="1000000" 
                step="25000" 
                value={cashBalance}
                onChange={(e) => setCashBalance(Number(e.target.value))}
                style={styles.rangeSlider}
              />
            </div>
          </div>
        </div>

        {/* Pitch Deck generator */}
        <div style={styles.fullCard}>
          <div style={styles.fullCardMeta}>
            <Rocket size={20} color="#f59e0b" />
            <h3 style={styles.fullCardTitle}>AI Pitch Deck Generator</h3>
          </div>
          <p style={styles.fullCardDesc}>Generate slide matrices, target market analysis, and product milestone graphs.</p>
          <button 
            onClick={() => handleServiceLaunch('/mission/create')}
            style={{ ...styles.fullCardLaunchBtn, backgroundColor: '#f59e0b' }}
          >
            Launch MVP Blueprint Synthesis →
          </button>
        </div>
      </div>
    );
  };

  // 4. Rendering Academic OS
  const renderAcademicOS = (): React.JSX.Element => (
    <div style={styles.workspaceContainer}>
      <header style={styles.workspaceHeader}>
        <h1 style={styles.workspaceTitle}>Syllabus & Course Planner</h1>
        <p style={styles.workspaceSubtitle}>Organize semester timelines, study flashcards, and run exam mock trials.</p>
      </header>

      <section style={styles.analyticsGrid}>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>ACTIVE COURSES</span>
          <strong style={styles.metricValue}>{academicCoursesCount} Subjects</strong>
          <span style={styles.metricSub}>Computer Science track</span>
        </div>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>FLASHCARDS REGISTERED</span>
          <strong style={styles.metricValue}>{flashcards.length} Cards</strong>
          <span style={styles.metricSub}>Active memory loop</span>
        </div>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>SEMESTER COMPOSITE GPA</span>
          <strong style={{ ...styles.metricValue, color: '#8b5cf6' }}>{semesterGpa.toFixed(1)} / 4.0</strong>
          <span style={styles.metricSub}>A grade performance</span>
        </div>
      </section>

      <div style={styles.workspaceSplit}>
        {/* Flashcards flip deck */}
        <div style={styles.card}>
          <h3 style={styles.cardHeaderTitle}>Flashcard Memory Loop</h3>
          <p style={styles.cardHeaderSub}>Click to flip card and verify answer.</p>
          <div style={styles.flashcardsList}>
            {flashcards.map((f, idx) => (
              <TouchableOpacity 
                key={idx}
                onPress={() => setFlippedCardIdx(flippedCardIdx === idx ? null : idx)}
                style={styles.flashcardItem}
              >
                {flippedCardIdx === idx ? (
                  <div style={styles.cardBack}>
                    <strong style={styles.cardBackTitle}>ANSWER:</strong>
                    <p style={styles.cardBackText}>{f.answer}</p>
                  </div>
                ) : (
                  <div style={styles.cardFront}>
                    <strong style={styles.cardFrontTitle}>QUESTION:</strong>
                    <p style={styles.cardFrontText}>{f.question}</p>
                  </div>
                )}
              </TouchableOpacity>
            ))}
          </div>
        </div>

        {/* Subjects list */}
        <div style={styles.card}>
          <h3 style={styles.cardHeaderTitle}>Semester Curriculum</h3>
          <p style={styles.cardHeaderSub}>Active courses and target grades.</p>
          <div style={styles.subjectsTrack}>
            {curriculum.length === 0 ? (
              <p style={styles.emptyText}>No subjects mapped yet. Launch the Academic OS Planner below.</p>
            ) : (
              curriculum.map((sub, idx) => (
                <div key={idx} style={styles.subjectRow}>
                  <span>{sub.name}</span>
                  <strong style={{ color: '#8b5cf6' }}>{sub.grade}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI tutor prompt */}
      <div style={styles.fullCard}>
        <div style={styles.fullCardMeta}>
          <BookOpen size={20} color="#8b5cf6" />
          <h3 style={styles.fullCardTitle}>AI Academic Syllabus Tutor</h3>
        </div>
        <p style={styles.fullCardDesc}>Generate personalized study guides, flashcard decks, or exam prep timelines.</p>
        <button 
          onClick={() => handleServiceLaunch('/mission/create')}
          style={{ ...styles.fullCardLaunchBtn, backgroundColor: '#8b5cf6' }}
        >
          Configure Exam Planner →
        </button>
      </div>
    </div>
  );

  // 5. Rendering Personal OS
  const renderPersonalOS = (): React.JSX.Element => (
    <div style={styles.workspaceContainer}>
      <header style={styles.workspaceHeader}>
        <h1 style={styles.workspaceTitle}>Life Operating System</h1>
        <p style={styles.workspaceSubtitle}>Log habit streaks, track daily journal entries, and model routines.</p>
      </header>

      <section style={styles.analyticsGrid}>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>HABITS COMPLETED</span>
          <strong style={styles.metricValue}>{habits.filter(h => h.done).length} / {habits.length}</strong>
          <span style={styles.metricSub}>Logged today</span>
        </div>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>LONGEST STREAK</span>
          <strong style={{ ...styles.metricValue, color: '#ec4899' }}>{longestStreak} Days</strong>
          <span style={styles.metricSub}>Habits target</span>
        </div>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>HEALTH METRICS</span>
          <strong style={styles.metricValue}>{longestStreak > 0 ? 'Optimal' : 'Normal'}</strong>
          <span style={styles.metricSub}>Sleep/Activity normal</span>
        </div>
      </section>

      <div style={styles.workspaceSplit}>
        {/* Habit Streaks tracker */}
        <div style={styles.card}>
          <h3 style={styles.cardHeaderTitle}>Habits Streak Tracker</h3>
          <p style={styles.cardHeaderSub}>Check off today's habits to increment streaks.</p>
          <div style={styles.habitsList}>
            {habits.length === 0 ? (
              <p style={{ color: 'var(--sys-txt-muted)', fontSize: '0.8125rem', fontStyle: 'italic', margin: '1rem 0' }}>
                No habit streaks tracking yet. Define your first habit milestone below.
              </p>
            ) : (
              habits.map(h => (
                <div key={h.id} style={styles.habitRow}>
                  <div style={styles.habitMeta}>
                    <input 
                      type="checkbox" 
                      checked={h.done}
                      onChange={() => toggleHabit(h.id)}
                      style={styles.checkboxField}
                    />
                    <span style={h.done ? styles.habitTextDone : styles.habitText}>{h.name}</span>
                  </div>
                  <span style={styles.habitStreak}>{h.streak}d streak</span>
                </div>
              ))
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input 
                type="text"
                placeholder="Log new habit target..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                style={{ ...styles.inputField, padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
              />
              <button 
                onClick={addHabit}
                style={{
                  ...styles.actionBtn,
                  padding: '0.375rem 1rem',
                  fontSize: '0.75rem',
                  backgroundColor: '#ec4899',
                  boxShadow: 'none'
                }}
              >
                Log Habit
              </button>
            </div>
          </div>
        </div>

        {/* Daily Journal textarea */}
        <div style={styles.card}>
          <h3 style={styles.cardHeaderTitle}>Daily Reflection Log</h3>
          <p style={styles.cardHeaderSub}>Thoughts, blockers, or highlights logged today.</p>
          <textarea 
            placeholder="Start writing journal entry..." 
            style={{ ...styles.inputField, height: '140px', resize: 'none' }}
          />
        </div>
      </div>

      {/* Routine Planner */}
      <div style={styles.fullCard}>
        <div style={styles.fullCardMeta}>
          <User size={20} color="#ec4899" />
          <h3 style={styles.fullCardTitle}>AI Routine & Travel Planner</h3>
        </div>
        <p style={styles.fullCardDesc}>Compile structured travel itineraries, daily routines, or health logs.</p>
        <button 
          onClick={() => handleServiceLaunch('/mission/create')}
          style={{ ...styles.fullCardLaunchBtn, backgroundColor: '#ec4899' }}
        >
          Configure Routine Timelines →
        </button>
      </div>
    </div>
  );

  // 6. Rendering All OS (Composite Dashboard)
  const renderAllOS = (): React.JSX.Element => (
    <>
      {/* Header title block */}
      <section style={styles.heroBlock}>
        <h1 style={styles.heroTitle}>Mission Command Center</h1>
        <p style={styles.heroSub}>Monitor active tracks, analyze risk, and trigger generative workflows.</p>
      </section>

      {/* Vercel-style Command Center Analytics Cards */}
      <section style={styles.analyticsGrid}>
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>ACTIVE PIPELINES</span>
          <strong style={styles.metricValue}>{activeMissionsCount}</strong>
          <span style={styles.metricSub}>Operations Running</span>
        </div>
        
        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>COMPOSITE HEALTH</span>
          <strong style={{ ...styles.metricValue, color: 'var(--sys-success)' }}>{averageHealth}%</strong>
          <span style={styles.metricSub}>Optimal execution</span>
        </div>

        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>COMPLETED PATHS</span>
          <strong style={styles.metricValue}>{completedMissionsCount}</strong>
          <span style={styles.metricSub}>Milestones achieved</span>
        </div>

        <div className="hover-card-glow" style={styles.metricCard}>
          <span style={styles.metricLabel}>LEARNING VELOCITY</span>
          <strong style={styles.metricValue}>Steady</strong>
          <span style={styles.metricSub}>AI telemetry calibrated</span>
        </div>
      </section>

      {/* Side-by-Side: Onboarding Launch Banner & AI Recommendations Panel */}
      <div style={styles.workspaceSplit}>
        {/* Mission creator onboarding launcher */}
        <section className="hover-card-glow" style={{ ...styles.card, flex: 2, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155', color: '#ffffff' }}>
          <h2 style={{ ...styles.cardHeaderTitle, color: '#ffffff' }}>Autonomous Mission Synthesis</h2>
          <p style={{ ...styles.cardHeaderSub, color: '#94a3b8' }}>Engage the conversational onboarding assistant to compile an execution timeline, risk matrices, and concept dependencies.</p>

          <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #475569', borderRadius: '12px', marginTop: '1rem' }}>
            <Sparkles size={36} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
            <button
              onClick={() => handleServiceLaunch('/mission/create')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                backgroundColor: '#1a56db',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(26, 86, 219, 0.3)'
              }}
            >
              <span>Launch Onboarding Chat</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* AI Command feed recommendations */}
        <section className="hover-card-glow" style={{ ...styles.card, flex: 1 }}>
          <h3 style={styles.cardHeaderTitle}>Copilot Action Feed</h3>
          <div style={styles.logList}>
            <div style={styles.logItem}>
              <span style={styles.logStatusGreen}>● ACTIVE</span>
              <p style={styles.logText}>Integrate task scheduler constraints to balance daily load bounds.</p>
            </div>
            <div style={styles.logItem}>
              <span style={styles.logStatusAmber}>▲ WARNING</span>
              <p style={styles.logText}>Target paths show minor risk exposure due to tight milestone gaps.</p>
            </div>
            <div style={styles.logItem}>
              <span style={styles.logStatusGreen}>● OPTIMAL</span>
              <p style={styles.logText}>Knowledge Graph cluster mappings synced successfully with Firestore databases.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Active Missions List Segment */}
      <section style={styles.tracksSection}>
        <div style={styles.tracksHeader}>
          <h2 style={styles.sectionTitle}>Active Tracks</h2>
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchBar}
          />
        </div>

        {filteredMissions.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No active execution tracks found under this category. Input a goal above to initialize a track.</p>
          </div>
        ) : (
          <div style={styles.tracksGrid}>
            {filteredMissions.map((m) => (
              <div
                key={m.id}
                onClick={() => handleTrackClick(m.id)}
                style={styles.trackCard}
              >
                <div style={styles.cardHeaderRow}>
                  <span style={styles.cardTag}>{m.goalType}</span>
                  <span style={styles.cardStatusBadge}>{m.status}</span>
                </div>
                <h3 style={styles.cardTitle}>{m.title}</h3>
                <p style={styles.cardGoal}>{m.goal}</p>
                <div style={styles.cardFooter}>
                  <span>Composite Health: {m.health.composite}%</span>
                  <span>Created: {formatDate(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );

  return (
    <div style={styles.container}>
      {/* 1. Collapsible Resizable Sidebar */}
      <aside style={isSidebarCollapsed ? styles.sidebarCollapsed : styles.sidebar}>
        <div style={styles.sidebarBrandRow}>
          {!isSidebarCollapsed && <span style={styles.brandTitle}>AXIOM</span>}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={styles.toggleCollapseBtn}
            title={isSidebarCollapsed ? "Expand Navigation" : "Collapse Navigation"}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <div style={styles.sidebarSection}>
          {!isSidebarCollapsed && <span style={styles.sidebarSectionHeader}>MISSION CATEGORIES</span>}
          <div style={styles.sidebarNav}>
            {sidebarCategories.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={filterType === cat.id ? styles.sidebarLinkActive : styles.sidebarLink}
                >
                  <IconComponent size={16} />
                  {!isSidebarCollapsed && <span>{cat.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.sidebarFooter}>
          <button onClick={() => router.push('/profile')} style={styles.sidebarLink}>
            <Settings size={16} />
            {!isSidebarCollapsed && <span>Settings</span>}
          </button>
          <button onClick={() => signOut()} style={styles.sidebarLinkLogout}>
            <LogOut size={16} />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. Main Content Command Center Viewport */}
      <div style={styles.mainLayout}>
        {/* Top bar control room */}
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <span style={styles.commandPaletteHint}>Press <kbd style={styles.kbd}>Cmd+K</kbd> to launch Command Room</span>
          </div>
          <div style={styles.topbarRight}>
            <div style={styles.userInfo}>
              <span style={styles.userDot} />
              <span>{user?.displayName || 'Command Architect'}</span>
            </div>
          </div>
        </header>

        {/* Command Center Widgets & Main Core Area */}
        <main style={styles.mainContent}>
          {filterType === 'CAREER' && renderCareerOS()}
          {filterType === 'RESEARCH' && renderResearchOS()}
          {filterType === 'STARTUP' && renderStartupOS()}
          {filterType === 'STUDY' && renderAcademicOS()}
          {filterType === 'PERSONAL' && renderPersonalOS()}
          {filterType === 'ALL' && renderAllOS()}
        </main>
      </div>

      {showAuthModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.card}>
            <h3 style={modalStyles.title}>Google Authorization Required</h3>
            <p style={modalStyles.desc}>
              AXIOM requires a validated Google identity to allocate secure cloud databases, sync live telemetry, and persist workspace blueprints.
            </p>
            <div style={modalStyles.actions}>
              <button onClick={async () => {
                try {
                  await signInWithGoogle();
                  setShowAuthModal(false);
                } catch (e) {
                  console.error(e);
                }
              }} style={modalStyles.primaryBtn}>
                Sign In with Google
              </button>
              <button onClick={() => setShowAuthModal(false)} style={modalStyles.secondaryBtn}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// TouchableOpacity mockup wrapper component to maintain React Native similarities in styles
function TouchableOpacity({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: React.CSSProperties }): React.JSX.Element {
  return (
    <div onClick={onPress} style={{ ...style, cursor: 'pointer' }}>
      {children}
    </div>
  );
}

const styles = {
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
    padding: 'var(--space-xl)',
    transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    zIndex: 10,
  } as React.CSSProperties,
  sidebarCollapsed: {
    display: 'flex',
    flexDirection: 'column',
    width: '72px',
    backgroundColor: 'var(--sys-bg-surface)',
    borderRight: '1px solid var(--sys-border-subtle)',
    padding: 'var(--space-xl) var(--space-xs)',
    transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    alignItems: 'center',
    zIndex: 10,
  } as React.CSSProperties,
  sidebarBrandRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-3xl)',
    width: '100%',
    padding: '0 var(--space-sm)',
  } as React.CSSProperties,
  brandTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--sys-primary)',
    letterSpacing: '-0.03em',
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
    backgroundColor: 'var(--sys-bg-surface-hover)',
  } as React.CSSProperties,
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
    flex: 1,
    width: '100%',
  } as React.CSSProperties,
  sidebarSectionHeader: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--sys-txt-muted)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    paddingLeft: 'var(--space-md)',
  } as React.CSSProperties,
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  } as React.CSSProperties,
  sidebarLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--sys-txt-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  sidebarLinkActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--sys-primary)',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  sidebarLinkLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--sys-error)',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
    borderTop: '1px solid var(--sys-border-subtle)',
    paddingTop: 'var(--space-lg)',
  } as React.CSSProperties,
  mainLayout: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflowY: 'auto',
  } as React.CSSProperties,
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-md) var(--space-2xl)',
    borderBottom: '1px solid var(--sys-border-subtle)',
    backgroundColor: 'var(--sys-bg-surface)',
  } as React.CSSProperties,
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,
  commandPaletteHint: {
    fontSize: '0.75rem',
    color: 'var(--sys-txt-muted)',
  } as React.CSSProperties,
  kbd: {
    padding: '2px 5px',
    borderRadius: '4px',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    border: '1px solid var(--sys-border-strong)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
  } as React.CSSProperties,
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--sys-txt-secondary)',
  } as React.CSSProperties,
  userDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--sys-success)',
  } as React.CSSProperties,
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3xl)',
    padding: 'var(--space-4xl) var(--space-2xl)',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  } as React.CSSProperties,
  heroBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
  } as React.CSSProperties,
  heroTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  } as React.CSSProperties,
  heroSub: {
    fontSize: '0.95rem',
    color: 'var(--sys-txt-secondary)',
  } as React.CSSProperties,
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--space-lg)',
  } as React.CSSProperties,
  metricCard: {
    backgroundColor: 'var(--sys-bg-surface)',
    border: '1px solid var(--sys-border-subtle)',
    borderRadius: '12px',
    padding: 'var(--space-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.01)',
  } as React.CSSProperties,
  metricLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--sys-txt-muted)',
    letterSpacing: '0.08em',
  } as React.CSSProperties,
  metricValue: {
    fontSize: '1.75rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  metricSub: {
    fontSize: '0.75rem',
    color: 'var(--sys-txt-muted)',
  } as React.CSSProperties,
  workspaceSplit: {
    display: 'flex',
    flexDirection: 'row',
    gap: 'var(--space-xl)',
    width: '100%',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'var(--sys-bg-surface)',
    border: '1px solid var(--sys-border-subtle)',
    borderRadius: '12px',
    padding: 'var(--space-2xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  } as React.CSSProperties,
  cardHeaderTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--sys-txt-primary)',
  } as React.CSSProperties,
  cardHeaderSub: {
    fontSize: '0.8rem',
    color: 'var(--sys-txt-muted)',
    marginBottom: '8px',
  } as React.CSSProperties,
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  } as React.CSSProperties,
  logItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--sys-border-subtle)',
  } as React.CSSProperties,
  logStatusGreen: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--sys-success)',
  } as React.CSSProperties,
  logStatusAmber: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--sys-warning)',
  } as React.CSSProperties,
  logText: {
    fontSize: '0.8rem',
    color: 'var(--sys-txt-secondary)',
    lineHeight: 1.4,
  } as React.CSSProperties,
  tracksSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
  } as React.CSSProperties,
  tracksHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 750,
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  searchBar: {
    width: '240px',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    border: '1px solid var(--sys-border-strong)',
    color: 'var(--sys-txt-primary)',
    fontSize: '0.8rem',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    border: '1px dashed var(--sys-border-strong)',
    borderRadius: '12px',
    color: 'var(--sys-txt-muted)',
    fontSize: '0.85rem',
  } as React.CSSProperties,
  emptyText: {
    fontSize: '0.8rem',
    color: 'var(--sys-txt-muted)',
    lineHeight: 1.4,
  } as React.CSSProperties,
  tracksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'var(--space-lg)',
  } as React.CSSProperties,
  trackCard: {
    backgroundColor: 'var(--sys-bg-surface)',
    border: '1px solid var(--sys-border-subtle)',
    borderRadius: '10px',
    padding: 'var(--space-xl)',
    cursor: 'pointer',
    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  } as React.CSSProperties,
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  cardTag: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--sys-primary)',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  cardStatusBadge: {
    fontSize: '0.6rem',
    fontWeight: 700,
    backgroundColor: 'rgba(16,185,129,0.1)',
    color: 'var(--sys-success)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--sys-txt-primary)',
  } as React.CSSProperties,
  cardGoal: {
    fontSize: '0.8rem',
    color: 'var(--sys-txt-muted)',
    lineHeight: 1.4,
    flex: 1,
  } as React.CSSProperties,
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    color: 'var(--sys-txt-muted)',
    marginTop: '12px',
    borderTop: '1px solid var(--sys-border-subtle)',
    paddingTop: '8px',
  } as React.CSSProperties,

  // Workspace Specific Styles
  workspaceContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xl)',
  } as React.CSSProperties,
  workspaceHeader: {
    marginBottom: 'var(--space-md)',
  } as React.CSSProperties,
  workspaceTitle: {
    fontSize: '1.8rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  workspaceSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--sys-txt-secondary)',
    marginTop: '4px',
  } as React.CSSProperties,

  // Career Styles
  bulletsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    margin: '8px 0',
  } as React.CSSProperties,
  bulletItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  bulletDot: {
    color: '#3b82f6',
    fontWeight: 900,
  } as React.CSSProperties,
  bulletText: {
    fontSize: '0.85rem',
    color: 'var(--sys-txt-secondary)',
    lineHeight: 1.4,
  } as React.CSSProperties,
  inputGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  } as React.CSSProperties,
  inputField: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    border: '1px solid var(--sys-border-strong)',
    color: 'var(--sys-txt-primary)',
    fontSize: '0.85rem',
  } as React.CSSProperties,
  actionBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  nodeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '8px',
  } as React.CSSProperties,
  nodeItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  nodeTitle: {
    fontSize: '0.875rem',
    color: 'var(--sys-txt-primary)',
  } as React.CSSProperties,
  nodeDesc: {
    fontSize: '0.75rem',
    color: 'var(--sys-txt-muted)',
    marginTop: '2px',
  } as React.CSSProperties,
  fullCard: {
    backgroundColor: 'var(--sys-bg-surface)',
    border: '1px solid var(--sys-border-subtle)',
    borderRadius: '12px',
    padding: 'var(--space-2xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: 'var(--space-lg)',
  } as React.CSSProperties,
  fullCardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  fullCardTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
  } as React.CSSProperties,
  fullCardDesc: {
    fontSize: '0.825rem',
    color: 'var(--sys-txt-muted)',
    lineHeight: 1.4,
  } as React.CSSProperties,
  fullCardLaunchBtn: {
    alignSelf: 'flex-start',
    padding: '8px 16px',
    borderRadius: '6px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  } as React.CSSProperties,

  // Research Styles
  papersScrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '300px',
    overflowY: 'auto' as const,
  } as React.CSSProperties,
  paperRow: {
    padding: '10px',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    borderRadius: '6px',
    border: '1px solid var(--sys-border-strong)',
  } as React.CSSProperties,
  paperMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  paperTitle: {
    fontSize: '0.85rem',
    color: 'var(--sys-txt-primary)',
  } as React.CSSProperties,
  paperYear: {
    fontSize: '0.7rem',
    color: 'var(--sys-txt-muted)',
  } as React.CSSProperties,
  paperSummary: {
    fontSize: '0.75rem',
    color: 'var(--sys-txt-secondary)',
    marginTop: '6px',
    lineHeight: 1.4,
  } as React.CSSProperties,
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  } as React.CSSProperties,

  // Startup Styles
  canvasBlock: {
    padding: '10px',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    borderRadius: '6px',
    border: '1px solid var(--sys-border-strong)',
  } as React.CSSProperties,
  canvasBlockTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#f59e0b',
  } as React.CSSProperties,
  canvasBlockText: {
    fontSize: '0.8rem',
    color: 'var(--sys-txt-secondary)',
    marginTop: '4px',
    lineHeight: 1.4,
  } as React.CSSProperties,
  simulatorRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px',
  } as React.CSSProperties,
  simLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
  } as React.CSSProperties,
  rangeSlider: {
    width: '100%',
    cursor: 'pointer',
  } as React.CSSProperties,

  // Academic Styles
  flashcardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  } as React.CSSProperties,
  flashcardItem: {
    padding: '16px',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    border: '1px solid var(--sys-border-strong)',
    borderRadius: '8px',
    minHeight: '80px',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  cardFront: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  } as React.CSSProperties,
  cardFrontTitle: {
    fontSize: '0.7rem',
    color: '#8b5cf6',
    fontWeight: 700,
  } as React.CSSProperties,
  cardFrontText: {
    fontSize: '0.85rem',
    color: 'var(--sys-txt-primary)',
  } as React.CSSProperties,
  cardBack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  } as React.CSSProperties,
  cardBackTitle: {
    fontSize: '0.7rem',
    color: '#10b981',
    fontWeight: 700,
  } as React.CSSProperties,
  cardBackText: {
    fontSize: '0.85rem',
    color: 'var(--sys-txt-secondary)',
  } as React.CSSProperties,
  subjectsTrack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  } as React.CSSProperties,
  subjectRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 10px',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    borderRadius: '6px',
    fontSize: '0.8rem',
  } as React.CSSProperties,

  // Personal Styles
  habitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  } as React.CSSProperties,
  habitRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    backgroundColor: 'var(--sys-bg-surface-hover)',
    borderRadius: '6px',
  } as React.CSSProperties,
  habitMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  checkboxField: {
    cursor: 'pointer',
  } as React.CSSProperties,
  habitText: {
    fontSize: '0.85rem',
    color: 'var(--sys-txt-primary)',
  } as React.CSSProperties,
  habitTextDone: {
    fontSize: '0.85rem',
    color: 'var(--sys-txt-muted)',
    textDecorationLine: 'line-through',
  } as React.CSSProperties,
  habitStreak: {
    fontSize: '0.75rem',
    color: '#ec4899',
    fontWeight: 600,
  } as React.CSSProperties
};

const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  } as React.CSSProperties,
  card: {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '16px',
    padding: '2.5rem',
    maxWidth: '440px',
    width: '90%',
    textAlign: 'center' as const,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column' as const,
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
    flexDirection: 'column' as const,
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
