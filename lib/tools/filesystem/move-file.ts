/**
 * 移动文件工具
 */

import { fileSystemService } from '@/lib/filesystem-service';
import { getWorkspacePath } from '@/lib/workspace-context';
import { ToolDefinition } from '../types';

export const moveFileTool: ToolDefinition = {
  name: 'move_file',
  description: 'Move or rename a file or directory',
  parameters: [
    {
      name: 'source',
      type: 'string',
      description: 'Source path of the file or directory to move',
      required: true,
    },
    {
      name: 'destination',
      type: 'string',
      description: 'Destination path where the file or directory should be moved',
      required: true,
    },
  ],
  examples: [
    {
      description: 'Move a file to a different directory',
      code: `\`\`\`tool:move_file
{
  "source": "old_location/file.txt",
  "destination": "new_location/file.txt"
}
\`\`\``,
    },
    {
      description: 'Rename a file',
      code: `\`\`\`tool:move_file
{
  "source": "old_name.txt",
  "destination": "new_name.txt"
}
\`\`\``,
    },
  ],
  execute: async (parameters) => {
    try {
      const result = await fileSystemService.moveFile(
        parameters.source,
        parameters.destination,
        getWorkspacePath()
      );
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '移动文件失败'
      };
    }
  },
  formatResult: (result) => {
    if (!result.success) {
      return `❌ 移动失败: ${result.error}`;
    }
    const resultData = result as any;
    const data = resultData.data || resultData.result;
    const source = data?.source || '未知源路径';
    const destination = data?.destination || '未知目标路径';
    return `✅ 文件已移动\n📁 从: \`${source}\`\n📁 到: \`${destination}\``;
  },
  generateSummary: (parameters) => {
    return `移动文件: ${parameters.source} → ${parameters.destination}`;
  },
};
