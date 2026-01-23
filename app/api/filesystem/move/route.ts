import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 工作区根目录
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.cwd(), 'workspace');

export async function POST(req: NextRequest) {
  try {
    const { source, destination, workspacePath } = await req.json();
    
    if (!source || !destination) {
      return NextResponse.json(
        { error: '源路径和目标路径不能为空' },
        { status: 400 }
      );
    }
    
    // 使用请求中的工作区路径，如果没有则使用默认值
    const workspaceRoot = workspacePath 
      ? path.join(process.cwd(), workspacePath)
      : WORKSPACE_ROOT;
    
    const sourcePath = path.resolve(workspaceRoot, source);
    const destPath = path.resolve(workspaceRoot, destination);
    
    // 确保路径在工作区内
    if (!sourcePath.startsWith(workspaceRoot) || !destPath.startsWith(workspaceRoot)) {
      return NextResponse.json(
        { error: '访问被拒绝：路径超出工作区范围' },
        { status: 403 }
      );
    }

    // 检查源文件是否存在
    try {
      await fs.access(sourcePath);
    } catch {
      return NextResponse.json(
        { error: '源文件不存在' },
        { status: 404 }
      );
    }

    // 确保目标目录存在
    const destDir = path.dirname(destPath);
    await fs.mkdir(destDir, { recursive: true });

    // 移动文件
    await fs.rename(sourcePath, destPath);

    return NextResponse.json({
      success: true,
      source: path.relative(workspaceRoot, sourcePath),
      destination: path.relative(workspaceRoot, destPath),
      message: '文件移动成功'
    });
  } catch (error) {
    console.error('移动文件失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '移动文件失败' },
      { status: 500 }
    );
  }
}
