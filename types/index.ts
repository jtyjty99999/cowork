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
  timestamp: Date;
  command?: Command;
}

export interface Command {
  command: string;
  args?: string;
  description?: string;
}

export interface Artifact {
  id: string;
  filename: string;
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
}
