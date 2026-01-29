/**
 * Skill 加载器
 * 解析 SKILL.md 文件，提取 frontmatter 和指令内容
 */

import { SkillDefinition, SkillFrontmatter } from './types';

/**
 * 解析 YAML frontmatter
 */
function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter | null; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: null, body: content };
  }
  
  const yamlContent = match[1];
  const body = match[2];
  
  try {
    const frontmatter = parseYaml(yamlContent);
    return { frontmatter, body };
  } catch (error) {
    console.error('Failed to parse frontmatter:', error);
    return { frontmatter: null, body: content };
  }
}

/**
 * 简单的 YAML 解析器（支持基本的 key: value 格式）
 */
function parseYaml(yaml: string): SkillFrontmatter {
  const result: Record<string, any> = {};
  const lines = yaml.split('\n');
  let currentKey: string | null = null;
  let currentValue: string[] = [];
  let inArray = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // 检查是否是数组项
    if (trimmed.startsWith('- ') && currentKey) {
      if (!inArray) {
        inArray = true;
        result[currentKey] = [];
      }
      result[currentKey].push(trimmed.slice(2).trim());
      continue;
    }
    
    // 检查是否是 key: value 格式
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      // 保存之前的值
      if (currentKey && currentValue.length > 0) {
        result[currentKey] = currentValue.join('\n').trim();
      }
      
      currentKey = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      
      inArray = false;
      currentValue = [];
      
      if (value) {
        // 处理布尔值
        if (value === 'true') {
          result[currentKey] = true;
        } else if (value === 'false') {
          result[currentKey] = false;
        } else if (value.startsWith('[') && value.endsWith(']')) {
          // 内联数组 [a, b, c]
          result[currentKey] = value
            .slice(1, -1)
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        } else {
          // 移除引号
          result[currentKey] = value.replace(/^["']|["']$/g, '');
        }
      }
    } else if (currentKey && !inArray) {
      // 多行值
      currentValue.push(trimmed);
    }
  }
  
  // 保存最后一个值
  if (currentKey && currentValue.length > 0) {
    result[currentKey] = currentValue.join('\n').trim();
  }
  
  return result as SkillFrontmatter;
}

/**
 * 从 SKILL.md 内容解析 Skill 定义
 */
export function parseSkillContent(
  content: string,
  filePath: string,
  directoryPath: string,
  source: 'user' | 'project' | 'plugin'
): SkillDefinition | null {
  const { frontmatter, body } = parseFrontmatter(content);
  
  if (!frontmatter || !frontmatter.name) {
    console.warn(`Invalid skill file: ${filePath} - missing name in frontmatter`);
    return null;
  }
  
  return {
    id: `${source}:${frontmatter.name}`,
    name: frontmatter.name,
    description: frontmatter.description || '',
    argumentHint: frontmatter['argument-hint'],
    disableModelInvocation: frontmatter['disable-model-invocation'] ?? false,
    userInvocable: frontmatter['user-invocable'] ?? true,
    allowedTools: frontmatter['allowed-tools'],
    context: frontmatter.context || 'main',
    agent: frontmatter.agent,
    model: frontmatter.model,
    hooks: frontmatter.hooks ? {
      preExecute: frontmatter.hooks['pre-execute'],
      postExecute: frontmatter.hooks['post-execute'],
    } : undefined,
    instructions: body.trim(),
    filePath,
    directoryPath,
    source,
  };
}

/**
 * 处理指令中的参数替换
 * 支持 $ARGUMENTS, $ARGUMENTS[N], $N 格式
 */
export function substituteArguments(instructions: string, args: string[]): string {
  let result = instructions;
  
  // 替换 $ARGUMENTS (完整参数字符串)
  result = result.replace(/\$ARGUMENTS(?!\[)/g, args.join(' '));
  
  // 替换 $ARGUMENTS[N] 格式
  result = result.replace(/\$ARGUMENTS\[(\d+)\]/g, (_, index) => {
    const i = parseInt(index, 10);
    return args[i] ?? '';
  });
  
  // 替换 $N 格式 (简写)
  result = result.replace(/\$(\d+)(?!\d)/g, (_, index) => {
    const i = parseInt(index, 10);
    return args[i] ?? '';
  });
  
  // 替换环境变量 ${VAR_NAME}
  result = result.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, varName) => {
    return process.env[varName] ?? '';
  });
  
  return result;
}

/**
 * 提取动态上下文命令
 * 格式: !`command`
 */
export function extractDynamicCommands(instructions: string): string[] {
  const commandRegex = /!\`([^`]+)\`/g;
  const commands: string[] = [];
  let match;
  
  while ((match = commandRegex.exec(instructions)) !== null) {
    commands.push(match[1]);
  }
  
  return commands;
}

/**
 * 替换动态上下文命令的输出
 */
export function substituteDynamicContext(
  instructions: string,
  commandOutputs: Map<string, string>
): string {
  let result = instructions;
  
  for (const [command, output] of commandOutputs) {
    const pattern = new RegExp(`!\\\`${escapeRegex(command)}\\\``, 'g');
    result = result.replace(pattern, output);
  }
  
  return result;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 解析 /skill-name args 格式的命令
 */
export function parseSkillCommand(input: string): { skillName: string; arguments: string[] } | null {
  const trimmed = input.trim();
  
  if (!trimmed.startsWith('/')) {
    return null;
  }
  
  const parts = trimmed.slice(1).split(/\s+/);
  const skillName = parts[0];
  const args = parts.slice(1);
  
  if (!skillName) {
    return null;
  }
  
  return {
    skillName,
    arguments: args,
  };
}

/**
 * 验证 Skill 定义是否有效
 */
export function validateSkillDefinition(skill: SkillDefinition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!skill.name) {
    errors.push('Skill name is required');
  }
  
  if (!skill.name.match(/^[a-z0-9-]+$/)) {
    errors.push('Skill name must contain only lowercase letters, numbers, and hyphens');
  }
  
  if (!skill.instructions || skill.instructions.length === 0) {
    errors.push('Skill instructions are required');
  }
  
  if (skill.context === 'fork' && !skill.agent) {
    // 默认使用 Explore agent
    skill.agent = 'Explore';
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
