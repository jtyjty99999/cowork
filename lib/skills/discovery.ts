/**
 * Skill 发现服务
 * 从文件系统自动发现和加载 Skills
 */

import { SkillDefinition, SkillRegistryConfig } from './types';
import { parseSkillContent, validateSkillDefinition } from './loader';
import { registerSkill, clearRegistry, initializeRegistry } from './registry';

// 默认忽略的目录
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next'];

// SKILL.md 文件名
const SKILL_FILE = 'SKILL.md';

/**
 * 发现结果
 */
export interface DiscoveryResult {
  skills: SkillDefinition[];
  errors: { path: string; error: string }[];
  scannedPaths: string[];
}

/**
 * 从指定目录发现 Skills（服务端 API 调用）
 */
export async function discoverSkillsFromAPI(
  userSkillsPath: string,
  projectSkillsPath: string
): Promise<DiscoveryResult> {
  const result: DiscoveryResult = {
    skills: [],
    errors: [],
    scannedPaths: [],
  };

  // 调用服务端 API 来扫描目录
  try {
    const response = await fetch('/api/skills/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSkillsPath, projectSkillsPath }),
    });

    if (!response.ok) {
      throw new Error(`Failed to discover skills: ${response.statusText}`);
    }

    const data = await response.json();
    return data as DiscoveryResult;
  } catch (error) {
    result.errors.push({
      path: 'API',
      error: error instanceof Error ? error.message : String(error),
    });
    return result;
  }
}

/**
 * 从 SKILL.md 内容列表批量注册 Skills
 */
export function registerSkillsFromContents(
  skillContents: {
    content: string;
    filePath: string;
    directoryPath: string;
    source: 'user' | 'project' | 'plugin';
  }[]
): DiscoveryResult {
  const result: DiscoveryResult = {
    skills: [],
    errors: [],
    scannedPaths: [],
  };

  for (const item of skillContents) {
    result.scannedPaths.push(item.filePath);

    try {
      const skill = parseSkillContent(
        item.content,
        item.filePath,
        item.directoryPath,
        item.source
      );

      if (!skill) {
        result.errors.push({
          path: item.filePath,
          error: 'Failed to parse skill content',
        });
        continue;
      }

      const validation = validateSkillDefinition(skill);
      if (!validation.valid) {
        result.errors.push({
          path: item.filePath,
          error: validation.errors.join(', '),
        });
        continue;
      }

      if (registerSkill(skill)) {
        result.skills.push(skill);
      }
    } catch (error) {
      result.errors.push({
        path: item.filePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

/**
 * 重新加载所有 Skills
 */
export async function reloadAllSkills(
  config?: Partial<SkillRegistryConfig>
): Promise<DiscoveryResult> {
  // 清空现有注册
  clearRegistry();
  initializeRegistry(config);

  const userPath = config?.userSkillsPath || '~/.cowork/skills';
  const projectPath = config?.projectSkillsPath || '.cowork/skills';

  return discoverSkillsFromAPI(userPath, projectPath);
}

/**
 * 监听 Skills 目录变化（用于热重载）
 */
export function watchSkillsDirectory(
  path: string,
  onChange: (event: 'add' | 'change' | 'remove', skillPath: string) => void
): () => void {
  // TODO: 实现文件监听
  // 返回取消监听的函数
  return () => {};
}

/**
 * 获取 Skill 的支持文件列表
 */
export async function getSkillSupportingFiles(
  skillDirectoryPath: string
): Promise<string[]> {
  try {
    const response = await fetch('/api/skills/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directoryPath: skillDirectoryPath }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.files || [];
  } catch {
    return [];
  }
}

/**
 * 读取 Skill 的支持文件内容
 */
export async function readSkillSupportingFile(
  filePath: string
): Promise<string | null> {
  try {
    const response = await fetch('/api/skills/read-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.content || null;
  } catch {
    return null;
  }
}
