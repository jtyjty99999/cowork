import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.cwd(), 'workspace');

// 危险命令黑名单
const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'dd if=',
  'mkfs',
  'format',
  ':(){:|:&};:',  // fork bomb
  'chmod 777',
  'chown',
  'sudo',
  'su ',
];

// 检查命令是否安全
function isCommandSafe(command: string): { safe: boolean; reason?: string } {
  // 检查危险命令
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (command.includes(dangerous)) {
      return {
        safe: false,
        reason: `命令包含危险操作: ${dangerous}`,
      };
    }
  }

  // 检查是否尝试访问敏感目录
  const sensitivePatterns = [
    '~/.ssh',
    '~/.aws',
    '/etc/passwd',
    '/etc/shadow',
    '.env',
  ];

  for (const pattern of sensitivePatterns) {
    if (command.includes(pattern)) {
      return {
        safe: false,
        reason: `命令尝试访问敏感路径: ${pattern}`,
      };
    }
  }

  return { safe: true };
}

export async function POST(req: NextRequest) {
  try {
    const { command, workingDir = '.', config } = await req.json();

    if (!command) {
      return NextResponse.json(
        { error: '缺少命令' },
        { status: 400 }
      );
    }

    // 验证命令安全性
    const validation = isCommandSafe(command);
    if (!validation.safe) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 403 }
      );
    }

    // 设置工作目录
    const cwd = path.resolve(WORKSPACE_ROOT, workingDir);
    
    // 确保工作目录在 workspace 内
    if (!cwd.startsWith(WORKSPACE_ROOT)) {
      return NextResponse.json(
        { error: '工作目录超出允许范围' },
        { status: 403 }
      );
    }

    console.log('🔒 执行沙箱命令:', { command, cwd });

    // 执行命令（带超时）
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 30000, // 30秒超时
      maxBuffer: 1024 * 1024, // 1MB 输出限制
      env: {
        ...process.env,
        // 限制环境变量
        PATH: process.env.PATH,
        HOME: WORKSPACE_ROOT,
      },
    });

    console.log('✅ 命令执行成功');

    return NextResponse.json({
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: 0,
      success: true,
    });
  } catch (error: any) {
    console.error('❌ 命令执行失败:', error);

    return NextResponse.json({
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '命令执行失败',
      exitCode: error.code || 1,
      success: false,
    });
  }
}
