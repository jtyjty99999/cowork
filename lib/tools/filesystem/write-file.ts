/**
 * 写入文件工具
 */

import { fileSystemService } from '@/lib/filesystem-service';
import { getWorkspacePath } from '@/lib/workspace-context';
import { ToolDefinition } from '../types';

export const writeFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Write content to a file (creates or overwrites). For large files, use artifact_id to reference content.',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'File path relative to workspace',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'Content to write to the file (optional if artifact_id is provided)',
      required: false,
    },
    {
      name: 'artifact_id',
      type: 'string',
      description: 'ID of artifact containing the file content (for large files)',
      required: false,
    },
  ],
  examples: [
    {
      description: 'Create a simple text file',
      code: `\`\`\`tool:write_file
{
  "path": "hello.txt",
  "content": "Hello World"
}
\`\`\``,
    },
    {
      description: 'Create a markdown file',
      code: `\`\`\`tool:write_file
{
  "path": "notes.md",
  "content": "# My Notes\\n\\nThis is my note content."
}
\`\`\``,
    },
  ],
  execute: async (parameters) => {
    const result = await fileSystemService.writeFile(
      parameters.path,
      parameters.content,
      getWorkspacePath()
    );
    return { success: true, result };
  },
  formatResult: (result: any) => {
    if (!result.success) {
      return `❌ 写入失败: ${result.error}`;
    }
    
    // result.data 是 API 返回的数据（不是 result.result）
    const apiResponse = result.data || result.result;
    const filePath = apiResponse?.path || result.path || 'unknown';
    
    return `✅ 文件已保存\n📄 路径: \`${filePath}\``;
  },
  generateSummary: (parameters) => {
    return `写入文件: ${parameters.path}`;
  },
};
