/**
 * Skills 发现 API
 * 扫描指定目录，发现并返回所有 SKILL.md 文件
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const SKILL_FILE = 'SKILL.md';
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next'];

interface SkillFileInfo {
  content: string;
  filePath: string;
  directoryPath: string;
  source: 'user' | 'project' | 'plugin';
}

export async function POST(request: NextRequest) {
  try {
    const { userSkillsPath, projectSkillsPath } = await request.json();

    const skills: SkillFileInfo[] = [];
    const errors: { path: string; error: string }[] = [];
    const scannedPaths: string[] = [];

    // 解析用户目录路径
    const resolvedUserPath = userSkillsPath.replace(/^~/, os.homedir());
    
    // 扫描用户全局 skills
    const userSkills = await scanSkillsDirectory(resolvedUserPath, 'user');
    skills.push(...userSkills.skills);
    errors.push(...userSkills.errors);
    scannedPaths.push(...userSkills.scannedPaths);

    // 扫描项目 skills
    const projectSkills = await scanSkillsDirectory(
      path.resolve(process.cwd(), projectSkillsPath),
      'project'
    );
    skills.push(...projectSkills.skills);
    errors.push(...projectSkills.errors);
    scannedPaths.push(...projectSkills.scannedPaths);

    // 解析所有 skill 内容
    const parsedSkills = [];
    for (const skillFile of skills) {
      try {
        const { parseSkillContent } = await import('@/lib/skills/loader');
        const skill = parseSkillContent(
          skillFile.content,
          skillFile.filePath,
          skillFile.directoryPath,
          skillFile.source
        );
        if (skill) {
          parsedSkills.push(skill);
        }
      } catch (error) {
        errors.push({
          path: skillFile.filePath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      skills: parsedSkills,
      errors,
      scannedPaths,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function scanSkillsDirectory(
  dirPath: string,
  source: 'user' | 'project' | 'plugin'
): Promise<{
  skills: SkillFileInfo[];
  errors: { path: string; error: string }[];
  scannedPaths: string[];
}> {
  const skills: SkillFileInfo[] = [];
  const errors: { path: string; error: string }[] = [];
  const scannedPaths: string[] = [];

  try {
    const exists = await fs.access(dirPath).then(() => true).catch(() => false);
    if (!exists) {
      return { skills, errors, scannedPaths };
    }

    scannedPaths.push(dirPath);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 检查目录中是否有 SKILL.md
        const skillFilePath = path.join(fullPath, SKILL_FILE);
        try {
          const content = await fs.readFile(skillFilePath, 'utf-8');
          skills.push({
            content,
            filePath: skillFilePath,
            directoryPath: fullPath,
            source,
          });
        } catch {
          // 没有 SKILL.md，继续递归扫描子目录
          const subResult = await scanSkillsDirectory(fullPath, source);
          skills.push(...subResult.skills);
          errors.push(...subResult.errors);
          scannedPaths.push(...subResult.scannedPaths);
        }
      }
    }
  } catch (error) {
    errors.push({
      path: dirPath,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return { skills, errors, scannedPaths };
}
