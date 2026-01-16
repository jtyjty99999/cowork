# 📁 文件系统与沙箱功能指南

## 🎯 功能概述

本项目集成了安全的文件系统访问和沙箱命令执行功能，让 AI 可以安全地操作文件和执行命令。

### 核心特性

✅ **文件系统访问**
- 读取/写入文件
- 创建/删除目录
- 搜索文件
- 列出目录内容

✅ **沙箱命令执行**
- 安全的命令执行环境
- 危险命令黑名单
- 敏感路径保护
- 超时和输出限制

---

## 📂 文件系统服务

### 工作区配置

所有文件操作都限制在 `workspace` 目录内：

```bash
# 默认工作区
cowork/workspace/

# 自定义工作区（在 .env.local 中配置）
WORKSPACE_ROOT=/path/to/your/workspace
```

### API 使用示例

#### 1. 列出目录

```typescript
import { fileSystemService } from '@/lib/filesystem-service';

const files = await fileSystemService.listDirectory('.');
// 返回: [{ name, path, type, size, modified }, ...]
```

#### 2. 读取文件

```typescript
const result = await fileSystemService.readFile('example.txt');
console.log(result.content);
```

#### 3. 写入文件

```typescript
await fileSystemService.writeFile('output.txt', 'Hello World');
```

#### 4. 创建目录

```typescript
await fileSystemService.createDirectory('new-folder');
```

#### 5. 删除文件/目录

```typescript
await fileSystemService.delete('old-file.txt');
```

#### 6. 搜索文件

```typescript
const results = await fileSystemService.searchFiles('*.ts', '.');
```

---

## 🔒 沙箱服务

### 安全特性

#### 1. 危险命令黑名单

以下命令会被自动拦截：
- `rm -rf /` - 删除根目录
- `dd if=` - 磁盘操作
- `mkfs` / `format` - 格式化
- `:(){:|:&};:` - Fork bomb
- `chmod 777` - 权限修改
- `sudo` / `su` - 提权

#### 2. 敏感路径保护

以下路径禁止访问：
- `~/.ssh` - SSH 密钥
- `~/.aws` - AWS 凭证
- `/etc/passwd` - 系统密码
- `.env` - 环境变量

#### 3. 资源限制

- **超时**: 30 秒
- **输出限制**: 1MB
- **工作目录**: 限制在 workspace 内

### API 使用示例

#### 1. 执行命令

```typescript
import { sandboxService } from '@/lib/sandbox-service';

const result = await sandboxService.executeCommand('ls -la');
console.log(result.stdout);
```

#### 2. 验证命令安全性

```typescript
const validation = await sandboxService.validateCommand('rm -rf /');
if (!validation.safe) {
  console.error(validation.reason);
}
```

#### 3. 自定义配置

```typescript
sandboxService.updateConfig({
  network: {
    allowedDomains: ['github.com', 'npmjs.org'],
  },
  filesystem: {
    allowWrite: ['./workspace', '/tmp'],
  },
});
```

---

## 🔌 集成到 AI 响应

### 在 `hooks/useCowork.ts` 中使用

```typescript
import { fileSystemService } from '@/lib/filesystem-service';
import { sandboxService } from '@/lib/sandbox-service';

const getRealAIResponse = useCallback(async (userMessage: string) => {
  const lowerMsg = userMessage.toLowerCase();

  // 文件操作
  if (lowerMsg.includes('read file') || lowerMsg.includes('读取文件')) {
    try {
      const files = await fileSystemService.listDirectory('.');
      addMessage({
        role: 'assistant',
        content: `找到 ${files.length} 个文件:\n${files.map(f => f.name).join('\n')}`,
      });
      
      // 添加到工作文件列表
      addWorkingFiles(files.map(f => ({
        id: generateId(),
        filename: f.name,
        addedAt: new Date(),
      })));
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `读取文件失败: ${error.message}`,
      });
    }
    return;
  }

  // 命令执行
  if (lowerMsg.includes('run') || lowerMsg.includes('执行')) {
    const commandMatch = userMessage.match(/run\s+(.+)|执行\s+(.+)/i);
    if (commandMatch) {
      const command = commandMatch[1] || commandMatch[2];
      
      try {
        // 验证命令
        const validation = await sandboxService.validateCommand(command);
        if (!validation.safe) {
          addMessage({
            role: 'assistant',
            content: `命令不安全: ${validation.reason}`,
          });
          return;
        }

        // 执行命令
        const result = await sandboxService.executeCommand(command);
        
        addMessage({
          role: 'assistant',
          content: result.success 
            ? `命令执行成功:\n${result.stdout}`
            : `命令执行失败:\n${result.stderr}`,
          command: {
            command: command,
            description: '在沙箱中执行',
          },
        });
      } catch (error) {
        addMessage({
          role: 'assistant',
          content: `执行失败: ${error.message}`,
        });
      }
    }
    return;
  }

  // 正常的 AI 响应
  // ...
}, []);
```

---

## 🛠️ API 路由说明

### 文件系统 API

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/filesystem/list` | POST | 列出目录内容 |
| `/api/filesystem/read` | POST | 读取文件 |
| `/api/filesystem/write` | POST | 写入文件 |
| `/api/filesystem/mkdir` | POST | 创建目录 |
| `/api/filesystem/delete` | POST | 删除文件/目录 |
| `/api/filesystem/search` | POST | 搜索文件 |

### 沙箱 API

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/sandbox/execute` | POST | 执行命令 |
| `/api/sandbox/validate` | POST | 验证命令 |

---

## 📊 数据流程

### 文件操作流程

```
用户请求 "读取文件"
    ↓
hooks/useCowork.ts
    ↓
lib/filesystem-service.ts
    ↓
fetch('/api/filesystem/read')
    ↓
app/api/filesystem/read/route.ts
    ↓
Node.js fs 模块
    ↓
返回文件内容
```

### 命令执行流程

```
用户请求 "执行命令"
    ↓
hooks/useCowork.ts
    ↓
lib/sandbox-service.ts
    ↓
fetch('/api/sandbox/validate') → 验证安全性
    ↓
fetch('/api/sandbox/execute') → 执行命令
    ↓
app/api/sandbox/execute/route.ts
    ↓
child_process.exec (带限制)
    ↓
返回执行结果
```

---

## 🔐 安全最佳实践

### 1. 工作区隔离

```bash
# 在 .env.local 中设置独立的工作区
WORKSPACE_ROOT=/path/to/isolated/workspace
```

### 2. 命令白名单（推荐）

```typescript
// 只允许特定命令
const ALLOWED_COMMANDS = ['ls', 'cat', 'echo', 'pwd'];

function isCommandAllowed(command: string): boolean {
  const cmd = command.split(' ')[0];
  return ALLOWED_COMMANDS.includes(cmd);
}
```

### 3. 用户权限控制

```typescript
// 在 API 路由中添加认证
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  // ...
}
```

### 4. 审计日志

```typescript
// 记录所有文件和命令操作
console.log('📝 操作日志:', {
  user: session.user.id,
  action: 'file_read',
  path: requestedPath,
  timestamp: new Date(),
});
```

---

## 🧪 测试示例

### 测试文件操作

```typescript
// 创建测试文件
await fileSystemService.writeFile('test.txt', 'Hello World');

// 读取文件
const result = await fileSystemService.readFile('test.txt');
console.assert(result.content === 'Hello World');

// 删除文件
await fileSystemService.delete('test.txt');
```

### 测试沙箱

```typescript
// 安全命令
const result1 = await sandboxService.executeCommand('echo "Hello"');
console.assert(result1.success === true);

// 危险命令（应该被拦截）
try {
  await sandboxService.executeCommand('rm -rf /');
} catch (error) {
  console.log('危险命令已拦截 ✅');
}
```

---

## 🚀 高级功能

### 1. 集成 Anthropic Sandbox Runtime

如果需要更强大的沙箱功能，可以集成官方的 sandbox-runtime：

```bash
npm install @anthropic-ai/sandbox-runtime
```

```typescript
import { SandboxManager } from '@anthropic-ai/sandbox-runtime';

const config = {
  network: {
    allowedDomains: ['github.com'],
  },
  filesystem: {
    denyRead: ['~/.ssh'],
    allowWrite: ['./workspace'],
  },
};

await SandboxManager.initialize(config);
const sandboxedCommand = await SandboxManager.wrapWithSandbox('npm install');
```

### 2. Docker 容器隔离

```bash
# 在 Docker 容器中运行命令
docker run --rm -v $(pwd)/workspace:/workspace node:18 node script.js
```

### 3. 文件版本控制

```typescript
// 自动备份文件
async function writeFileWithBackup(path: string, content: string) {
  const backupPath = `${path}.backup`;
  const existing = await fileSystemService.readFile(path);
  await fileSystemService.writeFile(backupPath, existing.content);
  await fileSystemService.writeFile(path, content);
}
```

---

## 📚 相关文档

- [Anthropic Sandbox Runtime](https://github.com/anthropic-experimental/sandbox-runtime)
- [Node.js fs 模块](https://nodejs.org/api/fs.html)
- [Node.js child_process](https://nodejs.org/api/child_process.html)

---

## ✅ 功能检查清单

- [ ] 已创建 workspace 目录
- [ ] 文件系统 API 正常工作
- [ ] 沙箱命令执行正常
- [ ] 危险命令被正确拦截
- [ ] 敏感路径被保护
- [ ] 已集成到 AI 响应中
- [ ] 已添加错误处理
- [ ] 已添加日志记录

---

**安全提示**: 即使有沙箱保护，也不要在生产环境中执行不可信的代码！
