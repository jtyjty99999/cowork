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
    const { path: requestedPath = '.' } = await req.json();
    
    const fullPath = validatePath(requestedPath);

    // 确保工作区目录存在
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(fullPath, entry.name);
        const stats = await fs.stat(entryPath);
        
        return {
          name: entry.name,
          path: path.relative(WORKSPACE_ROOT, entryPath),
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
