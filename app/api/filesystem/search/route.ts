import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.cwd(), 'workspace');

function validatePath(requestedPath: string): string {
  const resolvedPath = path.resolve(WORKSPACE_ROOT, requestedPath);
  if (!resolvedPath.startsWith(WORKSPACE_ROOT)) {
    throw new Error('访问被拒绝：路径超出工作区范围');
  }
  return resolvedPath;
}

async function searchDirectory(dir: string, pattern: string, results: any[] = []): Promise<any[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // 检查文件名是否匹配模式
    if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
      const stats = await fs.stat(fullPath);
      results.push({
        name: entry.name,
        path: path.relative(WORKSPACE_ROOT, fullPath),
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime,
      });
    }
    
    // 递归搜索子目录
    if (entry.isDirectory()) {
      await searchDirectory(fullPath, pattern, results);
    }
  }
  
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const { pattern, directory = '.' } = await req.json();
    
    if (!pattern) {
      return NextResponse.json(
        { error: '缺少搜索模式' },
        { status: 400 }
      );
    }

    const fullPath = validatePath(directory);

    // 确保工作区目录存在
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });

    const results = await searchDirectory(fullPath, pattern);

    return NextResponse.json(results);
  } catch (error) {
    console.error('搜索文件失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '搜索文件失败' },
      { status: 500 }
    );
  }
}
