'use client';

import { ChevronDown, FileText, Folder, Globe, Check } from 'lucide-react';
import { Artifact, WorkingFile, ProgressStep } from '@/types';

interface RightSidebarProps {
  artifacts: Artifact[];
  workingFiles: WorkingFile[];
  progressSteps: ProgressStep[];
}

export default function RightSidebar({ artifacts, workingFiles, progressSteps }: RightSidebarProps) {
  return (
    <div className="w-[320px] bg-secondary border-l border-border overflow-y-auto h-screen">
      {/* Progress Section */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">Progress</h3>
          <button className="p-1 hover:bg-tertiary rounded transition-colors">
            <ChevronDown size={16} className="text-text-secondary" />
          </button>
        </div>
        
        <div className="flex items-center mb-3">
          {progressSteps.length > 0 ? (
            progressSteps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'border-success bg-success text-white'
                      : step.status === 'in_progress'
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-primary'
                  }`}
                >
                  {step.status === 'completed' && <Check size={14} />}
                </div>
                {index < progressSteps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-border mx-1" />
                )}
              </div>
            ))
          ) : (
            <>
              <div className="w-8 h-8 rounded-full border-2 border-success bg-success text-white flex items-center justify-center">
                <Check size={14} />
              </div>
              <div className="flex-1 h-0.5 bg-border" />
              <div className="w-8 h-8 rounded-full border-2 border-success bg-success text-white flex items-center justify-center">
                <Check size={14} />
              </div>
              <div className="flex-1 h-0.5 bg-border" />
              <div className="w-8 h-8 rounded-full border-2 border-border bg-primary" />
            </>
          )}
        </div>
        
        <div className="text-[13px] text-text-secondary">
          Steps will show as the task unfolds.
        </div>
      </div>

      {/* Artifacts Section */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">Artifacts</h3>
          <button className="p-1 hover:bg-tertiary rounded transition-colors">
            <ChevronDown size={16} className="text-text-secondary" />
          </button>
        </div>
        
        <div className="space-y-2">
          {artifacts.map((artifact) => (
            <div
              key={artifact.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-tertiary cursor-pointer transition-colors"
            >
              <FileText size={16} className="text-text-secondary flex-shrink-0" />
              <span className="text-[13px] text-text-primary">{artifact.filename}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Context Section */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">Context</h3>
          <button className="p-1 hover:bg-tertiary rounded transition-colors">
            <ChevronDown size={16} className="text-text-secondary" />
          </button>
        </div>

        {/* Selected Folders */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <ChevronDown size={16} className="text-text-secondary" />
            <span className="text-[13px] font-medium text-text-secondary">Selected folders</span>
            <span className="ml-auto px-2 py-0.5 bg-tertiary rounded-full text-[11px] text-text-secondary">
              1
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-tertiary cursor-pointer transition-colors">
            <input type="checkbox" defaultChecked className="flex-shrink-0" />
            <Folder size={16} className="text-text-secondary flex-shrink-0" />
            <span className="text-[13px] text-text-primary">blog-drafts</span>
          </div>
        </div>

        {/* Connectors */}
        <div className="mb-5">
          <div className="text-[13px] font-medium text-text-secondary mb-2">Connectors</div>
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-tertiary cursor-pointer transition-colors">
            <Globe size={16} className="text-text-secondary flex-shrink-0" />
            <span className="text-[13px] text-text-primary">Web search</span>
          </div>
        </div>

        {/* Working Files */}
        <div>
          <div className="text-[13px] font-medium text-text-secondary mb-2">Working files</div>
          <div className="space-y-2">
            {workingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-tertiary cursor-pointer transition-colors"
              >
                <FileText size={16} className="text-text-secondary flex-shrink-0" />
                <span className="text-[13px] text-text-primary truncate">{file.filename}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
