'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Folder, Globe, Check } from 'lucide-react';
import { Artifact, WorkingFile, ProgressStep } from '@/types';
import FileTree from './FileTree';
import { useWorkspaceFiles } from '@/hooks/useWorkspaceFiles';

interface RightSidebarProps {
  artifacts: Artifact[];
  workingFiles: WorkingFile[];
  progressSteps: ProgressStep[];
  workspacePath: string;
}

export default function RightSidebar({ artifacts, workingFiles, progressSteps, workspacePath }: RightSidebarProps) {
  const { files, loading } = useWorkspaceFiles(workspacePath);
  const [isProgressExpanded, setIsProgressExpanded] = useState(true);
  const [isArtifactsExpanded, setIsArtifactsExpanded] = useState(true);
  const [isContextExpanded, setIsContextExpanded] = useState(true);
  
  return (
    <div className="w-[320px] bg-secondary border-l border-border overflow-y-auto h-screen">
      {/* Progress Section */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">Progress</h3>
          <button 
            className="p-1 hover:bg-tertiary rounded transition-colors"
            onClick={() => setIsProgressExpanded(!isProgressExpanded)}
          >
            {isProgressExpanded ? (
              <ChevronDown size={16} className="text-text-secondary" />
            ) : (
              <ChevronRight size={16} className="text-text-secondary" />
            )}
          </button>
        </div>
        
        {isProgressExpanded && (
          <>
            {progressSteps.length > 0 ? (
              <div className="space-y-3">
                {progressSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        step.status === 'completed'
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : step.status === 'in_progress'
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 bg-transparent'
                      }`}
                    >
                      {step.status === 'completed' && <Check size={12} />}
                      {step.status === 'in_progress' && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${
                        step.status === 'completed' 
                          ? 'text-gray-400 line-through' 
                          : step.status === 'in_progress'
                          ? 'text-text-primary font-medium'
                          : 'text-text-secondary'
                      }`}>
                        {step.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-text-secondary">
                Steps will show as the task unfolds.
              </div>
            )}
          </>
        )}
      </div>

      {/* Artifacts Section */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">Artifacts</h3>
          <button 
            className="p-1 hover:bg-tertiary rounded transition-colors"
            onClick={() => setIsArtifactsExpanded(!isArtifactsExpanded)}
          >
            {isArtifactsExpanded ? (
              <ChevronDown size={16} className="text-text-secondary" />
            ) : (
              <ChevronRight size={16} className="text-text-secondary" />
            )}
          </button>
        </div>
        
        {isArtifactsExpanded && (
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
        )}
      </div>

      {/* Context Section */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">Context</h3>
          <button 
            className="p-1 hover:bg-tertiary rounded transition-colors"
            onClick={() => setIsContextExpanded(!isContextExpanded)}
          >
            {isContextExpanded ? (
              <ChevronDown size={16} className="text-text-secondary" />
            ) : (
              <ChevronRight size={16} className="text-text-secondary" />
            )}
          </button>
        </div>

        {isContextExpanded && (
          <>
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
              <div className="text-[13px] font-medium text-text-secondary mb-2">
                Workspace Files {files.length > 0 && `(${files.length})`}
              </div>
              {loading ? (
                <div className="text-[13px] text-text-secondary py-2">Loading...</div>
              ) : (
                <FileTree files={files} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
