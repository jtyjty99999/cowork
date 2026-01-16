'use client';

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface TaskPlanDisplayProps {
  steps: TaskStep[];
}

export default function TaskPlanDisplay({ steps }: TaskPlanDisplayProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden mt-4 bg-secondary">
      <div className="px-4 py-3 bg-tertiary border-b border-border">
        <div className="text-sm font-medium text-text-primary">📋 任务执行计划</div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {step.status === 'completed' && (
                  <CheckCircle2 size={20} className="text-green-500" />
                )}
                {step.status === 'in_progress' && (
                  <Loader2 size={20} className="text-blue-500 animate-spin" />
                )}
                {step.status === 'failed' && (
                  <XCircle size={20} className="text-red-500" />
                )}
                {step.status === 'pending' && (
                  <Circle size={20} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${
                  step.status === 'completed' ? 'text-green-600 line-through' :
                  step.status === 'in_progress' ? 'text-blue-600 font-medium' :
                  step.status === 'failed' ? 'text-red-600' :
                  'text-text-secondary'
                }`}>
                  {index + 1}. {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
