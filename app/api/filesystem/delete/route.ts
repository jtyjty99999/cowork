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

export async function POST(req: NextRequest) {
  try {
    const { path: requestedPath } = await req.json();
    
    if (!requestedPath) {
      return NextResponse.json(
        { error: '缺少路径' },
        { status: 400 }
      );
    }

    const fullPath = validatePath(requestedPath);

    // 检查路径是否存在
    const stats = await fs.stat(fullPath);
    
    // 删除文件或目录
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.unlink(fullPath);
    }

    return NextResponse.json({
      success: true,
      path: path.relative(WORKSPACE_ROOT, fullPath),
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
