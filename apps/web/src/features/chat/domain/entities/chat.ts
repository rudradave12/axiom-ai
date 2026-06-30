export interface CopilotMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'thinking' | 'generating' | 'completed' | 'error';
  isPinned?: boolean;
  reactions?: string[];
  timestamp: Date;
}

export interface CopilotConversation {
  id: string;
  missionId: string;
  title: string;
  messages: CopilotMessage[];
  createdAt: Date;
  updatedAt: Date;
}
