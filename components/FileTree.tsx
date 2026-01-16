'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface FileTreeProps {
  files: string[];
}

interface TreeBuildNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children: { [key: string]: TreeBuildNode };
}

function buildTree(filePaths: string[]): FileNode[] {
  const root: { [key: string]: TreeBuildNode } = {};

  filePaths.forEach(filePath => {
    const parts = filePath.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: index === parts.length - 1 ? 'file' : 'directory',
          children: {},
        };
      }
      if (index < parts.length - 1) {
        current = current[part].children;
      }
    });
  });

  // 转换为数组并排序
  const convertToArray = (obj: any): FileNode[] => {
    return Object.values(obj)
      .map((node: any) => ({
        ...node,
        children: node.children ? convertToArray(node.children) : undefined,
      }))
      .sort((a: any, b: any) => {
        // 目录优先，然后按名称排序
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  };

  return convertToArray(root);
}

function TreeNode({ node, level = 0 }: { node: FileNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-tertiary cursor-pointer transition-colors"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown size={14} className="text-text-secondary flex-shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
          )
        ) : (
          <div className="w-3.5" />
        )}
        
        {node.type === 'directory' ? (
          <Folder size={14} className="text-text-secondary flex-shrink-0" />
        ) : (
          <FileText size={14} className="text-text-secondary flex-shrink-0" />
        )}
        
        <span className="text-[13px] text-text-primary truncate">{node.name}</span>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ files }: FileTreeProps) {
  if (files.length === 0) {
    return (
      <div className="text-[13px] text-text-secondary py-2">
        No files in workspace
      </div>
    );
  }

  const tree = buildTree(files);

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNode key={node.path} node={node} />
      ))}
    </div>
  );
}
