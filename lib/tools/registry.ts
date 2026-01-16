/**
 * 工具注册中心
 * 管理所有可用的工具
 */

import { ToolDefinition, ToolCall, ToolResult } from './types';
import * as filesystemTools from './filesystem';
import * as webTools from './web';

// 注册所有工具
const toolRegistry = new Map<string, ToolDefinition>();

// 注册文件系统工具
Object.values(filesystemTools).forEach(tool => {
  toolRegistry.set(tool.name, tool);
});

// 注册网络工具
Object.values(webTools).forEach(tool => {
  toolRegistry.set(tool.name, tool);
});

/**
 * 获取所有工具
 */
export function getAllTools(): ToolDefinition[] {
  return Array.from(toolRegistry.values());
}

/**
 * 根据名称获取工具
 */
export function getTool(name: string): ToolDefinition | undefined {
  return toolRegistry.get(name);
}

/**
 * 执行工具调用
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const tool = getTool(toolCall.tool);
  
  if (!tool) {
    return {
      success: false,
      error: `未知的工具: ${toolCall.tool}`,
    };
  }

  try {
    return await tool.execute(toolCall.parameters);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 批量执行工具调用
 */
export async function executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  
  for (const toolCall of toolCalls) {
    const result = await executeToolCall(toolCall);
    results.push(result);
  }
  
  return results;
}

/**
 * 生成工具文档
 */
export function generateToolsDocumentation(): string {
  const tools = getAllTools();
  const categories = new Map<string, ToolDefinition[]>();

  // 按类别分组
  tools.forEach(tool => {
    const category = tool.name.includes('_file') || tool.name.includes('_directory') || tool.name.includes('search_files')
      ? 'File System'
      : 'Web Access';
    
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(tool);
  });

  let doc = `## Available Tools\n\nYou can call tools by using the following format in your response:\n\n\`\`\`tool:tool_name\n{\n  "parameter1": "value1",\n  "parameter2": "value2"\n}\n\`\`\`\n\n`;

  // 生成每个类别的文档
  categories.forEach((tools, category) => {
    doc += `### ${category} Tools\n\n`;
    
    tools.forEach((tool, index) => {
      doc += `${index + 1}. **${tool.name}** - ${tool.description}\n`;
      
      // 添加参数说明
      if (tool.parameters.length > 0) {
        doc += `   Parameters:\n`;
        tool.parameters.forEach(param => {
          doc += `   - \`${param.name}\` (${param.type})${param.required ? ' *required*' : ''}: ${param.description}\n`;
        });
      }
      
      // 添加示例
      if (tool.examples.length > 0) {
        doc += `   \n`;
        tool.examples.forEach(example => {
          doc += `   ${example.description}:\n   ${example.code}\n   \n`;
        });
      }
      
      doc += '\n';
    });
  });

  doc += `## Important Notes\n\n`;
  doc += `- Always use tool calls when the user asks you to perform file operations or web requests\n`;
  doc += `- After calling a tool, the system will execute it and show you the result\n`;
  doc += `- You can call multiple tools in one response\n`;
  doc += `- All file paths are relative to the workspace directory\n`;
  doc += `- For web requests, you can access any public HTTP/HTTPS URL\n`;
  doc += `- When fetching web content, you'll receive the full response including status, headers, and data\n`;

  return doc;
}
