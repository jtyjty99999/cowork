/**
 * 搜索文件工具
 */

import { fileSystemService } from '@/lib/filesystem-service';
import { getWorkspacePath } from '@/lib/workspace-context';
import { ToolDefinition } from '../types';

export const searchFilesTool: ToolDefinition = {
  name: 'search_files',
  description: 'Search for files matching a pattern',
  parameters: [
    {
      name: 'pattern',
      type: 'string',
      description: 'Search pattern (e.g., *.md)',
      required: true,
    },
    {
      name: 'directory',
      type: 'string',
      description: 'Directory to search in (default: current)',
      required: false,
    },
  ],
  examples: [
    {
      description: 'Search for markdown files',
      code: `\`\`\`tool:search_files
{
  "pattern": "*.md",
  "directory": "."
}
\`\`\``,
    },
  ],
  execute: async (parameters) => {
    const result = await fileSystemService.searchFiles(
      parameters.pattern,
      parameters.directory
    );
    return { success: true, result };
  },
  formatResult: (result) => {
    if (!result.success) {
      return `❌ 搜索失败: ${result.error}`;
    }
    const files = result.result;
    if (!files || files.length === 0) {
      return '🔍 未找到匹配的文件';
    }
    const displayFiles = files.slice(0, 10);
    const fileList = displayFiles.map((f: any) => `📄 ${f.name}`).join('\n');
    const more = files.length > 10 ? `\n... 还有 ${files.length - 10} 个文件` : '';
    return `🔍 找到 ${files.length} 个文件:\n${fileList}${more}`;
  },
  generateSummary: (parameters) => {
    return `搜索: ${parameters.pattern}`;
  },
};
