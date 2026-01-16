'use client';

import { Plus, Info } from 'lucide-react';
import { Task } from '@/types';
import WorkspaceSelector from './WorkspaceSelector';

interface LeftSidebarProps {
  tasks: Task[];
  onNewTask: () => void;
  onSelectTask: (taskId: string) => void;
  workspacePath: string;
  onWorkspaceChange: (path: string) => void;
}

export default function LeftSidebar({ tasks, onNewTask, onSelectTask, workspacePath, onWorkspaceChange }: LeftSidebarProps) {
  return (
    <div className="w-[280px] bg-secondary border-r border-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 text-sm text-text-secondary hover:bg-tertiary rounded-md transition-colors">
            Chat
          </button>
          <button className="flex-1 px-3 py-2 text-sm text-text-secondary hover:bg-tertiary rounded-md transition-colors">
            Code
          </button>
          <button className="flex-1 px-3 py-2 text-sm bg-primary text-text-primary font-medium rounded-md">
            Cowork
          </button>
        </div>
      </div>

      {/* New Task Button */}
      <div className="p-4 pb-2">
        <button
          onClick={onNewTask}
          className="w-full px-4 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>New task</span>
        </button>
      </div>

      {/* Workspace Selector */}
      <div className="px-4 pb-4">
        <WorkspaceSelector 
          currentPath={workspacePath}
          onWorkspaceChange={onWorkspaceChange}
        />
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-2">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => onSelectTask(task.id)}
            className={`px-3 py-3 mb-1 rounded-md cursor-pointer text-sm transition-colors ${
              task.active
                ? 'bg-primary font-medium text-text-primary'
                : 'text-text-primary hover:bg-tertiary'
            }`}
          >
            {task.title}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-start gap-2 p-3 bg-tertiary rounded-md mb-3">
          <Info size={16} className="text-text-secondary mt-0.5 flex-shrink-0" />
          <span className="text-xs text-text-secondary">
            These tasks run locally and aren't synced across devices
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-text-primary text-white flex items-center justify-center text-sm font-semibold">
            SW
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary">Simon Willison</div>
            <div className="text-xs text-text-secondary">Max plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
