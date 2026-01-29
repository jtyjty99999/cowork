/**
 * Skill 系统入口
 * 导出所有 Skill 相关功能
 */

// 类型导出
export type {
  SkillDefinition,
  SkillFrontmatter,
  SkillInvocation,
  SkillExecutionResult,
  SkillMatch,
  SkillRegistryConfig,
  DynamicContextResult,
} from './types';

// 加载器
export {
  parseSkillContent,
  substituteArguments,
  extractDynamicCommands,
  substituteDynamicContext,
  parseSkillCommand,
  validateSkillDefinition,
} from './loader';

// 注册中心
export {
  initializeRegistry,
  registerSkill,
  unregisterSkill,
  getAllSkills,
  getSkill,
  getUserInvocableSkills,
  getModelInvocableSkills,
  matchSkills,
  registerSkillFromContent,
  generateSkillsDocumentation,
  getRegistryStats,
  clearRegistry,
  getConfig,
} from './registry';

// 执行器
export {
  executeSkill,
  prepareSkillPrompt,
  createSkillInvocation,
  isToolAllowed,
  getToolRestrictionMessage,
} from './executor';

// 发现服务
export {
  discoverSkillsFromAPI,
  registerSkillsFromContents,
  reloadAllSkills,
  watchSkillsDirectory,
  getSkillSupportingFiles,
  readSkillSupportingFile,
} from './discovery';
export type { DiscoveryResult } from './discovery';
