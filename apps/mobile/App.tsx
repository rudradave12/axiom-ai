import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  Home, 
  Sparkles, 
  Settings as SettingsIcon, 
  Briefcase, 
  Microscope, 
  Rocket, 
  GraduationCap, 
  User, 
  Send,
  Zap,
  Layout,
  ListTodo,
  BrainCircuit,
  Lock,
  Globe,
  Bell,
  Trash2,
  FileText
} from 'lucide-react-native';

interface Mission {
  id: string;
  title: string;
  category: 'CAREER' | 'RESEARCH' | 'STARTUP' | 'ACADEMIC' | 'PERSONAL';
  goal: string;
  status: 'ACTIVE' | 'COMPLETED';
  health: number;
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

export default function App(): React.JSX.Element {
  // Navigation: 'dashboard' | 'create' | 'workspace' | 'settings'
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'workspace' | 'settings'>('dashboard');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  
  // Settings States
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Mock Missions State
  const [missions, setMissions] = useState<Mission[]>([
    { id: '1', title: 'Cloud Architect Tracks', category: 'CAREER', goal: 'Map career path to senior AWS Cloud Architect.', status: 'ACTIVE', health: 92 },
    { id: '2', title: 'Deep Learning Review', category: 'RESEARCH', goal: 'Summarize 10 recent LLM attention papers.', status: 'ACTIVE', health: 88 },
    { id: '3', title: 'SaaS Launch Framework', category: 'STARTUP', goal: 'Structure cost matrix and landing milestones.', status: 'ACTIVE', health: 76 }
  ]);

  // Conversational Onboarding States
  const [chatCategory, setChatCategory] = useState<'CAREER' | 'RESEARCH' | 'STARTUP' | 'ACADEMIC' | 'PERSONAL' | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [composerValue, setComposerValue] = useState('');
  const [createStep, setCreateStep] = useState(0); // 0: select cat, 1: ask goal, 2: ask timeline, 3: compile
  const [isCompiling, setIsCompiling] = useState(false);

  // Workspace Detail States
  const [activeTab, setActiveTab] = useState('overview');
  const [toolContent, setToolContent] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);

  // Auto scroll references for Chat
  const chatScrollRef = useRef<ScrollView>(null);

  // 1. Navigation controllers
  const navigateToWorkspace = (mission: Mission): void => {
    setSelectedMission(mission);
    setActiveTab('overview');
    setCurrentView('workspace');
    setToolContent(`This is your custom ${mission.category} Workspace console. Select one of the dynamic tools in the navigation tab list below to begin.`);
  };

  // 2. Onboarding controllers
  const startConversation = (cat: 'CAREER' | 'RESEARCH' | 'STARTUP' | 'ACADEMIC' | 'PERSONAL'): void => {
    setChatCategory(cat);
    setCreateStep(1);
    
    let aiWelcome = '';
    switch(cat) {
      case 'CAREER': aiWelcome = "Initiating Career Workspace. What job title or tech skill gap are we bridging today?"; break;
      case 'RESEARCH': aiWelcome = "Initiating Research Workspace. What paper domain or review thesis would you like to compile?"; break;
      case 'STARTUP': aiWelcome = "Initiating Startup Workspace. What SaaS product blueprint or cost roadmap are we modeling?"; break;
      case 'ACADEMIC': aiWelcome = "Initiating Academic Workspace. What syllabus scope or test deadlines are we preparing for?"; break;
      case 'PERSONAL': aiWelcome = "Initiating Personal Growth Workspace. What routine habits or travel schedule parameters are we mapping?"; break;
    }
    setChatMessages([{ sender: 'ai', text: aiWelcome }]);
  };

  const handleSendMessage = (): void => {
    if (!composerValue.trim()) return;
    const userText = composerValue.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setComposerValue('');

    setTimeout(() => {
      if (createStep === 1) {
        setCreateStep(2);
        setChatMessages(prev => [...prev, {
          sender: 'ai',
          text: "Understood. Do you have a target completion timeline or deadline in mind? (e.g. '3 months', 'by September', or 'none')"
        }]);
      } else if (createStep === 2) {
        setCreateStep(3);
        setChatMessages(prev => [...prev, {
          sender: 'ai',
          text: "Excellent. Finally, are there any tool constraints or regional preferences we should prioritize?"
        }]);
      } else if (createStep === 3) {
        triggerSynthesis();
      }
    }, 800);
  };

  const triggerSynthesis = (): void => {
    setIsCompiling(true);
    setTimeout(() => {
      const userAnswers = chatMessages.filter(m => m.sender === 'user').map(m => m.text);
      const newId = (missions.length + 1).toString();
      const newMission: Mission = {
        id: newId,
        title: `${chatCategory} - ${userAnswers[0]?.slice(0, 20) || 'Objective'}`,
        category: chatCategory || 'PERSONAL',
        goal: userAnswers[0] || '',
        status: 'ACTIVE',
        health: 100
      };
      setMissions(prev => [...prev, newMission]);
      setIsCompiling(false);
      setCreateStep(0);
      setChatCategory(null);
      navigateToWorkspace(newMission);
    }, 2000);
  };

  // 3. Workspace Console AI optimization
  const executeToolAI = (): void => {
    if (!promptInput.trim()) return;
    setAiThinking(true);
    setTimeout(() => {
      setToolContent(prev => `${prev}\n\n[AI Optimization Checkpoint]: Custom updates compiled successfully for: "${promptInput}".`);
      setPromptInput('');
      setAiThinking(false);
    }, 1500);
  };

  // Styles dynamically derived based on Theme
  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  const renderDashboard = (): React.JSX.Element => {
    return (
      <ScrollView style={themeStyles.scrollContent}>
        {/* Header telemetry metrics */}
        <View style={themeStyles.metricsGrid}>
          <View style={themeStyles.metricItem}>
            <Text style={themeStyles.metricVal}>{missions.length}</Text>
            <Text style={themeStyles.metricLbl}>ACTIVE PIPELINES</Text>
          </View>
          <View style={themeStyles.metricItem}>
            <Text style={{ ...themeStyles.metricVal, color: '#10b981' }}>88%</Text>
            <Text style={themeStyles.metricLbl}>COMPOSITE HEALTH</Text>
          </View>
        </View>

        {/* Synthesis chat launcher card */}
        <TouchableOpacity 
          onPress={() => {
            setCreateStep(0);
            setChatCategory(null);
            setChatMessages([]);
            setCurrentView('create');
          }} 
          style={themeStyles.launchCard}
        >
          <View style={themeStyles.launchHeader}>
            <Sparkles size={20} color="#3b82f6" />
            <Text style={themeStyles.launchTitle}>Autonomous Synthesis</Text>
          </View>
          <Text style={themeStyles.launchDesc}>Engage conversational assistant onboarding to configure new workspace timeline and tasks.</Text>
          <View style={themeStyles.launchBtn}>
            <Text style={themeStyles.launchBtnText}>Launch Onboarding Chat →</Text>
          </View>
        </TouchableOpacity>

        {/* Tracks List */}
        <Text style={themeStyles.sectionTitle}>Active Operation Tracks</Text>
        {missions.map(m => (
          <TouchableOpacity 
            key={m.id} 
            onPress={() => navigateToWorkspace(m)} 
            style={themeStyles.trackCard}
          >
            <View style={themeStyles.trackMeta}>
              <Text style={themeStyles.trackCat}>{m.category}</Text>
              <Text style={themeStyles.trackHealth}>Health: {m.health}%</Text>
            </View>
            <Text style={themeStyles.trackTitle}>{m.title}</Text>
            <Text numberOfLines={2} style={themeStyles.trackGoal}>{m.goal}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderCreate = (): React.JSX.Element => {
    if (createStep === 0) {
      const cats = [
        { id: 'CAREER', label: 'Career Workspace', icon: Briefcase, color: '#3b82f6' },
        { id: 'RESEARCH', label: 'Research Tracks', icon: Microscope, color: '#10b981' },
        { id: 'STARTUP', label: 'Startup Launchpad', icon: Rocket, color: '#f59e0b' },
        { id: 'ACADEMIC', label: 'Academic Studies', icon: GraduationCap, color: '#8b5cf6' },
        { id: 'PERSONAL', label: 'Personal Growth', icon: User, color: '#ec4899' }
      ];

      return (
        <ScrollView style={themeStyles.scrollContent}>
          <Text style={themeStyles.catSelectTitle}>Select Workspace Category</Text>
          <Text style={themeStyles.catSelectDesc}>Choose template scope to launch conversational onboarding.</Text>
          {cats.map(c => {
            const Icon = c.icon;
            return (
              <TouchableOpacity 
                key={c.id} 
                onPress={() => startConversation(c.id as any)} 
                style={themeStyles.catSelectorBtn}
              >
                <Icon size={20} color={c.color} />
                <Text style={themeStyles.catSelectorBtnText}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );
    }

    if (isCompiling) {
      return (
        <View style={themeStyles.compilingContainer}>
          <ActivityIndicator size="large" color="#1a56db" />
          <Text style={themeStyles.compilingTitle}>Synthesizing Workspace...</Text>
          <Text style={themeStyles.compilingDesc}>Compiling roadmap steps, concept dependency graphs, and tasks.</Text>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView ref={chatScrollRef} style={themeStyles.chatMessagesScroll}>
          {chatMessages.map((m, idx) => (
            <View 
              key={idx} 
              style={m.sender === 'ai' ? themeStyles.msgRowAi : themeStyles.msgRowUser}
            >
              <View style={m.sender === 'ai' ? themeStyles.bubbleAi : themeStyles.bubbleUser}>
                <Text style={m.sender === 'ai' ? themeStyles.bubbleTextAi : themeStyles.bubbleTextUser}>
                  {m.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={themeStyles.composerContainer}>
          <TextInput
            placeholder="Type your response..."
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            value={composerValue}
            onChangeText={setComposerValue}
            style={themeStyles.composerInput}
          />
          <TouchableOpacity onPress={handleSendMessage} style={themeStyles.sendBtn}>
            <Send size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderWorkspace = (): React.JSX.Element => {
    if (!selectedMission) return <Text>No Mission Selected</Text>;
    
    // Dynamic sub-tool tabs depending on the Category
    const getTools = (cat: string) => {
      switch(cat) {
        case 'CAREER': return ['overview', 'resume', 'roadmap', 'jobs'];
        case 'RESEARCH': return ['overview', 'pdf-reader', 'citations', 'graph'];
        case 'STARTUP': return ['overview', 'business-plan', 'financials', 'deck'];
        case 'ACADEMIC': return ['overview', 'assignments', 'flashcards', 'tutor'];
        case 'PERSONAL':
        default: return ['overview', 'habits', 'journal', 'routine'];
      }
    };

    const tools = getTools(selectedMission.category);

    return (
      <View style={{ flex: 1 }}>
        <View style={themeStyles.wsHeader}>
          <Text style={themeStyles.wsTitle}>{selectedMission.title}</Text>
          <Text style={themeStyles.wsSub}>{selectedMission.category} Track</Text>
        </View>

        {/* Active tab tool selectors */}
        <View style={themeStyles.wsTabsRow}>
          {tools.map(t => (
            <TouchableOpacity 
              key={t} 
              onPress={() => {
                setActiveTab(t);
                if (t === 'overview') {
                  setToolContent(`Mission Objective Summary: ${selectedMission.goal}\n\nComposite health metrics computed optimally.`);
                } else {
                  setToolContent(`Custom workspace container compiled for tool: "${t.toUpperCase()}". Prompt Copilot below to optimize.`);
                }
              }} 
              style={activeTab === t ? themeStyles.wsTabActive : themeStyles.wsTab}
            >
              <Text style={activeTab === t ? themeStyles.wsTabTextActive : themeStyles.wsTabText}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={themeStyles.wsContentContainer}>
          {aiThinking ? (
            <ActivityIndicator size="small" color="#1a56db" style={{ marginVertical: 20 }} />
          ) : (
            <Text style={themeStyles.wsText}>{toolContent}</Text>
          )}
        </ScrollView>

        {/* AI control overlay */}
        <View style={themeStyles.wsPromptContainer}>
          <TextInput
            placeholder={`Ask Copilot to execute ${activeTab}...`}
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            value={promptInput}
            onChangeText={setPromptInput}
            style={themeStyles.wsPromptInput}
          />
          <TouchableOpacity onPress={executeToolAI} style={themeStyles.wsPromptSendBtn}>
            <Zap size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSettings = (): React.JSX.Element => {
    return (
      <ScrollView style={themeStyles.scrollContent}>
        <View style={themeStyles.settingsCard}>
          <Text style={themeStyles.settingsSectionTitle}>System Preferences</Text>
          
          <View style={themeStyles.settingsRow}>
            <View>
              <Text style={themeStyles.settingsLabel}>Dark Mode Presets</Text>
              <Text style={themeStyles.settingsHint}>Toggle slate theme gradients.</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsDarkMode(!isDarkMode)} 
              style={themeStyles.toggleSwitch}
            >
              <Text style={themeStyles.toggleSwitchText}>{isDarkMode ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>

          <View style={themeStyles.settingsRow}>
            <View>
              <Text style={themeStyles.settingsLabel}>Offline Cache Mode</Text>
              <Text style={themeStyles.settingsHint}>Enable local repository simulation.</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsOfflineMode(!isOfflineMode)} 
              style={themeStyles.toggleSwitch}
            >
              <Text style={themeStyles.toggleSwitchText}>{isOfflineMode ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>

          <View style={themeStyles.settingsRow}>
            <View>
              <Text style={themeStyles.settingsLabel}>Mobile Notifications</Text>
              <Text style={themeStyles.settingsHint}>Notify about upcoming milestones.</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setNotificationsEnabled(!notificationsEnabled)} 
              style={themeStyles.toggleSwitch}
            >
              <Text style={themeStyles.toggleSwitchText}>{notificationsEnabled ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer & Danger Zone */}
        <View style={themeStyles.settingsCard}>
          <Text style={themeStyles.settingsSectionTitle}>Danger Zone</Text>
          <TouchableOpacity 
            onPress={() => {
              setMissions([
                { id: '1', title: 'Cloud Architect Tracks', category: 'CAREER', goal: 'Map career path to senior AWS Cloud Architect.', status: 'ACTIVE', health: 92 },
                { id: '2', title: 'Deep Learning Review', category: 'RESEARCH', goal: 'Summarize 10 recent LLM attention papers.', status: 'ACTIVE', health: 88 }
              ]);
              alert('Local storage memory reset.');
            }} 
            style={themeStyles.dangerBtn}
          >
            <Trash2 size={16} color="#ef4444" />
            <Text style={themeStyles.dangerBtnText}>Reset Workspace Cache</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      {/* Top Telemetry Bar */}
      <View style={themeStyles.topbar}>
        <Text style={themeStyles.topbarBrand}>AXIOM OS</Text>
        {isOfflineMode && <Text style={themeStyles.offlineBadge}>OFFLINE</Text>}
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'create' && renderCreate()}
        {currentView === 'workspace' && renderWorkspace()}
        {currentView === 'settings' && renderSettings()}
      </View>

      {/* Bottom Navigation Dock */}
      <View style={themeStyles.navigationDock}>
        <TouchableOpacity 
          onPress={() => setCurrentView('dashboard')} 
          style={currentView === 'dashboard' ? themeStyles.dockItemActive : themeStyles.dockItem}
        >
          <Home size={18} color={currentView === 'dashboard' ? '#1a56db' : '#94a3b8'} />
          <Text style={currentView === 'dashboard' ? themeStyles.dockTextActive : themeStyles.dockText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {
            setCreateStep(0);
            setChatCategory(null);
            setChatMessages([]);
            setCurrentView('create');
          }} 
          style={currentView === 'create' ? themeStyles.dockItemActive : themeStyles.dockItem}
        >
          <Sparkles size={18} color={currentView === 'create' ? '#1a56db' : '#94a3b8'} />
          <Text style={currentView === 'create' ? themeStyles.dockTextActive : themeStyles.dockText}>Synthesis</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setCurrentView('settings')} 
          style={currentView === 'settings' ? themeStyles.dockItemActive : themeStyles.dockItem}
        >
          <SettingsIcon size={18} color={currentView === 'settings' ? '#1a56db' : '#94a3b8'} />
          <Text style={currentView === 'settings' ? themeStyles.dockTextActive : themeStyles.dockText}>Settings</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

// 4. Dark Theme Stylesheet
const darkStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topbar: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
  },
  topbarBrand: {
    fontSize: 14,
    fontWeight: '900',
    color: '#3b82f6',
    letterSpacing: 1.5,
  },
  offlineBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
    backgroundColor: '#f59e0b15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scrollContent: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  metricLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  launchCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f680',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  launchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  launchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  launchDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    lineHeight: 16,
  },
  launchBtn: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#1a56db',
    borderRadius: 6,
    alignItems: 'center',
  },
  launchBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  trackMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trackCat: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
  },
  trackHealth: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  trackGoal: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 14,
  },
  navigationDock: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  dockItem: {
    alignItems: 'center',
  },
  dockItemActive: {
    alignItems: 'center',
  },
  dockText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
  },
  dockTextActive: {
    fontSize: 9,
    color: '#1a56db',
    fontWeight: '700',
    marginTop: 4,
  },
  catSelectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 10,
  },
  catSelectDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 20,
  },
  catSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  catSelectorBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  chatMessagesScroll: {
    flex: 1,
    padding: 16,
  },
  msgRowAi: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    maxWidth: '85%',
  },
  msgRowUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    marginBottom: 12,
    maxWidth: '85%',
  },
  bubbleAi: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    borderRadius: 10,
  },
  bubbleUser: {
    backgroundColor: '#1a56db',
    padding: 12,
    borderRadius: 10,
  },
  bubbleTextAi: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  bubbleTextUser: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  composerContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#1a56db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compilingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  compilingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
  },
  compilingDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },
  wsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  wsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  wsSub: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 2,
  },
  wsTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 8,
  },
  wsTab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  wsTabActive: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1a56db',
  },
  wsTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  wsTabTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a56db',
  },
  wsContentContainer: {
    flex: 1,
    padding: 16,
  },
  wsText: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  wsPromptContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  wsPromptInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
  },
  wsPromptSendBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#1a56db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingsHint: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  toggleSwitch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a56db15',
    borderWidth: 1,
    borderColor: '#1a56db30',
    borderRadius: 6,
  },
  toggleSwitchText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a56db',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  dangerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  }
});

// 5. Light Theme Stylesheet (Fallback)
const lightStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  topbar: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  topbarBrand: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a56db',
    letterSpacing: 1.5,
  },
  offlineBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
    backgroundColor: '#d9770615',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scrollContent: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  metricLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9ca3af',
    marginTop: 2,
  },
  launchCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  launchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  launchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  launchDesc: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 8,
    lineHeight: 16,
  },
  launchBtn: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#1a56db',
    borderRadius: 6,
    alignItems: 'center',
  },
  launchBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  trackMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trackCat: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a56db',
  },
  trackHealth: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  trackGoal: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 4,
    lineHeight: 14,
  },
  navigationDock: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  dockItem: {
    alignItems: 'center',
  },
  dockItemActive: {
    alignItems: 'center',
  },
  dockText: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 4,
  },
  dockTextActive: {
    fontSize: 9,
    color: '#1a56db',
    fontWeight: '700',
    marginTop: 4,
  },
  catSelectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
  },
  catSelectDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 20,
  },
  catSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  catSelectorBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  chatMessagesScroll: {
    flex: 1,
    padding: 16,
  },
  msgRowAi: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    maxWidth: '85%',
  },
  msgRowUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    marginBottom: 12,
    maxWidth: '85%',
  },
  bubbleAi: {
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 10,
  },
  bubbleUser: {
    backgroundColor: '#1a56db',
    padding: 12,
    borderRadius: 10,
  },
  bubbleTextAi: {
    fontSize: 13,
    color: '#111827',
    lineHeight: 18,
  },
  bubbleTextUser: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  composerContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111827',
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#1a56db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compilingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  compilingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
  },
  compilingDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
  },
  wsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  wsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  wsSub: {
    fontSize: 11,
    color: '#1a56db',
    marginTop: 2,
  },
  wsTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
  },
  wsTab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  wsTabActive: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1a56db',
  },
  wsTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
  },
  wsTabTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a56db',
  },
  wsContentContainer: {
    flex: 1,
    padding: 16,
  },
  wsText: {
    fontSize: 13,
    color: '#111827',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  wsPromptContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  wsPromptInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111827',
    fontSize: 13,
  },
  wsPromptSendBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#1a56db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  settingsHint: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  toggleSwitch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a56db15',
    borderWidth: 1,
    borderColor: '#1a56db30',
    borderRadius: 6,
  },
  toggleSwitchText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a56db',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  dangerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  }
});
