/**
 * 文件系统服务
 * 提供安全的文件读写操作
 */

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export interface ReadFileResult {
  content: string;
  path: string;
  encoding: string;
}

export interface WriteFileResult {
  success: boolean;
  path: string;
  message?: string;
}

export class FileSystemService {
  private baseDir: string;

  constructor(baseDir?: string) {
    // 默认使用项目根目录下的 workspace 文件夹
    this.baseDir = baseDir || '/workspace';
  }

  /**
   * 列出目录内容
   */
  async listDirectory(path: string = '.', workspacePath?: string): Promise<FileInfo[]> {
    try {
      const response = await fetch('/api/filesystem/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, workspacePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '列出目录失败');
      }

      return await response.json();
    } catch (error) {
      console.error('列出目录失败:', error);
      throw error;
    }
  }

  /**
   * 读取文件内容
   */
  async readFile(path: string, workspacePath?: string): Promise<ReadFileResult> {
    try {
      const response = await fetch('/api/filesystem/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, workspacePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '读取文件失败');
      }

      return await response.json();
    } catch (error) {
      console.error('读取文件失败:', error);
      throw error;
    }
  }

  /**
   * 写入文件
   */
  async writeFile(path: string, content: string, workspacePath?: string): Promise<WriteFileResult> {
    try {
      const response = await fetch('/api/filesystem/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content, workspacePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '写入文件失败');
      }

      return await response.json();
    } catch (error) {
      console.error('写入文件失败:', error);
      throw error;
    }
  }

  /**
   * 创建目录
   */
  async createDirectory(path: string): Promise<WriteFileResult> {
    try {
      const response = await fetch('/api/filesystem/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '创建目录失败');
      }

      return await response.json();
    } catch (error) {
      console.error('创建目录失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件或目录
   */
  async delete(path: string): Promise<WriteFileResult> {
    try {
      const response = await fetch('/api/filesystem/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除失败');
      }

      return await response.json();
    } catch (error) {
      console.error('删除失败:', error);
      throw error;
    }
  }

  /**
   * 移动或重命名文件
   */
  async moveFile(source: string, destination: string, workspacePath?: string): Promise<WriteFileResult> {
    try {
      const response = await fetch('/api/filesystem/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination, workspacePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '移动文件失败');
      }

      return await response.json();
    } catch (error) {
      console.error('移动文件失败:', error);
      throw error;
    }
  }

  /**
   * 搜索文件
   */
  async searchFiles(pattern: string, directory: string = '.'): Promise<FileInfo[]> {
    try {
      const response = await fetch('/api/filesystem/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, directory }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '搜索文件失败');
      }

      return await response.json();
    } catch (error) {
      console.error('搜索文件失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const fileSystemService = new FileSystemService();
