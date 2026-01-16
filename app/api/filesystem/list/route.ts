import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 工作区根目录
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.cwd(), 'workspace');

// 确保路径在工作区内
function validatePath(requestedPath: string): string {
  const resolvedPath = path.resolve(WORKSPACE_ROOT, requestedPath);
  if (!resolvedPath.startsWith(WORKSPACE_ROOT)) {
    throw new Error('访问被拒绝：路径超出工作区范围');
  }
  return resolvedPath;
}

export async function POST(req: NextRequest) {
  try {
    const { path: requestedPath = '.', workspacePath } = await req.json();
    
    // 使用请求中的工作区路径，如果没有则使用默认值
    const workspaceRoot = workspacePath 
      ? path.join(process.cwd(), workspacePath)
      : WORKSPACE_ROOT;
    
    const resolvedPath = path.resolve(workspaceRoot, requestedPath);
    if (!resolvedPath.startsWith(workspaceRoot)) {
      throw new Error('访问被拒绝：路径超出工作区范围');
    }

    // 确保工作区目录存在
    await fs.mkdir(workspaceRoot, { recursive: true });
    
    const fullPath = resolvedPath;

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(fullPath, entry.name);
        const stats = await fs.stat(entryPath);
        
        return {
          name: entry.name,
          path: path.relative(workspaceRoot, entryPath),
          type: entry.isDirectory() ? 'directory' : 'file',
          size: entry.isFile() ? stats.size : undefined,
          modified: stats.mtime,
        };
      })
    );

    return NextResponse.json(files);
  } catch (error) {
    console.error('列出目录失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '列出目录失败' },
      { status: 500 }
    );
  }
}
