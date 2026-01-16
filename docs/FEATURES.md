# Cowork 功能特性文档

本文档总结了 Cowork 项目的核心功能和最新特性。

## 📋 目录

- [任务规划系统](#任务规划系统)
- [工具调用系统](#工具调用系统)
- [进度可视化](#进度可视化)
- [快速任务模板](#快速任务模板)
- [文件系统集成](#文件系统集成)
- [网络请求功能](#网络请求功能)
- [Artifacts 管理](#artifacts-管理)

---

## 任务规划系统

### 功能描述
AI 在执行复杂任务前，会先创建结构化的任务计划，然后逐步执行每个步骤。

### 实现位置
- `lib/task-planner.ts` - 任务规划核心逻辑
- `components/TaskPlanDisplay.tsx` - 任务计划展示组件
- `hooks/useCowork.ts` - 任务执行引擎

### 使用示例

**用户输入**：
```
查询英伟达最近一周的股价并生成分析报告
```

**AI 响应**：
```
我来帮你完成这个任务，让我先规划一下步骤：

​```plan
1. 查询英伟达股票数据 [fetch_url]
2. 分析股票走势和关键指标
3. 生成分析报告文件 [write_file]
​```

现在开始执行...
```

### 任务计划格式

```
​```plan
1. 步骤描述 [tool_name]  // 需要工具的步骤
2. 另一个步骤描述        // 不需要工具的步骤（如分析、思考）
3. 最终步骤 [tool_name]
​```
```

### 执行流程

1. **解析计划** - 从 AI 响应中提取任务步骤
2. **显示计划** - 在聊天界面和右侧 Progress 面板显示
3. **逐步执行** - 按顺序执行每个步骤
4. **状态更新** - 实时更新步骤状态（pending → in_progress → completed）
5. **结果收集** - 自动收集生成的文件到 Artifacts

---

## 工具调用系统

### 架构设计

采用模块化设计，每个工具独立维护：

```
lib/tools/
├── types.ts              # 工具类型定义
├── registry.ts           # 工具注册中心
├── parser.ts             # 工具调用解析器
├── result-formatter.ts   # 结果格式化器
├── filesystem/           # 文件系统工具
│   ├── read-file.ts
│   ├── write-file.ts
│   ├── list-directory.ts
│   └── ...
└── web/                  # 网络请求工具
    └── fetch-url.ts
```

### 工具定义结构

```typescript
export const toolName: ToolDefinition = {
  name: 'tool_name',
  description: '工具描述',
  parameters: [...],
  examples: [...],
  execute: async (parameters) => { ... },
  formatResult: (result) => { ... },
  generateSummary: (parameters) => { ... },
};
```

### JSON 解析器

**多策略解析**：
- 策略 0: 直接解析（适用于完美 JSON）
- 策略 1: 修复后解析（处理注释、换行符、尾随逗号）
- 策略 2: 深度修复（额外处理边界情况）

**自动修复能力**：
- ✅ 未转义的换行符 `\n`
- ✅ 未转义的制表符 `\t`
- ✅ 尾随逗号 `,}`
- ✅ 单行和多行注释
- ✅ 连续反斜杠 `\\`

### 可用工具列表

#### 文件系统工具
- `read_file` - 读取文件内容
- `write_file` - 写入文件
- `list_directory` - 列出目录内容
- `create_directory` - 创建目录
- `delete_file` - 删除文件
- `search_files` - 搜索文件

#### 网络请求工具
- `fetch_url` - 发起 HTTP 请求（支持 GET、POST 等）

---

## 进度可视化

### Progress 面板

**位置**：右侧边栏顶部

**显示格式**：垂直列表

```
Progress
━━━━━━━━━━━━━━━━━━━━
✓  查询英伟达股票数据
🔄 分析股票走势和关键指标  ← 当前执行
⏳ 生成分析报告文件
```

**状态类型**：
- ✓ **已完成** - 蓝色勾选 + 灰色删除线
- 🔄 **进行中** - 蓝色圆圈 + 脉动动画 + 高亮文字
- ⏳ **待执行** - 灰色空心圆圈

### 实现位置
- `components/RightSidebar.tsx` - Progress 面板组件
- `hooks/useCowork.ts` - 进度状态管理

---

## 快速任务模板

### 功能描述
预制的任务模板，包含最佳实践和工具使用建议，帮助用户快速开始。

### 实现位置
- `lib/quick-tasks.ts` - 任务模板定义
- `components/QuickTaskCards.tsx` - 任务卡片组件

### 模板类别

#### 📈 数据分析类
- **股票数据分析** - 查询股票数据并生成分析报告
- **网页数据抓取** - 从网页获取数据并整理

#### 📁 文件操作类
- **整理项目文件** - 按类型分类整理文件
- **生成项目文档** - 创建 README 和文档结构

#### 🔍 代码分析类
- **代码审查报告** - 分析代码质量并提供建议
- **依赖分析** - 检查项目依赖和版本

#### 🤖 自动化类
- **生成日报** - 创建每日工作报告
- **备份重要文件** - 创建文件备份

### 使用方式

1. 打开新任务
2. 看到快速任务卡片
3. 点击任意卡片
4. prompt 自动填充到输入框
5. 发送执行

---

## 文件系统集成

### Workspace 目录树

**功能**：在右侧边栏显示完整的 workspace 目录结构

**特性**：
- 📁 树形结构展示
- 🔽 可折叠/展开目录
- 📊 显示文件总数
- ♾️ 无数量限制

**实现位置**：
- `components/FileTree.tsx` - 目录树组件
- `hooks/useWorkspaceFiles.ts` - 文件列表加载

### 工作区切换

**功能**：动态切换工作区路径

**实现位置**：
- `components/WorkspaceSelector.tsx` - 工作区选择器
- `lib/workspace-context.ts` - 全局工作区上下文

---

## 网络请求功能

### 功能描述
支持 AI 发起 HTTP 请求获取外部数据，如 API 调用、网页抓取等。

### 实现位置
- `lib/tools/web/fetch-url.ts` - 网络请求工具
- `app/api/web/fetch/route.ts` - 后端代理 API
- `lib/web-service.ts` - 网络服务封装

### 支持的请求方法
- GET
- POST
- PUT
- DELETE
- PATCH

### 使用示例

```typescript
// AI 调用
​```tool:fetch_url
{
  "url": "https://query1.finance.yahoo.com/v8/finance/chart/NVDA",
  "method": "GET"
}
​```
```

### 响应处理

1. **原始数据展示** - 显示完整的 JSON 响应
2. **AI 自动分析** - AI 分析数据并生成易读的总结
3. **结构化输出** - 包含状态码、耗时、内容类型等元信息

---

## Artifacts 管理

### 功能描述
自动收集 AI 生成的文件，显示在右侧 Artifacts 面板。

### 触发条件
当 `write_file` 工具执行成功后，自动添加文件到 Artifacts。

### 显示信息
- 📄 文件名
- 📅 创建时间
- 🔗 可点击查看

### 实现位置
- `hooks/useCowork.ts` - 自动添加逻辑（第 426-432 行，491-497 行）
- `components/RightSidebar.tsx` - Artifacts 面板展示

---

## 系统提示词优化

### AI 行为指导

**位置**：`hooks/useCowork.ts`

**关键指导**：

1. **任务规划** - 复杂任务先规划再执行
2. **工具调用** - 使用标准格式调用工具
3. **JSON 规范** - 生成有效的 JSON（转义换行符等）
4. **数据分析** - 主动分析和总结网络响应数据

### JSON 生成规则

```
**IMPORTANT JSON RULES:**
- All JSON must be valid and properly escaped
- For multi-line content, use \n for newlines
- Escape special characters: \" for quotes, \\ for backslashes
- Do NOT use unescaped newlines in JSON strings
```

---

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI 组件**: React + TailwindCSS
- **状态管理**: React Hooks
- **AI 服务**: DeepSeek API
- **文件系统**: Node.js fs/promises
- **网络请求**: Fetch API

---

## 开发指南

### 添加新工具

1. 在 `lib/tools/` 下创建工具文件
2. 实现 `ToolDefinition` 接口
3. 在 `lib/tools/registry.ts` 中注册
4. 更新 `lib/ai-tools.ts` 的工具文档

### 添加新任务模板

1. 在 `lib/quick-tasks.ts` 中添加模板定义
2. 指定类别、图标、描述
3. 编写详细的 prompt（包含步骤拆分）

### 调试技巧

- 查看浏览器控制台的工具调用日志
- 使用 `console.log` 输出中间数据
- 检查 Network 面板的 API 请求

---

## 更新日志

### 2025-01-16
- ✅ 实现任务规划系统
- ✅ 重构 JSON 解析器（多策略容错）
- ✅ 添加快速任务模板
- ✅ Progress 改为垂直列表显示
- ✅ Artifacts 自动收集
- ✅ Working Files 改为目录树展示
- ✅ 修复文件路径显示问题

---

## 相关文档

- [AI 集成指南](./AI_INTEGRATION_GUIDE.md)
- [工具开发指南](./AI_TOOLS_GUIDE.md)
- [文件系统快速开始](./FILESYSTEM_QUICKSTART.md)
- [网络访问指南](./WEB_ACCESS_GUIDE.md)
- [任务模板指南](./TASK_TEMPLATES.md)
