/**
 * AI 工具调用系统
 * 允许 AI 通过特定格式调用实际的功能
 */

import { fileSystemService } from './filesystem-service';
import { webService } from './web-service';

export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * 解析 AI 响应中的工具调用
 * 格式: ```tool:function_name
 * {
 *   "param1": "value1"
 * }
 * ```
 */
export function parseToolCalls(content: string): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  const regex = /```tool:(\w+)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    try {
      const tool = match[1];
      const parameters = JSON.parse(match[2]);
      toolCalls.push({ tool, parameters });
    } catch (error) {
      console.error('解析工具调用失败:', error);
    }
  }

  return toolCalls;
}

/**
 * 执行工具调用
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const { tool, parameters } = toolCall;

  try {
    switch (tool) {
      // 文件系统操作
      case 'write_file':
        const writeResult = await fileSystemService.writeFile(
          parameters.path,
          parameters.content
        );
        return { success: true, result: writeResult };

      case 'read_file':
        const readResult = await fileSystemService.readFile(parameters.path);
        return { success: true, result: readResult };

      case 'list_directory':
        const listResult = await fileSystemService.listDirectory(parameters.path || '.');
        return { success: true, result: listResult };

      case 'create_directory':
        const mkdirResult = await fileSystemService.createDirectory(parameters.path);
        return { success: true, result: mkdirResult };

      case 'delete_file':
        const deleteResult = await fileSystemService.delete(parameters.path);
        return { success: true, result: deleteResult };

      case 'search_files':
        const searchResult = await fileSystemService.searchFiles(
          parameters.pattern,
          parameters.directory
        );
        return { success: true, result: searchResult };

      // 网络访问
      case 'fetch_url':
        const fetchResult = await webService.fetch({
          url: parameters.url,
          method: parameters.method || 'GET',
          headers: parameters.headers,
          body: parameters.body,
        });
        return { success: true, result: fetchResult };

      default:
        return {
          success: false,
          error: `未知的工具: ${tool}`,
        };
    }
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
 * 生成工具使用说明（用于 AI 系统提示词）
 */
export function getToolsDescription(): string {
  return `
## Available Tools

You can call tools by using the following format in your response:

\`\`\`tool:tool_name
{
  "parameter1": "value1",
  "parameter2": "value2"
}
\`\`\`

### File System Tools

1. **write_file** - Write content to a file
   \`\`\`tool:write_file
   {
     "path": "filename.txt",
     "content": "file content here"
   }
   \`\`\`

2. **read_file** - Read file content
   \`\`\`tool:read_file
   {
     "path": "filename.txt"
   }
   \`\`\`

3. **list_directory** - List files in directory
   \`\`\`tool:list_directory
   {
     "path": "."
   }
   \`\`\`

4. **create_directory** - Create a new directory
   \`\`\`tool:create_directory
   {
     "path": "folder_name"
   }
   \`\`\`

5. **delete_file** - Delete a file or directory
   \`\`\`tool:delete_file
   {
     "path": "filename.txt"
   }
   \`\`\`

6. **search_files** - Search for files
   \`\`\`tool:search_files
   {
     "pattern": "*.md",
     "directory": "."
   }
   \`\`\`

### Web Access Tools

7. **fetch_url** - Fetch content from a URL (supports GET, POST, etc.)
   
   Example 1 - Simple GET request:
   \`\`\`tool:fetch_url
   {
     "url": "https://api.github.com/repos/microsoft/vscode",
     "method": "GET"
   }
   \`\`\`
   
   Example 2 - POST request with body:
   \`\`\`tool:fetch_url
   {
     "url": "https://api.example.com/data",
     "method": "POST",
     "headers": {
       "Content-Type": "application/json"
     },
     "body": {
       "key": "value"
     }
   }
   \`\`\`

## Important Notes

- Always use tool calls when the user asks you to perform file operations or web requests
- After calling a tool, the system will execute it and show you the result
- You can call multiple tools in one response
- All file paths are relative to the workspace directory
- For web requests, you can access any public HTTP/HTTPS URL
- When fetching web content, you'll receive the full response including status, headers, and data
`;
}
