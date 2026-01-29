/**
 * Skills 管理 Hook
 * 提供 Skills 的加载、执行和管理功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SkillDefinition,
  SkillInvocation,
  SkillExecutionResult,
  DiscoveryResult,
  getAllSkills,
  getSkill,
  getUserInvocableSkills,
  matchSkills,
  registerSkill,
  clearRegistry,
  initializeRegistry,
  parseSkillCommand,
  createSkillInvocation,
  executeSkill,
  prepareSkillPrompt,
  generateSkillsDocumentation,
} from '@/lib/skills';

interface UseSkillsOptions {
  userSkillsPath?: string;
  projectSkillsPath?: string;
  autoLoad?: boolean;
}

interface UseSkillsReturn {
  skills: SkillDefinition[];
  userInvocableSkills: SkillDefinition[];
  isLoading: boolean;
  error: string | null;
  loadSkills: () => Promise<DiscoveryResult>;
  getSkillByName: (name: string) => SkillDefinition | undefined;
  matchSkillsForInput: (input: string) => { skill: SkillDefinition; score: number; reason: string }[];
  parseCommand: (input: string) => { skillName: string; arguments: string[] } | null;
  invokeSkill: (
    skillName: string,
    args: string,
    invokedBy: 'user' | 'model'
  ) => Promise<SkillExecutionResult>;
  preparePrompt: (skill: SkillDefinition, args: string[]) => string;
  getDocumentation: () => string;
  isSkillCommand: (input: string) => boolean;
}

export function useSkills(options: UseSkillsOptions = {}): UseSkillsReturn {
  const {
    userSkillsPath = '~/.cowork/skills',
    projectSkillsPath = '.cowork/skills',
    autoLoad = true,
  } = options;

  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const loadSkills = useCallback(async (): Promise<DiscoveryResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // 清空并重新初始化注册中心
      clearRegistry();
      initializeRegistry({
        userSkillsPath,
        projectSkillsPath,
      });

      // 调用 API 发现 Skills
      const response = await fetch('/api/skills/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userSkillsPath, projectSkillsPath }),
      });

      if (!response.ok) {
        throw new Error(`Failed to discover skills: ${response.statusText}`);
      }

      const result: DiscoveryResult = await response.json();

      // 注册发现的 Skills（API 返回的是已解析的 skill 对象）
      for (const skill of result.skills) {
        registerSkill(skill);
      }

      // 更新状态
      setSkills(getAllSkills());

      if (result.errors.length > 0) {
        console.warn('Some skills failed to load:', result.errors);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        skills: [],
        errors: [{ path: 'API', error: errorMessage }],
        scannedPaths: [],
      };
    } finally {
      setIsLoading(false);
    }
  }, [userSkillsPath, projectSkillsPath]);

  // 自动加载 Skills
  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      loadSkills();
    }
  }, [autoLoad, loadSkills]);

  const getSkillByName = useCallback((name: string) => {
    return getSkill(name);
  }, []);

  const matchSkillsForInput = useCallback((input: string) => {
    return matchSkills(input);
  }, []);

  const parseCommand = useCallback((input: string) => {
    return parseSkillCommand(input);
  }, []);

  const isSkillCommand = useCallback((input: string) => {
    return input.trim().startsWith('/');
  }, []);

  const invokeSkill = useCallback(async (
    skillName: string,
    args: string,
    invokedBy: 'user' | 'model'
  ): Promise<SkillExecutionResult> => {
    const invocation = createSkillInvocation(skillName, args, invokedBy);
    
    return executeSkill(invocation, {
      onProgress: () => {},
      onDynamicContext: async (command) => {
        return {
          command,
          output: `[Command output for: ${command}]`,
          success: true,
        };
      },
    });
  }, []);

  const preparePrompt = useCallback((skill: SkillDefinition, args: string[]) => {
    return prepareSkillPrompt(skill, args);
  }, []);

  const getDocumentation = useCallback(() => {
    return generateSkillsDocumentation();
  }, []);

  const userInvocableSkills = skills.filter(s => s.userInvocable);

  return {
    skills,
    userInvocableSkills,
    isLoading,
    error,
    loadSkills,
    getSkillByName,
    matchSkillsForInput,
    parseCommand,
    invokeSkill,
    preparePrompt,
    getDocumentation,
    isSkillCommand,
  };
}
