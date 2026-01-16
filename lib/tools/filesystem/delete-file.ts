/**
 * 删除文件工具
 */

import { fileSystemService } from '@/lib/filesystem-service';
import { getWorkspacePath } from '@/lib/workspace-context';
import { ToolDefinition } from '../types';

export const deleteFileTool: ToolDefinition = {
  name: 'delete_file',
  description: 'Delete a file or directory',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'Path to file or directory to delete',
      required: true,
    },
  ],
  examples: [
    {
      description: 'Delete a file',
      code: `\`\`\`tool:delete_file
{
  "path": "old_file.txt"
}
\`\`\``,
    },
  ],
  execute: async (parameters) => {
    const result = await fileSystemService.delete(parameters.path);
    return { success: true, result };
  },
  formatResult: (result) => {
    if (!result.success) {
      return `❌ 删除失败: ${result.error}`;
    }
    return `✅ 已删除\n🗑️ 路径: \`${result.result.path}\``;
  },
  generateSummary: (parameters) => {
    return `删除: ${parameters.path}`;
  },
};
