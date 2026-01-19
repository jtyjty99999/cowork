export interface Task {
  id: string;
  title: string;
  createdAt: Date;
  active: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  images?: {
    url: string;
    name: string;
    size: number;
    base64?: string;
  }[];
  toolCalls?: {
    tool: string;
    parameters: Record<string, any>;
    result?: {
      success: boolean;
      data?: any;
      error?: string;
    };
  }[];
  command?: Command;
  taskPlan?: {
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  }[];
}

export interface Command {
  command: string;
  args?: string;
  description?: string;
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
  };
}

export interface Artifact {
  id: string;
  filename: string;
  content?: string;
  createdAt: Date;
}

export interface WorkingFile {
  id: string;
  filename: string;
  addedAt: Date;
}

export interface ProgressStep {
  status: 'completed' | 'in_progress' | 'pending';
  label: string;
}

export interface AppState {
  tasks: Task[];
  currentTaskId: string | null;
  messages: Record<string, Message[]>;
  artifacts: Record<string, Artifact[]>;
  workingFiles: Record<string, WorkingFile[]>;
  progressSteps: Record<string, ProgressStep[]>;
  isAIResponding: boolean;
  workspacePath: string;
}
