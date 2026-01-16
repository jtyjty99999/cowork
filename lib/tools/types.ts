/**
 * 工具系统类型定义
 */

export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
  examples: {
    description: string;
    code: string;
  }[];
  execute: (parameters: Record<string, any>) => Promise<ToolResult>;
  formatResult?: (result: ToolResult) => string;
  generateSummary?: (parameters: Record<string, any>) => string;
}
