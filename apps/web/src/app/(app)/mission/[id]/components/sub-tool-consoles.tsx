'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Trash, CheckCircle2, ChevronRight } from 'lucide-react';
import { callGeminiAPI } from '@/shared/lib/gemini';

interface ConsoleProps {
  missionId: string;
  goalType: string;
  toolId: string;
}

// ----------------------------------------------------
// LOCAL STORAGE CACHE UTILITIES
// ----------------------------------------------------
const loadLocalState = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (_) {
    return defaultValue;
  }
};

const saveLocalState = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // Ignore local storage write errors
  }
};

// ----------------------------------------------------
// 1. CAREER SUB-TOOLS
// ----------------------------------------------------

// Resume Builder
function ResumeBuilderView({ missionId }: { missionId: string }): React.JSX.Element {
  const cacheKey = `axiom_resume_${missionId}`;
  const [resumeData, setResumeData] = useState(() => loadLocalState(cacheKey, {
    fullName: '',
    title: '',
    email: '',
    experience: '',
    skills: ''
  }));
  const [polishLoading, setPolishLoading] = useState(false);

  useEffect(() => {
    saveLocalState(cacheKey, resumeData);
  }, [resumeData, cacheKey]);

  const handlePolish = async (): Promise<void> => {
    if (!resumeData.experience.trim()) return;
    setPolishLoading(true);
    try {
      const prompt = `Polish the following professional experience section to sound highly impactful, utilizing action verbs and highlighting metrics. Experience text:\n"${resumeData.experience}"\nOutput ONLY the polished experience text.`;
      const response = await callGeminiAPI(prompt, "You are a professional ATS resume writer.");
      setResumeData(prev => ({ ...prev, experience: response }));
    } catch (e) {
      console.error(e);
    } finally {
      setPolishLoading(false);
    }
  };

  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>Resume Builder</h3>
      <div style={innerStyles.formGrid}>
        <div>
          <label style={innerStyles.label}>Full Name</label>
          <input 
            type="text" 
            placeholder="e.g. John Doe"
            value={resumeData.fullName}
            onChange={(e) => setResumeData(prev => ({ ...prev, fullName: e.target.value }))}
            style={innerStyles.input}
          />
        </div>
        <div>
          <label style={innerStyles.label}>Professional Title</label>
          <input 
            type="text" 
            placeholder="e.g. Senior Software Engineer"
            value={resumeData.title}
            onChange={(e) => setResumeData(prev => ({ ...prev, title: e.target.value }))}
            style={innerStyles.input}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={innerStyles.label}>Email Address</label>
          <input 
            type="email" 
            placeholder="e.g. john@example.com"
            value={resumeData.email}
            onChange={(e) => setResumeData(prev => ({ ...prev, email: e.target.value }))}
            style={innerStyles.input}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={innerStyles.label}>Key Skills (Comma separated)</label>
          <input 
            type="text" 
            placeholder="React, TypeScript, AWS, Node.js"
            value={resumeData.skills}
            onChange={(e) => setResumeData(prev => ({ ...prev, skills: e.target.value }))}
            style={innerStyles.input}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={innerStyles.label}>Work Experience / Projects</label>
          <textarea 
            rows={5}
            placeholder="Describe your achievements and duties..."
            value={resumeData.experience}
            onChange={(e) => setResumeData(prev => ({ ...prev, experience: e.target.value }))}
            style={innerStyles.textarea}
          />
          <button 
            onClick={handlePolish}
            disabled={polishLoading}
            style={innerStyles.actionButton}
          >
            {polishLoading ? 'Polishing Experience...' : 'Polish with AI'}
          </button>
        </div>
      </div>

      <div style={innerStyles.previewCard}>
        <div style={innerStyles.previewHeader}>RESUME PREVIEW</div>
        <div style={innerStyles.previewDoc}>
          <div style={{ textAlign: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>{resumeData.fullName || 'YOUR NAME'}</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{resumeData.title || 'Professional Title'} • {resumeData.email || 'email@example.com'}</p>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <h5 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#374151' }}>SKILLS</h5>
            <p style={{ fontSize: '0.8125rem', margin: 0, color: '#4b5563' }}>{resumeData.skills || 'No skills added yet'}</p>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <h5 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#374151' }}>EXPERIENCE</h5>
            <p style={{ fontSize: '0.8125rem', whiteSpace: 'pre-wrap', margin: 0, color: '#4b5563', lineHeight: 1.5 }}>
              {resumeData.experience || 'No experience descriptions entered.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ATS Scanner
function AtsScannerView({ missionId }: { missionId: string }): React.JSX.Element {
  const cacheKey = `axiom_ats_${missionId}`;
  const [jobDescription, setJobDescription] = useState(() => loadLocalState(cacheKey, ''));
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ score: number; keywords: string[]; gaps: string[] } | null>(null);

  const handleScan = async (): Promise<void> => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    try {
      const prompt = `Compare the following Job Description against a standard candidate profile to find keyword match percentage, matching keywords, and critical skill gaps. Job Description:\n"${jobDescription}"\nReturn JSON only in format: {"score": 85, "keywords": ["React", "TypeScript"], "gaps": ["Kubernetes", "GraphQL"]}`;
      const response = await callGeminiAPI(prompt, "You are an ATS Match Scanner.");
      let parsed: { score: number; keywords: string[]; gaps: string[] } = { score: 0, keywords: [], gaps: [] };
      try {
        parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
      } catch (_) {
        parsed = { score: 70, keywords: ['TypeScript', 'React'], gaps: ['AWS'] };
      }
      setScanResult(parsed);
      saveLocalState(cacheKey, jobDescription);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>ATS Resume Match Scanner</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label style={innerStyles.label}>Paste Target Job Description</label>
        <textarea 
          rows={6}
          placeholder="Paste the full job posting details here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          style={innerStyles.textarea}
        />
        <button 
          onClick={handleScan}
          disabled={loading}
          style={innerStyles.actionButton}
        >
          {loading ? 'Scanning Resume Match...' : 'Scan ATS Compatibility'}
        </button>
      </div>

      {scanResult && (
        <div style={innerStyles.atsCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
            <div style={innerStyles.atsGauge}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{scanResult.score}%</span>
              <span style={{ fontSize: '0.625rem', color: '#6b7280', textTransform: 'uppercase' }}>Score</span>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>ATS Compatibility Report</h4>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>Based on keyword matching analysis</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', marginBottom: '0.5rem' }}>MATCHING KEYWORDS</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {scanResult.keywords.map(kw => (
                  <span key={kw} style={innerStyles.kwBadgeMatched}>{kw}</span>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.5rem' }}>CRITICAL GAPS FOUND</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {scanResult.gaps.map(gap => (
                  <span key={gap} style={innerStyles.kwBadgeGap}>{gap}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Roadmap Generator View
function RoadmapGeneratorView({ missionId }: { missionId: string }): React.JSX.Element {
  const cacheKey = `axiom_roadmap_${missionId}`;
  const [role, setRole] = useState(() => loadLocalState(cacheKey, 'AWS Cloud Engineer'));
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<Array<{ phase: string; topics: string[] }> | null>(() => {
    return loadLocalState(`${cacheKey}_data`, null);
  });

  const handleGenerate = async (): Promise<void> => {
    setLoading(true);
    try {
      const prompt = `Generate a 3-phase technical learning roadmap to become a "${role}". Return JSON format only: [{"phase": "Phase 1: Foundations", "topics": ["Core Python", "Linux Basics"]}, {"phase": "Phase 2: Intermediate", "topics": ["AWS EC2", "Docker"]}, {"phase": "Phase 3: Advanced", "topics": ["CI/CD pipelines", "Kubernetes"]}]`;
      const response = await callGeminiAPI(prompt, "You are a senior tech curriculum planner.");
      let parsed = [];
      try {
        parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
      } catch (_) {
        parsed = [
          { phase: 'Phase 1: Foundations', topics: ['Basic Scripting', 'Git Command Line'] },
          { phase: 'Phase 2: Specialization', topics: ['Framework Architecture', 'Database Tuning'] }
        ];
      }
      setRoadmap(parsed);
      saveLocalState(cacheKey, role);
      saveLocalState(`${cacheKey}_data`, parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>Roadmap & Certification Planner</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label style={innerStyles.label}>Target Career Role / Skill Track</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="e.g. AWS Solutions Architect"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={innerStyles.input}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            style={innerStyles.actionButtonCompact}
          >
            {loading ? 'Planning...' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {roadmap && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
          {roadmap.map((p, idx) => (
            <div key={idx} style={innerStyles.roadmapCard}>
              <h4 style={innerStyles.roadmapCardTitle}>{p.phase}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {p.topics.map(t => (
                  <span key={t} style={innerStyles.roadmapTopic}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Interview Planner View
function InterviewPlannerView({ missionId }: { missionId: string }): React.JSX.Element {
  const cacheKey = `axiom_interview_${missionId}`;
  const question = 'Explain the difference between SQL and NoSQL databases.';
  const [answer, setAnswer] = useState(() => loadLocalState(cacheKey, ''));
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleEvaluate = async (): Promise<void> => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const prompt = `Evaluate the following answer to the interview question: "${question}". Answer:\n"${answer}"\nProvide a score (out of 10), list strengths, gaps, and output an exemplary answer version.`;
      const response = await callGeminiAPI(prompt, "You are a technical recruiter.");
      setFeedback(response);
      saveLocalState(cacheKey, answer);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>Mock Interview Simulator</h3>
      <div style={innerStyles.cardMuted}>
        <strong style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>QUESTION PROFILE:</strong>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', fontWeight: 600 }}>{question}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        <label style={innerStyles.label}>Your Answer Response</label>
        <textarea 
          rows={5}
          placeholder="Draft your answer here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          style={innerStyles.textarea}
        />
        <button 
          onClick={handleEvaluate}
          disabled={loading}
          style={innerStyles.actionButton}
        >
          {loading ? 'Evaluating Response...' : 'Submit Answer for Evaluation'}
        </button>
      </div>

      {feedback && (
        <div style={innerStyles.previewCard}>
          <div style={innerStyles.previewHeader}>AI INTERVIEWER FEEDBACK</div>
          <div style={{ fontSize: '0.8125rem', whiteSpace: 'pre-wrap', color: '#4b5563', lineHeight: 1.5, padding: '0.75rem' }}>
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
}

// Skill Gap Analysis
function SkillGapView({ missionId }: { missionId: string }): React.JSX.Element {
  const cacheKey = `axiom_skills_${missionId}`;
  const [skills, setSkills] = useState(() => loadLocalState(cacheKey, [
    { name: 'JavaScript / React', current: 3, target: 5 },
    { name: 'TypeScript', current: 2, target: 4 },
    { name: 'AWS Cloud Services', current: 1, target: 4 },
    { name: 'Docker Containers', current: 2, target: 3 },
  ]));

  const updateSkill = (idx: number, field: 'current' | 'target', val: number): void => {
    const updated = [...skills];
    updated[idx] = { ...updated[idx], [field]: val };
    setSkills(updated);
    saveLocalState(cacheKey, updated);
  };

  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>Skills Matrix & Gap Analysis</h3>
      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 1rem 0' }}>Slide values (1-5) to reflect your current proficiency compared to your target position requirements.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {skills.map((s, idx) => (
          <div key={s.name} style={innerStyles.skillRow}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                Gap: {s.target - s.current} levels
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <span style={innerStyles.rangeLabel}>Current: {s.current}/5</span>
                <input 
                  type="range" 
                  min="1" 
                  max="5"
                  value={s.current}
                  onChange={(e) => updateSkill(idx, 'current', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={innerStyles.rangeLabel}>Required: {s.target}/5</span>
                <input 
                  type="range" 
                  min="1" 
                  max="5"
                  value={s.target}
                  onChange={(e) => updateSkill(idx, 'target', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Job Tracker View
function JobTrackerView({ missionId }: { missionId: string }): React.JSX.Element {
  const cacheKey = `axiom_jobs_${missionId}`;
  const [jobs, setJobs] = useState<Array<{ company: string; role: string; stage: string }>>(() => {
    return loadLocalState(cacheKey, [
      { company: 'Google', role: 'Staff Eng', stage: 'Applied' },
      { company: 'Vercel', role: 'Solutions Architect', stage: 'Interviewing' },
    ]);
  });
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newStage, setNewStage] = useState('Applied');

  const handleAdd = (): void => {
    if (!newCompany || !newRole) return;
    const list = [...jobs, { company: newCompany, role: newRole, stage: newStage }];
    setJobs(list);
    saveLocalState(cacheKey, list);
    setNewCompany('');
    setNewRole('');
  };

  const removeJob = (idx: number): void => {
    const list = jobs.filter((_, i) => i !== idx);
    setJobs(list);
    saveLocalState(cacheKey, list);
  };

  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>Job Applications Tracker</h3>
      
      <div style={innerStyles.formGrid}>
        <div>
          <label style={innerStyles.label}>Company</label>
          <input 
            type="text" 
            placeholder="Google"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            style={innerStyles.input}
          />
        </div>
        <div>
          <label style={innerStyles.label}>Role</label>
          <input 
            type="text" 
            placeholder="Frontend Developer"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            style={innerStyles.input}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={innerStyles.label}>Application Stage</label>
          <select 
            value={newStage} 
            onChange={(e) => setNewStage(e.target.value)}
            style={innerStyles.select}
          >
            <option value="Wishlist">Wishlist</option>
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Offer">Offer Received</option>
          </select>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <button onClick={handleAdd} style={innerStyles.actionButton}>
            + Add Opportunity
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        {jobs.map((job, idx) => (
          <div key={idx} style={innerStyles.jobRow}>
            <div>
              <strong style={{ fontSize: '0.875rem' }}>{job.company}</strong>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{job.role}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={job.stage === 'Offer' ? innerStyles.stageOffer : innerStyles.stageLabel}>{job.stage}</span>
              <button onClick={() => removeJob(idx)} style={innerStyles.deleteBtn}>
                <Trash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Salary Intelligence
function SalaryIntelView({ missionId }: { missionId: string }): React.JSX.Element {
  const cacheKey = `axiom_salary_${missionId}`;
  const [role, setRole] = useState(() => loadLocalState(cacheKey, 'Software Engineer'));
  const [data, setData] = useState<{ low: number; median: number; high: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async (): Promise<void> => {
    setLoading(true);
    try {
      const prompt = `Estimate annual tech salary statistics in USD for target role: "${role}". Return JSON format only: {"low": 85000, "median": 135000, "high": 185000}`;
      const response = await callGeminiAPI(prompt, "You are a salary negotiator helper.");
      let parsed = { low: 70000, median: 110000, high: 160000 };
      try {
        parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
      } catch (_) {
        // Fallback to default estimated ranges
      }
      setData(parsed);
      saveLocalState(cacheKey, role);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>Salary Market Intelligence</h3>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Enter job role..."
          style={innerStyles.input}
        />
        <button onClick={handleFetch} disabled={loading} style={innerStyles.actionButtonCompact}>
          {loading ? 'Scanning...' : 'Get Rates'}
        </button>
      </div>

      {data && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div style={innerStyles.salaryScaleBox}>
              <span style={{ fontSize: '0.625rem', color: '#ef4444' }}>25th PERCENTILE</span>
              <strong style={{ fontSize: '1.125rem' }}>${data.low.toLocaleString()}</strong>
            </div>
            <div style={innerStyles.salaryScaleBoxActive}>
              <span style={{ fontSize: '0.625rem', color: '#10b981' }}>MEDIAN SCALE</span>
              <strong style={{ fontSize: '1.125rem' }}>${data.median.toLocaleString()}</strong>
            </div>
            <div style={innerStyles.salaryScaleBox}>
              <span style={{ fontSize: '0.625rem', color: '#3b82f6' }}>90th PERCENTILE</span>
              <strong style={{ fontSize: '1.125rem' }}>${data.high.toLocaleString()}</strong>
            </div>
          </div>
          
          <div style={innerStyles.cardMuted}>
            <strong style={{ fontSize: '0.75rem', color: '#047857' }}>Negotiation Advice:</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', lineHeight: 1.5, color: '#4b5563' }}>
              Base your initial expectations on the Median scale. Always demand range expectations early in recruiters chats to optimize leverage boundaries.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Company Preparation
function CompanyPrepView({ missionId }: { missionId: string }): React.JSX.Element {
  const cacheKey = `axiom_company_${missionId}`;
  const [company, setCompany] = useState(() => loadLocalState(cacheKey, 'Amazon'));
  const [loading, setLoading] = useState(false);
  const [prep, setPrep] = useState<string | null>(null);

  const handlePrep = async (): Promise<void> => {
    setLoading(true);
    try {
      const prompt = `Provide target preparation notes for interviewing at target company: "${company}". Highlight leadership values, standard mock question areas, and cultural characteristics.`;
      const response = await callGeminiAPI(prompt, "You are a career consultant.");
      setPrep(response);
      saveLocalState(cacheKey, company);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>Target Company Preparation</h3>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Target Company Name..."
          style={innerStyles.input}
        />
        <button onClick={handlePrep} disabled={loading} style={innerStyles.actionButtonCompact}>
          {loading ? 'Compiling...' : 'Get Intel'}
        </button>
      </div>

      {prep && (
        <div style={innerStyles.previewCard}>
          <div style={innerStyles.previewHeader}>{company.toUpperCase()} PREPARATION PROFILE</div>
          <div style={{ fontSize: '0.8125rem', whiteSpace: 'pre-wrap', color: '#4b5563', lineHeight: 1.5, padding: '0.75rem' }}>
            {prep}
          </div>
        </div>
      )}
    </div>
  );
}

// Portfolio Builder
function PortfolioBuilderView({ missionId }: { missionId: string }): React.JSX.Element {
  const cacheKey = `axiom_portfolio_${missionId}`;
  const [projects, setProjects] = useState(() => loadLocalState(cacheKey, [
    { title: 'AI Automation Orchestrator', tech: 'Next.js, TypeScript, Gemini API', url: 'https://github.com' }
  ]));
  const [newTitle, setNewTitle] = useState('');
  const [newTech, setNewTech] = useState('');

  const handleAdd = (): void => {
    if (!newTitle || !newTech) return;
    const list = [...projects, { title: newTitle, tech: newTech, url: 'https://github.com' }];
    setProjects(list);
    saveLocalState(cacheKey, list);
    setNewTitle('');
    setNewTech('');
  };

  const removeProj = (idx: number): void => {
    const list = projects.filter((_, i) => i !== idx);
    setProjects(list);
    saveLocalState(cacheKey, list);
  };

  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>Portfolio Builder</h3>
      
      <div style={innerStyles.formGrid}>
        <div>
          <label style={innerStyles.label}>Project Title</label>
          <input 
            type="text" 
            placeholder="Cloud Infrastructure automation"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={innerStyles.input}
          />
        </div>
        <div>
          <label style={innerStyles.label}>Tech Stack</label>
          <input 
            type="text" 
            placeholder="React, Terraform"
            value={newTech}
            onChange={(e) => setNewTech(e.target.value)}
            style={innerStyles.input}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <button onClick={handleAdd} style={innerStyles.actionButton}>
            + Add Portfolio Project
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
        {projects.map((proj, idx) => (
          <div key={idx} style={innerStyles.jobRow}>
            <div>
              <strong style={{ fontSize: '0.875rem' }}>{proj.title}</strong>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{proj.tech}</div>
            </div>
            <button onClick={() => removeProj(idx)} style={innerStyles.deleteBtn}>
              <Trash size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Generic Backup Tool View for undefined/other tabs
function GenericSubToolView({ toolId }: { toolId: string }): React.JSX.Element {
  return (
    <div style={innerStyles.panel}>
      <h3 style={innerStyles.panelTitle}>{toolId.replace('-', ' ').toUpperCase()}</h3>
      <div style={innerStyles.cardMuted}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#4b5563', lineHeight: 1.5 }}>
          Workspace module <strong>{toolId}</strong> is initialized. Use the control cards or chatbot options to model and plan your specific workspace requirements.
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. MAIN ROUTER PORT
// ----------------------------------------------------
export function InteractiveSubToolConsole({ missionId, goalType, toolId }: ConsoleProps): React.JSX.Element {
  const isCareer = goalType === 'CAREER' || goalType === 'SKILL_LEARNING';

  if (!isCareer) {
    return <GenericSubToolView toolId={toolId} />;
  }

  switch (toolId) {
    case 'resume':
      return <ResumeBuilderView missionId={missionId} />;
    case 'ats':
      return <AtsScannerView missionId={missionId} />;
    case 'roadmap':
      return <RoadmapGeneratorView missionId={missionId} />;
    case 'interview':
      return <InterviewPlannerView missionId={missionId} />;
    case 'skills':
      return <SkillGapView missionId={missionId} />;
    case 'jobs':
      return <JobTrackerView missionId={missionId} />;
    case 'salary':
      return <SalaryIntelView missionId={missionId} />;
    case 'company':
      return <CompanyPrepView missionId={missionId} />;
    case 'portfolio':
      return <PortfolioBuilderView missionId={missionId} />;
    default:
      return <GenericSubToolView toolId={toolId} />;
  }
}

// ----------------------------------------------------
// 3. RIGHT PANEL CONTEXTUAL ASSISTANT
// ----------------------------------------------------
export function SubToolRightPanel({ toolId }: { missionId: string; goalType: string; toolId: string }): React.JSX.Element {
  const getContextGuide = (): { title: string; desc: string; checklist: string[]; prompts: string[] } => {
    switch (toolId) {
      case 'resume':
        return {
          title: 'Resume Guide',
          desc: 'Structure your experience for maximum readability by automated parsing engines.',
          checklist: [
            'Maintain a clean, single-column design',
            'Avoid tables, columns, and raw graphics',
            'Incorporate keywords from target roles'
          ],
          prompts: [
            'Format skills for ATS',
            'Draft software engineer summary'
          ]
        };
      case 'ats':
        return {
          title: 'ATS Scanner Assistant',
          desc: 'Compare target descriptions against your resume blueprint to surface gaps.',
          checklist: [
            'Add exact keyword spellings',
            'Fix section headers standard names',
            'Keep spacing clean and basic'
          ],
          prompts: [
            'Explain how ATS counts keywords',
            'Find synonym verbs for developer'
          ]
        };
      case 'roadmap':
        return {
          title: 'Roadmap Guide',
          desc: 'Manage milestones and cert targets for your domain specialization.',
          checklist: [
            'Complete core scripting certs',
            'Focus heavily on Docker / Linux systems',
            'Build 2 end-to-end cloud projects'
          ],
          prompts: [
            'Best certification order for DevOps',
            'How long to study AWS SysOps'
          ]
        };
      case 'interview':
        return {
          title: 'Interview Copilot',
          desc: 'Refine technical and STAR behavioral interview answers.',
          checklist: [
            'Use Situation, Task, Action, Result',
            'Keep answers under 3 minutes spoken',
            'Detail metrics and business outcomes'
          ],
          prompts: [
            'Give sample behavioral answers',
            'Mock interview React framework'
          ]
        };
      case 'skills':
        return {
          title: 'Skill Gap Optimizer',
          desc: 'Identify which technologies you need to learn to remain competitive.',
          checklist: [
            'Focus on gaps bigger than 2 levels',
            'Link gaps to concrete study courses',
            'Apply skills in portfolio projects'
          ],
          prompts: [
            'Suggest course for AWS gaps',
            'How to learn TypeScript fast'
          ]
        };
      case 'jobs':
        return {
          title: 'Opportunity Tracker Helper',
          desc: 'Manage deadlines, target salaries, and networking status.',
          checklist: [
            'Send follow-up mail after 3 days',
            'Connect with hiring managers on LinkedIn',
            'Customize resume for each offer'
          ],
          prompts: [
            'Hiring manager email template',
            'Job application tracker tips'
          ]
        };
      case 'salary':
        return {
          title: 'Salary Negotiation Guide',
          desc: 'Optimize offer details and package parameters.',
          checklist: [
            'Never state absolute numbers first',
            'Always negotiate equity or bonuses',
            'Verify local cost of living averages'
          ],
          prompts: [
            'Polite negotiation text prompt',
            'Recruiter counter-offer template'
          ]
        };
      case 'company':
        return {
          title: 'Company Researcher',
          desc: 'Understand culture vectors and products before the interview.',
          checklist: [
            'Read 3 company blog posts',
            'Verify main revenue source model',
            'Find common LinkedIn connections'
          ],
          prompts: [
            'Amazon leadership principles prep',
            'Standard questions to ask interviewers'
          ]
        };
      case 'portfolio':
        return {
          title: 'Portfolio Consultant',
          desc: 'Build systems that display concrete technical problem solving.',
          checklist: [
            'Include clean README with diagram',
            'Write clean unit testing suite',
            'Provide active live demo deployment link'
          ],
          prompts: [
            'Recommend cloud portfolio project',
            'Read README writing guidelines'
          ]
        };
      default:
        return {
          title: 'Tool Help & Guides',
          desc: 'Plan, configure, and monitor your specific mission modules.',
          checklist: [
            'Set target objectives in Overview',
            'Draft outline setup scripts',
            'Consult your AI Copilot on the right'
          ],
          prompts: [
            'How to configure this module',
            'Generate setup blueprint template'
          ]
        };
    }
  };

  const guide = getContextGuide();

  return (
    <div style={rightPanelStyles.wrapper}>
      <header style={rightPanelStyles.header}>
        <Zap size={16} style={{ color: '#10b981' }} />
        <h3 style={rightPanelStyles.title}>{guide.title}</h3>
      </header>

      <p style={rightPanelStyles.desc}>{guide.desc}</p>

      <div style={rightPanelStyles.section}>
        <span style={rightPanelStyles.label}>CHECKLIST GUIDELINES</span>
        <div style={rightPanelStyles.checklist}>
          {guide.checklist.map((item, idx) => (
            <div key={idx} style={rightPanelStyles.checkItem}>
              <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0, marginTop: '0.125rem' }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={rightPanelStyles.section}>
        <span style={rightPanelStyles.label}>RECOMMENDED AI PROMPTS</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {guide.prompts.map((p, idx) => (
            <div key={idx} style={rightPanelStyles.promptBox}>
              <span style={{ fontSize: '0.75rem' }}>{p}</span>
              <ChevronRight size={12} style={{ color: '#6b7280' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// INTERNAL STYLES
// ----------------------------------------------------
const innerStyles = {
  panel: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  } as React.CSSProperties,
  panelTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    margin: 0,
    color: '#111827',
  } as React.CSSProperties,
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '0.375rem',
    display: 'block',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8125rem',
    outline: 'none',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  select: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8125rem',
    backgroundColor: '#ffffff',
    outline: 'none',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8125rem',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  actionButton: {
    padding: '0.625rem 1rem',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  actionButtonCompact: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  previewCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
  } as React.CSSProperties,
  previewHeader: {
    backgroundColor: '#f1f5f9',
    padding: '0.5rem 0.75rem',
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: '#475569',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
  } as React.CSSProperties,
  previewDoc: {
    backgroundColor: '#ffffff',
    padding: '1.25rem',
    minHeight: '200px',
    margin: '1rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  } as React.CSSProperties,
  atsCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  atsGauge: {
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '50%',
    border: '3px solid #10b981',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  } as React.CSSProperties,
  kwBadgeMatched: {
    fontSize: '0.6875rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 500,
  } as React.CSSProperties,
  kwBadgeGap: {
    fontSize: '0.6875rem',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 500,
  } as React.CSSProperties,
  roadmapCard: {
    backgroundColor: '#f8fafc',
    borderLeft: '4px solid #3b82f6',
    borderTop: '1px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
    padding: '0.875rem 1rem',
    borderRadius: '0 8px 8px 0',
  } as React.CSSProperties,
  roadmapCardTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    margin: 0,
    color: '#1e3a8a',
  } as React.CSSProperties,
  roadmapTopic: {
    fontSize: '0.75rem',
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 500,
  } as React.CSSProperties,
  cardMuted: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
  } as React.CSSProperties,
  rangeLabel: {
    fontSize: '0.6875rem',
    color: '#64748b',
    fontWeight: 600,
    display: 'block',
    marginBottom: '0.125rem',
  } as React.CSSProperties,
  skillRow: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
  } as React.CSSProperties,
  jobRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
  } as React.CSSProperties,
  deleteBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  stageLabel: {
    fontSize: '0.6875rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    fontWeight: 600,
  } as React.CSSProperties,
  stageOffer: {
    fontSize: '0.6875rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    fontWeight: 600,
  } as React.CSSProperties,
  salaryScaleBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '0.75rem',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  } as React.CSSProperties,
  salaryScaleBoxActive: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    padding: '0.75rem',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  } as React.CSSProperties,
};

const rightPanelStyles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    padding: '1.25rem',
    height: '100%',
    overflowY: 'auto',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '0.75rem',
  } as React.CSSProperties,
  title: {
    fontSize: '0.875rem',
    fontWeight: 700,
    margin: 0,
    color: '#f8fafc',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  desc: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: 0,
    lineHeight: 1.5,
  } as React.CSSProperties,
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.625rem',
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '0.08em',
  } as React.CSSProperties,
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  } as React.CSSProperties,
  checkItem: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#cbd5e1',
    lineHeight: 1.4,
  } as React.CSSProperties,
  promptBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 0.75rem',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#e2e8f0',
    transition: 'all 0.2s',
  } as React.CSSProperties,
};
