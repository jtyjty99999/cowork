/**
 * 沙箱服务
 * 基于 Anthropic Sandbox Runtime 提供安全的命令执行
 */

export interface SandboxConfig {
  network?: {
    allowedDomains?: string[];
    deniedDomains?: string[];
    allowLocalBinding?: boolean;
  };
  filesystem?: {
    denyRead?: string[];
    allowWrite?: string[];
    denyWrite?: string[];
  };
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export class SandboxService {
  private config: SandboxConfig;

  constructor(config?: SandboxConfig) {
    this.config = config || this.getDefaultConfig();
  }

  /**
   * 获取默认沙箱配置
   */
  private getDefaultConfig(): SandboxConfig {
    return {
      network: {
        allowedDomains: [
          'github.com',
          '*.github.com',
          'npmjs.org',
          '*.npmjs.org',
          'anthropic.com',
          'openai.com',
        ],
        deniedDomains: [],
        allowLocalBinding: false,
      },
      filesystem: {
        denyRead: [
          '~/.ssh',
          '~/.aws',
          '~/.config',
          '/etc/passwd',
          '/etc/shadow',
        ],
        allowWrite: [
          './workspace',
          '/tmp',
        ],
        denyWrite: [
          '.env',
          '.env.local',
          'package.json',
        ],
      },
    };
  }

  /**
   * 在沙箱中执行命令
   */
  async executeCommand(command: string, workingDir?: string): Promise<CommandResult> {
    try {
      const response = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          workingDir,
          config: this.config,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '命令执行失败');
      }

      return await response.json();
    } catch (error) {
      console.error('沙箱命令执行失败:', error);
      throw error;
    }
  }

  /**
   * 检查命令是否安全
   */
  async validateCommand(command: string): Promise<{ safe: boolean; reason?: string }> {
    try {
      const response = await fetch('/api/sandbox/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '命令验证失败');
      }

      return await response.json();
    } catch (error) {
      console.error('命令验证失败:', error);
      throw error;
    }
  }

  /**
   * 更新沙箱配置
   */
  updateConfig(config: Partial<SandboxConfig>) {
    this.config = {
      ...this.config,
      ...config,
      network: {
        ...this.config.network,
        ...config.network,
      },
      filesystem: {
        ...this.config.filesystem,
        ...config.filesystem,
      },
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): SandboxConfig {
    return { ...this.config };
  }
}

// 导出单例
export const sandboxService = new SandboxService();
