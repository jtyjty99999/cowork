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
    const { path: requestedPath, content } = await req.json();
    
    if (!requestedPath) {
      return NextResponse.json(
        { error: '缺少文件路径' },
        { status: 400 }
      );
    }

    if (content === undefined) {
      return NextResponse.json(
        { error: '缺少文件内容' },
        { status: 400 }
      );
    }

    const fullPath = validatePath(requestedPath);

    // 确保父目录存在
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // 写入文件
    await fs.writeFile(fullPath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      path: path.relative(WORKSPACE_ROOT, fullPath),
      message: '文件写入成功',
    });
  } catch (error) {
    console.error('写入文件失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '写入文件失败' },
      { status: 500 }
    );
  }
}
