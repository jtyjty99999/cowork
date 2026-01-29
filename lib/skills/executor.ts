/**
 * Skill 执行器
 * 负责执行 Skill，处理参数替换、动态上下文注入等
 */

import { 
  SkillDefinition, 
  SkillInvocation, 
  SkillExecutionResult,
  DynamicContextResult 
} from './types';
import { 
  substituteArguments, 
  extractDynamicCommands, 
  substituteDynamicContext 
} from './loader';
import { getSkill } from './registry';

/**
 * 执行 Skill
 */
export async function executeSkill(
  invocation: SkillInvocation,
  options?: {
    onToolCall?: (tool: string, params: Record<string, any>) => Promise<any>;
    onDynamicContext?: (command: string) => Promise<DynamicContextResult>;
    onProgress?: (message: string) => void;
  }
): Promise<SkillExecutionResult> {
  const startTime = Date.now();
  const skill = getSkill(invocation.skillName);
  
  if (!skill) {
    return {
      success: false,
      error: `Skill not found: ${invocation.skillName}`,
      duration: Date.now() - startTime,
    };
  }
  
  // 检查调用权限
  const permissionCheck = checkInvocationPermission(skill, invocation);
  if (!permissionCheck.allowed) {
    return {
      success: false,
      error: permissionCheck.reason,
      duration: Date.now() - startTime,
    };
  }
  
  try {
    options?.onProgress?.(`Executing skill: ${skill.name}`);
    
    // 1. 参数替换
    let processedInstructions = substituteArguments(
      skill.instructions, 
      invocation.arguments
    );
    
    // 2. 动态上下文注入
    const dynamicCommands = extractDynamicCommands(processedInstructions);
    if (dynamicCommands.length > 0 && options?.onDynamicContext) {
      options?.onProgress?.(`Injecting dynamic context (${dynamicCommands.length} commands)`);
      
      const commandOutputs = new Map<string, string>();
      
      for (const command of dynamicCommands) {
        const result = await options.onDynamicContext(command);
        if (result.success) {
          commandOutputs.set(command, result.output);
        } else {
          commandOutputs.set(command, `[Error: ${result.error}]`);
        }
      }
      
      processedInstructions = substituteDynamicContext(processedInstructions, commandOutputs);
    }
    
    // 3. 执行前钩子
    if (skill.hooks?.preExecute && options?.onDynamicContext) {
      options?.onProgress?.('Running pre-execute hook');
      await options.onDynamicContext(skill.hooks.preExecute);
    }
    
    // 4. 根据 context 类型执行
    let output: string;
    const toolCalls: SkillExecutionResult['toolCalls'] = [];
    
    if (skill.context === 'fork') {
      // 在子代理中执行
      output = await executeInSubagent(skill, processedInstructions, options);
    } else {
      // 在主对话中执行 - 返回处理后的指令供 AI 使用
      output = processedInstructions;
    }
    
    // 5. 执行后钩子
    if (skill.hooks?.postExecute && options?.onDynamicContext) {
      options?.onProgress?.('Running post-execute hook');
      await options.onDynamicContext(skill.hooks.postExecute);
    }
    
    return {
      success: true,
      output,
      duration: Date.now() - startTime,
      toolCalls,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * 检查调用权限
 */
function checkInvocationPermission(
  skill: SkillDefinition, 
  invocation: SkillInvocation
): { allowed: boolean; reason?: string } {
  // 用户调用
  if (invocation.invokedBy === 'user') {
    if (!skill.userInvocable) {
      return {
        allowed: false,
        reason: `Skill "${skill.name}" is not user-invocable (background knowledge only)`,
      };
    }
    return { allowed: true };
  }
  
  // AI 自动调用
  if (invocation.invokedBy === 'model') {
    if (skill.disableModelInvocation) {
      return {
        allowed: false,
        reason: `Skill "${skill.name}" can only be invoked by user (has side effects)`,
      };
    }
    return { allowed: true };
  }
  
  return { allowed: true };
}

/**
 * 在子代理中执行 Skill
 */
async function executeInSubagent(
  skill: SkillDefinition,
  instructions: string,
  options?: {
    onToolCall?: (tool: string, params: Record<string, any>) => Promise<any>;
    onProgress?: (message: string) => void;
  }
): Promise<string> {
  options?.onProgress?.(`Starting subagent (${skill.agent || 'Explore'})`);
  
  // TODO: 实现真正的子代理执行
  // 目前返回指令内容，由调用方处理
  return `[Subagent: ${skill.agent || 'Explore'}]\n\n${instructions}`;
}

/**
 * 准备 Skill 执行的提示词
 * 将 Skill 指令转换为 AI 可理解的格式
 */
export function prepareSkillPrompt(
  skill: SkillDefinition,
  args: string[]
): string {
  let prompt = '';
  
  // 添加 Skill 元信息
  prompt += `## Skill: ${skill.name}\n\n`;
  
  if (skill.description) {
    prompt += `**Description**: ${skill.description}\n\n`;
  }
  
  // 工具限制提示
  if (skill.allowedTools && skill.allowedTools.length > 0) {
    prompt += `**Allowed Tools**: ${skill.allowedTools.join(', ')}\n`;
    prompt += `*Note: Only use the tools listed above for this skill.*\n\n`;
  }
  
  // 替换参数后的指令
  const instructions = substituteArguments(skill.instructions, args);
  prompt += `## Instructions\n\n${instructions}\n`;
  
  return prompt;
}

/**
 * 创建 Skill 调用对象
 */
export function createSkillInvocation(
  skillName: string,
  rawArguments: string,
  invokedBy: 'user' | 'model'
): SkillInvocation {
  // 解析参数（支持引号包裹的参数）
  const args = parseArguments(rawArguments);
  
  return {
    skillName,
    rawArguments,
    arguments: args,
    invokedBy,
  };
}

/**
 * 解析参数字符串
 * 支持空格分隔和引号包裹
 */
function parseArguments(argsString: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (const char of argsString) {
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    args.push(current);
  }
  
  return args;
}

/**
 * 验证工具调用是否在允许列表中
 */
export function isToolAllowed(skill: SkillDefinition, toolName: string): boolean {
  // 如果没有限制，允许所有工具
  if (!skill.allowedTools || skill.allowedTools.length === 0) {
    return true;
  }
  
  // 检查是否在允许列表中
  return skill.allowedTools.some(allowed => {
    // 支持通配符，如 "Bash(*)" 或 "read_*"
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(toolName);
    }
    return allowed === toolName;
  });
}

/**
 * 获取 Skill 的工具限制描述
 */
export function getToolRestrictionMessage(skill: SkillDefinition): string | null {
  if (!skill.allowedTools || skill.allowedTools.length === 0) {
    return null;
  }
  
  return `This skill is restricted to the following tools: ${skill.allowedTools.join(', ')}`;
}
