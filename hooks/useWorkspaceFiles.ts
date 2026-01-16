'use client';

import { useState, useEffect } from 'react';

export function useWorkspaceFiles(workspacePath: string) {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      if (!workspacePath) {
        console.log('workspacePath 为空，跳过加载');
        return;
      }

      console.log('开始加载工作区文件，路径:', workspacePath);
      setLoading(true);
      
      try {
        const allFiles = await getAllFiles('.', workspacePath);
        console.log('加载到的文件:', allFiles);
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
    console.log(`读取目录: ${dirPath}, workspace: ${workspacePath}`);
    
    const response = await fetch('/api/filesystem/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dirPath, workspacePath }),
    });

    if (!response.ok) {
      console.error(`API 请求失败: ${response.status}`);
      const errorData = await response.json().catch(() => ({}));
      console.error('错误详情:', errorData);
      return [];
    }

    const data = await response.json();
    console.log(`目录 ${dirPath} 的内容:`, data);
    
    const files: string[] = [];
    const items = data.items || data || [];

    console.log(`处理 ${items.length} 个项目`);
    
    for (const item of items) {
      console.log('处理项目:', item);
      const itemPath = dirPath === '.' ? item.name : `${dirPath}/${item.name}`;
      
      if (item.type === 'file') {
        console.log(`添加文件: ${itemPath}`);
        files.push(itemPath);
      } else if (item.type === 'directory') {
        console.log(`递归目录: ${itemPath}`);
        // 递归获取子目录文件
        const subFiles = await getAllFiles(itemPath, workspacePath);
        files.push(...subFiles);
      } else {
        console.log(`未知类型: ${item.type}`, item);
      }
    }
    
    console.log(`目录 ${dirPath} 返回 ${files.length} 个文件`);
    return files;
  } catch (error) {
    console.error(`读取目录 ${dirPath} 失败:`, error);
    return [];
  }
}
