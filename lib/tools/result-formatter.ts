/**
 * 工具调用结果格式化器
 * 使用工具自己的格式化方法，提供回退逻辑
 */

import { ToolResult } from './types';
import { getTool } from './registry';

/**
 * 格式化工具调用结果
 * 优先使用工具自己的 formatResult 方法
 */
export function formatToolResult(toolName: string, result: ToolResult): string {
  const tool = getTool(toolName);
  
  // 使用工具自己的格式化方法
  if (tool?.formatResult) {
    return tool.formatResult(result);
  }
  
  // 回退：默认格式化
  if (!result.success) {
    return `❌ 执行失败: ${result.error}`;
  }
  
  return JSON.stringify(result.result, null, 2);
}

/**
 * 生成工具调用摘要
 * 优先使用工具自己的 generateSummary 方法
 */
export function generateToolSummary(toolName: string, parameters: Record<string, any>): string {
  const tool = getTool(toolName);
  
  // 使用工具自己的摘要方法
  if (tool?.generateSummary) {
    return tool.generateSummary(parameters);
  }
  
  // 回退：使用工具名称
  return toolName;
}
