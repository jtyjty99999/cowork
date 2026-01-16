import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * 读取文档内容的 API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: '缺少 path 参数' },
        { status: 400 }
      );
    }

    // 安全检查：只允许读取 docs 目录下的 .md 文件
    if (!path.endsWith('.md')) {
      return NextResponse.json(
        { error: '只能读取 Markdown 文件' },
        { status: 400 }
      );
    }

    // 防止路径遍历攻击
    if (path.includes('..') || path.includes('/') || path.includes('\\')) {
      return NextResponse.json(
        { error: '无效的文件路径' },
        { status: 400 }
      );
    }

    // 读取文件
    const docsDir = join(process.cwd(), 'docs');
    const filePath = join(docsDir, path);
    
    const content = await readFile(filePath, 'utf-8');

    return NextResponse.json({
      success: true,
      content,
      path,
    });

  } catch (error: any) {
    console.error('读取文档失败:', error);
    
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: '读取文档失败', details: error.message },
      { status: 500 }
    );
  }
}
