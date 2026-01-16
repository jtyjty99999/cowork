/**
 * 创建目录工具
 */

import { fileSystemService } from '@/lib/filesystem-service';
import { getWorkspacePath } from '@/lib/workspace-context';
import { ToolDefinition } from '../types';

export const createDirectoryTool: ToolDefinition = {
  name: 'create_directory',
  description: 'Create a new directory',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'Directory path to create',
      required: true,
    },
  ],
  examples: [
    {
      description: 'Create a folder',
      code: `\`\`\`tool:create_directory
{
  "path": "my_folder"
}
\`\`\``,
    },
  ],
  execute: async (parameters) => {
    const result = await fileSystemService.createDirectory(parameters.path);
    return { success: true, result };
  },
  formatResult: (result) => {
    if (!result.success) {
      return `❌ 创建失败: ${result.error}`;
    }
    return `✅ 目录已创建\n📁 路径: \`${result.result.path}\``;
  },
  generateSummary: (parameters) => {
    return `创建目录: ${parameters.path}`;
  },
};
