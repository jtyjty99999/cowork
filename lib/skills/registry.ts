/**
 * Skill 注册中心
 * 管理所有可用的 Skills，支持从多个位置加载
 */

import { SkillDefinition, SkillMatch, SkillRegistryConfig } from './types';
import { parseSkillContent, validateSkillDefinition } from './loader';

// 默认配置
const DEFAULT_CONFIG: SkillRegistryConfig = {
  userSkillsPath: '~/.cowork/skills',
  projectSkillsPath: '.cowork/skills',
  enableNestedDiscovery: true,
  maxSkillContentLength: 50000,
};

// Skill 注册表
const skillRegistry = new Map<string, SkillDefinition>();

// 当前配置
let currentConfig: SkillRegistryConfig = { ...DEFAULT_CONFIG };

/**
 * 初始化 Skill 注册中心
 */
export function initializeRegistry(config?: Partial<SkillRegistryConfig>): void {
  currentConfig = { ...DEFAULT_CONFIG, ...config };
  skillRegistry.clear();
}

/**
 * 注册一个 Skill
 */
export function registerSkill(skill: SkillDefinition): boolean {
  const validation = validateSkillDefinition(skill);
  
  if (!validation.valid) {
    console.error(`Failed to register skill "${skill.name}":`, validation.errors);
    return false;
  }
  
  // 检查是否已存在同名 skill
  const existingSkill = skillRegistry.get(skill.name);
  if (existingSkill) {
    // 项目级 skill 优先于用户级
    if (existingSkill.source === 'project' && skill.source === 'user') {
      console.log(`Skill "${skill.name}" already registered from project, skipping user version`);
      return false;
    }
  }
  
  skillRegistry.set(skill.name, skill);
  console.log(`Registered skill: ${skill.name} (${skill.source})`);
  return true;
}

/**
 * 注销一个 Skill
 */
export function unregisterSkill(name: string): boolean {
  return skillRegistry.delete(name);
}

/**
 * 获取所有已注册的 Skills
 */
export function getAllSkills(): SkillDefinition[] {
  return Array.from(skillRegistry.values());
}

/**
 * 根据名称获取 Skill
 */
export function getSkill(name: string): SkillDefinition | undefined {
  return skillRegistry.get(name);
}

/**
 * 获取用户可调用的 Skills（显示在 / 命令列表中）
 */
export function getUserInvocableSkills(): SkillDefinition[] {
  return getAllSkills().filter(skill => skill.userInvocable);
}

/**
 * 获取 AI 可自动调用的 Skills
 */
export function getModelInvocableSkills(): SkillDefinition[] {
  return getAllSkills().filter(skill => !skill.disableModelInvocation);
}

/**
 * 根据用户输入匹配合适的 Skills
 * 用于 AI 自动选择 skill
 */
export function matchSkills(userInput: string, maxResults: number = 3): SkillMatch[] {
  const modelInvocableSkills = getModelInvocableSkills();
  const matches: SkillMatch[] = [];
  const inputLower = userInput.toLowerCase();
  const inputWords = inputLower.split(/\s+/);
  
  for (const skill of modelInvocableSkills) {
    let score = 0;
    let reason = '';
    
    const descLower = skill.description.toLowerCase();
    const nameLower = skill.name.toLowerCase();
    
    // 名称完全匹配
    if (inputLower.includes(nameLower) || nameLower.includes(inputLower)) {
      score += 0.5;
      reason = 'Name match';
    }
    
    // 描述关键词匹配
    const descWords = descLower.split(/\s+/);
    const matchedWords = inputWords.filter(word => 
      descWords.some(dw => dw.includes(word) || word.includes(dw))
    );
    
    if (matchedWords.length > 0) {
      score += (matchedWords.length / inputWords.length) * 0.5;
      reason = reason ? `${reason}, description keywords` : 'Description keywords match';
    }
    
    if (score > 0) {
      matches.push({ skill, score, reason });
    }
  }
  
  // 按分数排序，取前 N 个
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * 从 SKILL.md 内容注册 Skill
 */
export function registerSkillFromContent(
  content: string,
  filePath: string,
  directoryPath: string,
  source: 'user' | 'project' | 'plugin'
): SkillDefinition | null {
  const skill = parseSkillContent(content, filePath, directoryPath, source);
  
  if (!skill) {
    return null;
  }
  
  if (registerSkill(skill)) {
    return skill;
  }
  
  return null;
}

/**
 * 生成 Skills 文档（用于 AI 上下文）
 */
export function generateSkillsDocumentation(): string {
  const skills = getAllSkills();
  
  if (skills.length === 0) {
    return '## Available Skills\n\nNo skills are currently registered.\n';
  }
  
  let doc = `## Available Skills\n\n`;
  doc += `You can invoke skills using the \`/skill-name\` format. `;
  doc += `Some skills can be automatically invoked based on user intent.\n\n`;
  
  // 按来源分组
  const userSkills = skills.filter(s => s.source === 'user');
  const projectSkills = skills.filter(s => s.source === 'project');
  const pluginSkills = skills.filter(s => s.source === 'plugin');
  
  const formatSkillList = (skillList: SkillDefinition[], title: string) => {
    if (skillList.length === 0) return '';
    
    let section = `### ${title}\n\n`;
    
    for (const skill of skillList) {
      const invocationType = skill.disableModelInvocation 
        ? '(user-only)' 
        : skill.userInvocable 
          ? '' 
          : '(auto-only)';
      
      section += `- **/${skill.name}**${skill.argumentHint ? ` ${skill.argumentHint}` : ''} ${invocationType}\n`;
      section += `  ${skill.description}\n`;
      
      if (skill.allowedTools && skill.allowedTools.length > 0) {
        section += `  Tools: ${skill.allowedTools.join(', ')}\n`;
      }
      
      section += '\n';
    }
    
    return section;
  };
  
  doc += formatSkillList(projectSkills, 'Project Skills');
  doc += formatSkillList(userSkills, 'User Skills');
  doc += formatSkillList(pluginSkills, 'Plugin Skills');
  
  doc += `## Skill Invocation\n\n`;
  doc += `- User invokes: \`/skill-name arguments\`\n`;
  doc += `- Auto-invoke: When user intent matches skill description\n`;
  doc += `- Skills marked (user-only) can only be invoked by the user\n`;
  doc += `- Skills marked (auto-only) are background knowledge for AI\n`;
  
  return doc;
}

/**
 * 获取注册中心统计信息
 */
export function getRegistryStats(): {
  total: number;
  bySource: Record<string, number>;
  userInvocable: number;
  modelInvocable: number;
} {
  const skills = getAllSkills();
  
  const bySource: Record<string, number> = {
    user: 0,
    project: 0,
    plugin: 0,
  };
  
  for (const skill of skills) {
    bySource[skill.source]++;
  }
  
  return {
    total: skills.length,
    bySource,
    userInvocable: skills.filter(s => s.userInvocable).length,
    modelInvocable: skills.filter(s => !s.disableModelInvocation).length,
  };
}

/**
 * 清空注册中心
 */
export function clearRegistry(): void {
  skillRegistry.clear();
}

/**
 * 导出当前配置
 */
export function getConfig(): SkillRegistryConfig {
  return { ...currentConfig };
}
