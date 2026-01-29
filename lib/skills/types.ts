/**
 * Skill 系统类型定义
 * 基于 Claude Code 的 Skill 设计
 */

/**
 * Skill 的 frontmatter 配置
 */
export interface SkillFrontmatter {
  /** Skill 名称，用于 /name 调用 */
  name: string;
  
  /** Skill 描述，用于 AI 自动匹配和帮助显示 */
  description: string;
  
  /** 参数提示，如 [file-path] 或 [issue-number] */
  'argument-hint'?: string;
  
  /** 
   * 禁止 AI 自动调用
   * true = 只能用户通过 /name 手动调用
   * 适用于有副作用的操作如 /deploy, /commit
   */
  'disable-model-invocation'?: boolean;
  
  /**
   * 用户是否可调用
   * false = 只能 AI 自动调用，不显示在 / 命令列表中
   * 适用于背景知识类 skill
   */
  'user-invocable'?: boolean;
  
  /**
   * 限制可用工具列表
   * 如: ['read_file', 'search_files']
   */
  'allowed-tools'?: string[];
  
  /**
   * 执行上下文
   * - main: 在主对话中执行（默认）
   * - fork: 在子代理中执行，结果汇总返回
   */
  context?: 'main' | 'fork';
  
  /**
   * 子代理类型（仅当 context: fork 时有效）
   * - Explore: 探索型，适合研究和分析
   * - Plan: 规划型，适合制定方案
   */
  agent?: 'Explore' | 'Plan' | string;
  
  /**
   * 使用的模型（可选）
   */
  model?: string;
  
  /**
   * 生命周期钩子
   */
  hooks?: {
    'pre-execute'?: string;
    'post-execute'?: string;
  };
}

/**
 * Skill 定义
 */
export interface SkillDefinition {
  /** Skill 唯一标识 */
  id: string;
  
  /** Skill 名称 */
  name: string;
  
  /** Skill 描述 */
  description: string;
  
  /** 参数提示 */
  argumentHint?: string;
  
  /** 是否禁止 AI 自动调用 */
  disableModelInvocation: boolean;
  
  /** 用户是否可调用 */
  userInvocable: boolean;
  
  /** 允许的工具列表 */
  allowedTools?: string[];
  
  /** 执行上下文 */
  context: 'main' | 'fork';
  
  /** 子代理类型 */
  agent?: string;
  
  /** 使用的模型 */
  model?: string;
  
  /** 生命周期钩子 */
  hooks?: {
    preExecute?: string;
    postExecute?: string;
  };
  
  /** Skill 指令内容（frontmatter 之后的 markdown 内容） */
  instructions: string;
  
  /** Skill 文件路径 */
  filePath: string;
  
  /** Skill 目录路径 */
  directoryPath: string;
  
  /** 来源：user（用户全局）、project（项目级）、plugin（插件） */
  source: 'user' | 'project' | 'plugin';
  
  /** 支持文件列表 */
  supportingFiles?: string[];
}

/**
 * Skill 调用参数
 */
export interface SkillInvocation {
  /** Skill 名称 */
  skillName: string;
  
  /** 原始参数字符串 */
  rawArguments: string;
  
  /** 解析后的参数数组 */
  arguments: string[];
  
  /** 调用来源 */
  invokedBy: 'user' | 'model';
}

/**
 * Skill 执行结果
 */
export interface SkillExecutionResult {
  /** 是否成功 */
  success: boolean;
  
  /** 执行结果/输出 */
  output?: string;
  
  /** 错误信息 */
  error?: string;
  
  /** 执行耗时（毫秒） */
  duration?: number;
  
  /** 使用的工具调用记录 */
  toolCalls?: {
    tool: string;
    parameters: Record<string, any>;
    result?: any;
  }[];
}

/**
 * Skill 搜索/匹配结果
 */
export interface SkillMatch {
  /** 匹配的 Skill */
  skill: SkillDefinition;
  
  /** 匹配分数 (0-1) */
  score: number;
  
  /** 匹配原因 */
  reason: string;
}

/**
 * Skill 注册中心配置
 */
export interface SkillRegistryConfig {
  /** 用户全局 skills 目录 */
  userSkillsPath: string;
  
  /** 项目 skills 目录 */
  projectSkillsPath: string;
  
  /** 是否启用自动发现嵌套目录中的 skills */
  enableNestedDiscovery: boolean;
  
  /** 最大 skill 内容长度（字符） */
  maxSkillContentLength: number;
}

/**
 * 动态上下文注入结果
 */
export interface DynamicContextResult {
  /** 原始命令 */
  command: string;
  
  /** 执行输出 */
  output: string;
  
  /** 是否成功 */
  success: boolean;
  
  /** 错误信息 */
  error?: string;
}
