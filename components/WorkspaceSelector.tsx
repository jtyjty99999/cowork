'use client';

import { useState } from 'react';
import { FolderOpen, Check, ChevronDown } from 'lucide-react';

interface WorkspaceSelectorProps {
  currentPath: string;
  onWorkspaceChange: (path: string) => void;
}

const commonWorkspaces = [
  { name: 'Default Workspace', path: './workspace' },
  { name: 'Documents', path: './documents' },
  { name: 'Projects', path: './projects' },
  { name: 'Downloads', path: './downloads' },
];

export default function WorkspaceSelector({ currentPath, onWorkspaceChange }: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPath, setCustomPath] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelect = (path: string) => {
    onWorkspaceChange(path);
    setIsOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customPath.trim()) {
      onWorkspaceChange(customPath.trim());
      setCustomPath('');
      setShowCustomInput(false);
      setIsOpen(false);
    }
  };

  const currentWorkspace = commonWorkspaces.find(w => w.path === currentPath) || {
    name: 'Custom',
    path: currentPath,
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors w-full"
      >
        <FolderOpen size={16} className="text-text-secondary" />
        <div className="flex-1 text-left">
          <div className="font-medium text-text-primary">{currentWorkspace.name}</div>
          <div className="text-xs text-text-secondary truncate">{currentPath}</div>
        </div>
        <ChevronDown size={16} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setIsOpen(false);
              setShowCustomInput(false);
            }}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-primary border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="py-2">
              {commonWorkspaces.map((workspace) => (
                <button
                  key={workspace.path}
                  onClick={() => handleSelect(workspace.path)}
                  className="w-full px-4 py-2 text-left hover:bg-secondary transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-text-primary">{workspace.name}</div>
                    <div className="text-xs text-text-secondary">{workspace.path}</div>
                  </div>
                  {currentPath === workspace.path && (
                    <Check size={16} className="text-accent" />
                  )}
                </button>
              ))}
              
              <div className="border-t border-border my-2" />
              
              {showCustomInput ? (
                <div className="px-4 py-2">
                  <div className="text-xs text-text-secondary mb-2">自定义路径</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPath}
                      onChange={(e) => setCustomPath(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomSubmit();
                        } else if (e.key === 'Escape') {
                          setShowCustomInput(false);
                          setCustomPath('');
                        }
                      }}
                      placeholder="./my-workspace"
                      className="flex-1 px-2 py-1 text-sm border border-border rounded outline-none focus:border-accent"
                      autoFocus
                    />
                    <button
                      onClick={handleCustomSubmit}
                      className="px-3 py-1 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors"
                    >
                      确定
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full px-4 py-2 text-left text-sm text-accent hover:bg-secondary transition-colors"
                >
                  + 自定义路径
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
