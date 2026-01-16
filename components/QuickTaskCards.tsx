'use client';

import { QuickTask } from '@/lib/quick-tasks';

interface QuickTaskCardsProps {
  tasks: QuickTask[];
  onSelectTask: (prompt: string) => void;
}

export default function QuickTaskCards({ tasks, onSelectTask }: QuickTaskCardsProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold text-text-primary mb-2">
          Let's knock something off your list
        </h2>
        <p className="text-text-secondary text-sm">
          选择一个任务模板快速开始，或在下方输入自定义任务
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onSelectTask(task.prompt)}
            className="group p-4 border border-border rounded-lg hover:border-accent hover:bg-secondary transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{task.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors mb-1">
                  {task.title}
                </div>
                <div className="text-xs text-text-secondary line-clamp-2">
                  {task.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
