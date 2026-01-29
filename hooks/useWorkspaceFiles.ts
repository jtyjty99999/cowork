'use client';

import { useState, useEffect } from 'react';

export function useWorkspaceFiles(workspacePath: string) {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      if (!workspacePath) return;

      setLoading(true);
      
      try {
        const allFiles = await getAllFiles('.', workspacePath);
        setFiles(allFiles);
      } catch (error) {
        console.error('加载工作区文件失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [workspacePath]);

  return { files, loading };
}

async function getAllFiles(dirPath: string, workspacePath: string): Promise<string[]> {
  try {
    const response = await fetch('/api/filesystem/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dirPath, workspacePath }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const files: string[] = [];
    const items = data.items || data || [];
    
    for (const item of items) {
      const itemPath = dirPath === '.' ? item.name : `${dirPath}/${item.name}`;
      
      if (item.type === 'file') {
        files.push(itemPath);
      } else if (item.type === 'directory') {
        const subFiles = await getAllFiles(itemPath, workspacePath);
        files.push(...subFiles);
      }
    }
    
    return files;
  } catch (error) {
    console.error(`读取目录失败:`, error);
    return [];
  }
}
