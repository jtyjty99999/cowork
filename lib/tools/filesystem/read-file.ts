/**
 * 读取文件工具
 */

import { fileSystemService } from '@/lib/filesystem-service';
import { getWorkspacePath } from '@/lib/workspace-context';
import { ToolDefinition } from '../types';

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read content from a file',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'File path relative to workspace',
      required: true,
    },
  ],
  examples: [
    {
      description: 'Read a text file',
      code: `\`\`\`tool:read_file
{
  "path": "notes.md"
}
\`\`\``,
    },
  ],
  execute: async (parameters) => {
    try {
      const result = await fileSystemService.readFile(parameters.path, getWorkspacePath());
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '读取文件失败'
      };
    }
  },
  formatResult: (result) => {
    if (!result.success) {
      return `❌ 读取失败: ${result.error}`;
    }
    const resultData = result as any;
    const data = resultData.data || resultData.result;
    const content = data?.content || '';
    const path = data?.path || '未知路径';
    const contentPreview = content.length > 200 
      ? content.slice(0, 200) + '...' 
      : content;
    return `✅ 文件读取成功\n📄 路径: \`${path}\`\n📝 内容:\n\`\`\`\n${contentPreview}\n\`\`\``;
  },
  generateSummary: (parameters) => {
    return `读取文件: ${parameters.path}`;
  },
};
