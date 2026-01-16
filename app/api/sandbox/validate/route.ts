import { NextRequest, NextResponse } from 'next/server';

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

// 敏感路径
const SENSITIVE_PATHS = [
  '~/.ssh',
  '~/.aws',
  '~/.config',
  '/etc/passwd',
  '/etc/shadow',
  '.env',
  '.env.local',
];

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();

    if (!command) {
      return NextResponse.json(
        { error: '缺少命令' },
        { status: 400 }
      );
    }

    // 检查危险命令
    for (const dangerous of DANGEROUS_COMMANDS) {
      if (command.includes(dangerous)) {
        return NextResponse.json({
          safe: false,
          reason: `命令包含危险操作: ${dangerous}`,
        });
      }
    }

    // 检查敏感路径
    for (const sensitive of SENSITIVE_PATHS) {
      if (command.includes(sensitive)) {
        return NextResponse.json({
          safe: false,
          reason: `命令尝试访问敏感路径: ${sensitive}`,
        });
      }
    }

    // 检查命令长度
    if (command.length > 1000) {
      return NextResponse.json({
        safe: false,
        reason: '命令过长',
      });
    }

    return NextResponse.json({
      safe: true,
    });
  } catch (error) {
    console.error('命令验证失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '命令验证失败' },
      { status: 500 }
    );
  }
}
