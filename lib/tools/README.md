# 🛠️ 工具系统 (Tools System)

AI 工具调用系统的模块化实现，支持文件系统操作、网络访问等功能。

## 📁 目录结构

```
lib/tools/
├── README.md              # 本文档
├── types.ts               # 类型定义
├── parser.ts              # 工具调用解析器
├── registry.ts            # 工具注册中心
├── index.ts               # 主入口文件
├── filesystem/            # 文件系统工具
│   ├── write-file.ts
│   ├── read-file.ts
│   ├── list-directory.ts
│   ├── create-directory.ts
│   ├── delete-file.ts
│   ├── search-files.ts
│   └── index.ts
└── web/                   # 网络访问工具
    ├── fetch-url.ts
    └── index.ts
```

## 🎯 核心概念

### 工具定义 (ToolDefinition)

每个工具都是一个独立的模块，包含：
- **name**: 工具名称
- **description**: 工具描述
- **parameters**: 参数定义
- **examples**: 使用示例
- **execute**: 执行函数

### 工具调用 (ToolCall)

AI 通过特定格式调用工具：
```
​```tool:tool_name
{
  "param1": "value1",
  "param2": "value2"
}
​```
```

### 工具结果 (ToolResult)

工具执行后返回统一格式：
```typescript
{
  success: boolean,
  result?: any,
  error?: string
}
```

## 📝 添加新工具

### 1. 创建工具文件

在对应类别目录下创建新文件，例如 `lib/tools/filesystem/copy-file.ts`:

```typescript
import { fileSystemService } from '@/lib/filesystem-service';
import { ToolDefinition } from '../types';

export const copyFileTool: ToolDefinition = {
  name: 'copy_file',
  description: 'Copy a file to a new location',
  parameters: [
    {
      name: 'source',
      type: 'string',
      description: 'Source file path',
      required: true,
    },
    {
      name: 'destination',
      type: 'string',
      description: 'Destination file path',
      required: true,
    },
  ],
  examples: [
    {
      description: 'Copy a file',
      code: `\`\`\`tool:copy_file
{
  "source": "file.txt",
  "destination": "backup/file.txt"
}
\`\`\``,
    },
  ],
  execute: async (parameters) => {
    // 实现复制逻辑
    const result = await fileSystemService.copy(
      parameters.source,
      parameters.destination
    );
    return { success: true, result };
  },
};
```

### 2. 导出工具

在类别的 `index.ts` 中导出：

```typescript
// lib/tools/filesystem/index.ts
export { copyFileTool } from './copy-file';
```

### 3. 自动注册

工具会自动注册到注册中心，无需额外配置。

## 🔧 使用方式

### 在代码中使用

```typescript
import { executeToolCall, parseToolCalls } from '@/lib/tools';

// 解析 AI 响应中的工具调用
const toolCalls = parseToolCalls(aiResponse);

// 执行工具调用
const results = await executeToolCalls(toolCalls);
```

### AI 调用示例

**用户**: 请创建一个 hello.txt 文件

**AI 回复**:
```
我来帮你创建文件。

​```tool:write_file
{
  "path": "hello.txt",
  "content": "Hello World"
}
​```

文件已创建！
```

**系统**: 自动解析并执行工具，显示结果

## 📚 可用工具

### 文件系统工具

- `write_file` - 写入文件
- `read_file` - 读取文件
- `list_directory` - 列出目录
- `create_directory` - 创建目录
- `delete_file` - 删除文件
- `search_files` - 搜索文件

### 网络访问工具

- `fetch_url` - 获取网页内容

## 🎨 工具注册中心

`registry.ts` 提供了工具管理功能：

```typescript
import { getAllTools, getTool, executeToolCall } from '@/lib/tools';

// 获取所有工具
const tools = getAllTools();

// 获取特定工具
const tool = getTool('write_file');

// 执行工具
const result = await executeToolCall({
  tool: 'write_file',
  parameters: { path: 'test.txt', content: 'Hello' }
});
```

## 📖 生成文档

自动生成工具文档供 AI 使用：

```typescript
import { generateToolsDocumentation } from '@/lib/tools';

const docs = generateToolsDocumentation();
// 返回 Markdown 格式的完整工具文档
```

## 🔍 工具解析器

`parser.ts` 负责从 AI 响应中提取工具调用：

```typescript
import { parseToolCalls } from '@/lib/tools';

const content = `
我来创建文件。

​```tool:write_file
{
  "path": "test.txt",
  "content": "Hello"
}
​```

完成！
`;

const toolCalls = parseToolCalls(content);
// [{ tool: 'write_file', parameters: { path: 'test.txt', content: 'Hello' } }]
```

## 🚀 最佳实践

### 1. 工具命名

- 使用小写字母和下划线
- 名称要清晰描述功能
- 例如：`write_file`, `fetch_url`

### 2. 参数设计

- 必需参数标记 `required: true`
- 提供清晰的参数描述
- 使用合适的类型

### 3. 错误处理

- 在 `execute` 函数中捕获异常
- 返回有意义的错误信息
- 使用 `try-catch` 包裹异步操作

### 4. 示例编写

- 提供实际可用的示例
- 覆盖常见使用场景
- 包含参数说明

## 🔐 安全考虑

- 所有文件操作限制在 workspace 目录
- 网络请求仅支持 HTTP/HTTPS
- 参数验证在服务层进行
- 错误信息不暴露敏感信息

## 📊 工具执行流程

```
AI 生成响应
    ↓
parseToolCalls() 解析工具调用
    ↓
executeToolCalls() 批量执行
    ↓
getTool() 获取工具定义
    ↓
tool.execute() 执行工具
    ↓
返回 ToolResult
    ↓
显示在聊天界面
```

## 🎯 扩展建议

可以添加的新工具类别：

- **数据处理**: JSON/CSV 解析、数据转换
- **代码工具**: 代码格式化、语法检查
- **图像处理**: 图片压缩、格式转换
- **数据库**: 查询、更新操作
- **系统工具**: 进程管理、环境变量

## 📝 更新日志

- **v1.0.0** (2026-01-16)
  - ✨ 初始版本
  - 模块化工具系统
  - 文件系统工具集
  - 网络访问工具
  - 自动注册机制
  - 文档生成功能
