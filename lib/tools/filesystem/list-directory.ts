/**
 * 列出目录工具
 */

import { fileSystemService } from '@/lib/filesystem-service';
import { getWorkspacePath } from '@/lib/workspace-context';
import { ToolDefinition } from '../types';

export const listDirectoryTool: ToolDefinition = {
  name: 'list_directory',
  description: 'List files and directories in a path',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'Directory path (default: current directory)',
      required: false,
    },
  ],
  examples: [
    {
      description: 'List current directory',
      code: `\`\`\`tool:list_directory
{
  "path": "."
}
\`\`\``,
    },
  ],
  execute: async (parameters) => {
    const result = await fileSystemService.listDirectory(parameters.path || '.', getWorkspacePath());
    return { success: true, result };
  },
  formatResult: (result) => {
    if (!result.success) {
      return `❌ 列出目录失败: ${result.error}`;
    }
    const files = result.result;
    if (!files || files.length === 0) {
      return '📂 目录为空';
    }
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes}B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
    };
    const displayFiles = files.slice(0, 10);
    const fileList = displayFiles.map((f: any) => {
      const icon = f.type === 'directory' ? '📁' : '📄';
      const size = f.size ? ` (${formatFileSize(f.size)})` : '';
      return `${icon} ${f.name}${size}`;
    }).join('\n');
    const more = files.length > 10 ? `\n... 还有 ${files.length - 10} 个项目` : '';
    return `📂 找到 ${files.length} 个项目:\n${fileList}${more}`;
  },
  generateSummary: (parameters) => {
    return `列出目录: ${parameters.path || '.'}`;
  },
};
