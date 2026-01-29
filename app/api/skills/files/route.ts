/**
 * Skills 支持文件列表 API
 * 获取 Skill 目录中的支持文件列表
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const IGNORE_FILES = ['SKILL.md'];
const IGNORE_DIRS = ['node_modules', '.git'];

export async function POST(request: NextRequest) {
  try {
    const { directoryPath } = await request.json();

    if (!directoryPath) {
      return NextResponse.json(
        { error: 'directoryPath is required' },
        { status: 400 }
      );
    }

    const files = await listFilesRecursively(directoryPath);

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function listFilesRecursively(
  dirPath: string,
  basePath: string = dirPath
): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry.name) || entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        const subFiles = await listFilesRecursively(fullPath, basePath);
        files.push(...subFiles);
      } else if (!IGNORE_FILES.includes(entry.name)) {
        files.push(relativePath);
      }
    }
  } catch {
    // 目录不存在或无权限
  }

  return files;
}
