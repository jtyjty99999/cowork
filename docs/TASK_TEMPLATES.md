# 📋 任务模板系统

## 概述

任务模板系统允许你预设示例任务，用于演示、测试或快速启动项目。

## 配置方式

### 1. 环境变量控制

在 `.env.local` 文件中设置：

```bash
# 是否加载示例任务
NEXT_PUBLIC_LOAD_DEMO_TASK=false  # false=空白启动, true=加载演示任务
```

### 2. 默认行为

- **`NEXT_PUBLIC_LOAD_DEMO_TASK=false`** (默认)
  - 应用启动时创建一个空白任务
  - 适合日常使用和开发

- **`NEXT_PUBLIC_LOAD_DEMO_TASK=true`**
  - 应用启动时加载预设的演示任务
  - 适合演示和测试功能

## 可用模板

当前系统包含以下预设模板（位于 `@/lib/task-templates.ts:1-158`）：

### 1. **Blog Drafts Review** (默认)
- **ID**: `blog-drafts-review`
- **标题**: Review unpublished drafts for publication
- **功能**: 演示文件搜索和命令执行
- **消息**: 包含用户请求和 AI 响应的完整对话流程

### 2. **Web API Demo**
- **ID**: `web-api-demo`
- **标题**: Fetch GitHub repository information
- **功能**: 演示互联网访问功能
- **用途**: 展示如何获取外部 API 数据

### 3. **Markdown Demo**
- **ID**: `markdown-demo`
- **标题**: Markdown formatting examples
- **功能**: 演示 Markdown 渲染能力
- **内容**: 包含标题、代码块、列表、表格等各种格式

### 4. **File Operations**
- **ID**: `file-operations`
- **标题**: Workspace file operations
- **功能**: 演示文件系统操作
- **用途**: 展示工作区文件管理功能

## 自定义模板

### 创建新模板

编辑 `lib/task-templates.ts` 文件，添加新的模板对象：

```typescript
{
  id: 'your-template-id',
  title: '任务标题',
  description: '任务描述',
  messages: [
    {
      role: 'user',
      content: '用户消息内容',
    },
    {
      role: 'assistant',
      content: 'AI 回复内容',
    },
  ],
  workingFiles: ['file1.txt', 'file2.md'],  // 可选
  artifacts: ['output.html'],                // 可选
}
```

### 模板结构

```typescript
interface TaskTemplate {
  id: string;                                    // 唯一标识符
  title: string;                                 // 任务标题
  description: string;                           // 任务描述
  messages: Omit<Message, 'id' | 'timestamp'>[]; // 消息列表
  workingFiles?: string[];                       // 工作文件列表（可选）
  artifacts?: string[];                          // 生成的文件（可选）
}
```

### 消息类型

```typescript
// 用户消息
{
  role: 'user',
  content: '消息内容',
}

// AI 回复
{
  role: 'assistant',
  content: '回复内容',
}

// 带命令的消息
{
  role: 'assistant',
  content: '',
  command: {
    command: 'find',
    args: '命令参数',
    description: '命令描述',
  },
}
```

## 使用场景

### 场景 1: 开发和调试
```bash
# 空白启动，方便测试新功能
NEXT_PUBLIC_LOAD_DEMO_TASK=false
```

### 场景 2: 演示和展示
```bash
# 加载演示任务，展示系统能力
NEXT_PUBLIC_LOAD_DEMO_TASK=true
```

### 场景 3: 功能测试
```bash
# 使用特定模板测试某个功能
# 修改 lib/task-templates.ts 中的 getDefaultTemplate() 函数
# 返回你想测试的模板
```

## 编程接口

### 获取模板

```typescript
import { 
  getTemplateById, 
  getAllTemplates, 
  getDefaultTemplate 
} from '@/lib/task-templates';

// 获取特定模板
const template = getTemplateById('markdown-demo');

// 获取所有模板
const allTemplates = getAllTemplates();

// 获取默认模板
const defaultTemplate = getDefaultTemplate();
```

### 加载模板到任务

```typescript
const { createNewTask, updateTaskTitle, addMessage } = useCowork();

// 创建任务
const taskId = createNewTask();

// 设置标题
updateTaskTitle(taskId, template.title);

// 添加消息
template.messages.forEach((msg, index) => {
  setTimeout(() => {
    addMessage(msg, taskId);
  }, index * 600); // 延迟加载，模拟对话流程
});
```

## 最佳实践

### 1. 保持模板简洁
- 每个模板专注于演示一个核心功能
- 避免过长的对话历史
- 消息数量控制在 3-5 条为宜

### 2. 提供清晰的描述
- 使用描述性的标题
- 添加详细的 description 字段
- 在消息中包含上下文信息

### 3. 测试模板
- 确保模板消息格式正确
- 验证 Markdown 渲染效果
- 测试命令执行（如果包含）

### 4. 版本控制
- 将模板文件纳入版本控制
- 记录模板的变更历史
- 为重要模板添加注释

## 故障排查

### 问题：模板没有加载

**检查项**：
1. 确认 `NEXT_PUBLIC_LOAD_DEMO_TASK=true`
2. 检查 `.env.local` 文件是否存在
3. 重启开发服务器

### 问题：消息显示不正确

**检查项**：
1. 验证消息格式是否符合 `Message` 类型
2. 检查 Markdown 语法是否正确
3. 查看浏览器控制台的错误信息

### 问题：想切换默认模板

**解决方案**：
修改 `lib/task-templates.ts` 中的 `getDefaultTemplate()` 函数：

```typescript
export function getDefaultTemplate(): TaskTemplate | undefined {
  // 返回你想要的模板
  return taskTemplates.find(t => t.id === 'markdown-demo');
}
```

## 相关文件

- `@/lib/task-templates.ts:1-158` - 模板定义
- `@/app/page.tsx:1-102` - 模板加载逻辑
- `@/.env.local.example:26-27` - 环境变量配置
- `@/types/index.ts:8-14` - Message 类型定义

## 更新日志

- **v1.0.0** (2026-01-16)
  - ✨ 初始版本
  - 支持多个预设模板
  - 环境变量控制加载行为
  - 默认空白启动
