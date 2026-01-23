# 更新日志

## [1.0.3] - 2026-01-23

### 🎉 新功能

#### 桌面应用支持（Electron）

**功能描述**：
- 将 Web 应用打包为原生桌面应用，支持 macOS、Windows、Linux
- 提供完整的桌面应用体验，包括原生窗口控制、应用菜单、键盘快捷键
- 独立的工作区管理，数据存储在系统用户目录

**核心特性**：
- ✅ **Electron 集成**：使用 Electron 框架构建跨平台桌面应用
- ✅ **开发模式**：支持热重载，自动检测 Next.js 开发服务器端口
- ✅ **生产构建**：支持打包为 DMG（macOS）、NSIS/Portable（Windows）、AppImage/DEB（Linux）
- ✅ **原生菜单**：完整的应用菜单和键盘快捷键（Cmd/Ctrl+N 新建聊天，Cmd/Ctrl+Q 退出）
- ✅ **窗口管理**：标准窗口控制，支持拖拽、最小化、最大化
- ✅ **安全通信**：使用 preload 脚本实现主进程和渲染进程的安全 IPC 通信

**新增文件**：
- `electron/main.js` - Electron 主进程，管理窗口生命周期
- `electron/preload.js` - 安全的 IPC 桥接脚本
- `electron/setup.html` - 启动配置窗口
- `ELECTRON.md` - 桌面应用使用文档

**配置更改**：
- `package.json` - 添加 Electron 脚本和构建配置
- `next.config.js` - 配置静态导出以支持 Electron
- `.gitignore` - 添加 Electron 构建产物目录

**使用方法**：
```bash
# 开发模式
npm run electron:dev

# 构建桌面应用
npm run electron:build        # 当前平台
npm run electron:build:mac    # macOS
npm run electron:build:win    # Windows
npm run electron:build:linux  # Linux
```

**Commits**：
- `1a898f8` - feat: add desktop application support with Electron

#### 启动配置窗口

**功能描述**：
- 首次启动时显示精美的配置窗口
- 用户可以选择工作区路径和配置 DeepSeek API Key
- 配置持久化保存，后续启动自动加载

**界面特性**：
- 🎨 **现代化设计**：渐变背景、卡片式布局、流畅动画
- 📁 **工作区选择**：原生文件选择器，支持创建新文件夹
- 🔑 **API Key 配置**：密码输入框，支持显示/隐藏切换
- 💾 **配置持久化**：保存到 `userData/config.json`
- ⚙️ **自动配置**：API Key 自动写入 `.env.local` 文件
- ⏭️ **跳过选项**：可选择稍后配置

**工作流程**：
1. 首次启动显示配置窗口
2. 用户选择工作区文件夹
3. 用户输入 DeepSeek API Key
4. 配置保存到用户数据目录
5. 关闭配置窗口，打开主窗口
6. 后续启动直接使用已保存配置

**配置文件位置**：
- **macOS**: `~/Library/Application Support/Cowork/config.json`
- **Windows**: `%APPDATA%\Cowork\config.json`
- **Linux**: `~/.config/Cowork/config.json`

**Commits**：
- `20b5dc9` - feat: add startup configuration window for workspace and API key setup

#### 文件移动工具（move_file）

**功能描述**：
- 新增 `move_file` 工具，支持文件移动和重命名
- 完善文件整理功能，可以将文件移动到分类文件夹
- 自动创建目标目录

**工具特性**：
- ✅ 移动文件到不同目录
- ✅ 重命名文件
- ✅ 自动创建目标目录
- ✅ 路径安全验证（限制在工作区内）
- ✅ 错误处理和友好的错误消息

**使用示例**：
```tool:move_file
{
  "source": "report.md",
  "destination": "documents/report.md"
}
```

**新增文件**：
- `lib/tools/filesystem/move-file.ts` - 移动文件工具实现
- `app/api/filesystem/move/route.ts` - 文件移动 API 端点

**Commits**：
- `fa8e5ca` - feat: add move_file tool for file organization tasks

### 🐛 Bug 修复

#### 修复文件系统工具数据访问错误

**问题描述**：
- 所有文件系统工具出现 `TypeError: Cannot read properties of undefined (reading 'path')`
- `list_directory` 显示"目录为空"，即使目录中有文件
- `create_directory`、`read_file`、`delete_file` 等工具崩溃

**根本原因**：
- API 返回数据结构：`{ success: true, path: "...", ... }`
- `execute` 包装后：`{ success: true, result: { success: true, path: "..." } }`
- 保存到消息时转换：`{ success: true, data: { success: true, path: "..." } }`
- `formatResult` 访问 `result.result` → `undefined`

**修复方案**：
- ✅ 修改所有工具的 `formatResult` 使用 `result.data || result.result`
- ✅ 添加 try-catch 错误处理到所有 `execute` 函数
- ✅ 提供安全的默认值防止 undefined 访问
- ✅ 添加数组类型检查（list_directory）

**影响的工具**：
- `list_directory` - 现在能正确显示文件列表
- `create_directory` - 安全访问路径数据
- `read_file` - 安全访问内容和路径
- `delete_file` - 安全访问路径数据

**Commits**：
- `8a96591` - fix: correct data access in all filesystem tools formatResult

#### 修复 AI 跳过工具调用问题

**问题描述**：
- AI 在某些步骤不生成工具调用
- 步骤显示"完成"但实际未执行
- 例如：任务需要 `list_directory`，但 AI 只描述要做什么，不实际调用工具

**修复方案**：
- ✅ **检测未生成工具调用**：当步骤需要工具但 AI 未生成时，标记为失败
- ✅ **显示清晰错误**：`AI 未能生成所需的 [tool] 工具调用`
- ✅ **停止任务执行**：防止后续步骤基于错误状态继续
- ✅ **显示 AI 响应**：帮助调试为什么工具调用未生成

**强化提示词**：
- ✅ **系统级提示**：添加 CRITICAL 标记强调工具调用是硬性要求
- ✅ **步骤级提示**：提供具体格式示例和强制性语言
- ✅ **双层强制机制**：系统提示 + 步骤提示确保 AI 生成工具调用

**Commits**：
- `84f0c42` - fix: handle case when AI fails to generate required tool calls
- `c2b9fe3` - fix: strengthen prompt to force AI to generate tool calls
- `65320fa` - fix: add system-level critical instruction about tool call requirements

#### 修复 JSON 解析失败问题

**问题描述**：
- AI 生成的 `write_file` 工具调用 JSON 解析失败
- 错误：`Unterminated string in JSON at position 1277`
- 原因：`content` 字段包含未转义的换行符

**修复方案**：
- ✅ 添加 `fixContentField()` 函数智能修复 content 字段
- ✅ 检测并转义特殊字符：`\n` `\r` `\t` `\"` `\\`
- ✅ 添加为解析策略 4 和 5（单独使用和组合使用）
- ✅ 处理跨越多行的字符串

**解析策略**：
1. 直接解析（标准 JSON）
2. 基础修复（注释、尾随逗号）
3. 额外清理（更激进的逗号移除）
4. **修复 content 字段**（新增 - 处理未转义换行符）
5. **组合修复**（新增 - content 字段 + 基础修复）

**Commits**：
- `ba08c0b` - fix: improve JSON parser to handle unescaped newlines in content field

#### 修复 Electron 404 错误

**问题描述**：
- Electron 窗口显示 "This page could not be found"
- 硬编码加载 `localhost:3000`，但 Next.js 运行在 `localhost:3003`

**修复方案**：
- ✅ 添加 `ELECTRON_START_URL` 环境变量支持
- ✅ 更新启动脚本检测多个端口（3000-3003）
- ✅ 自动使用 Next.js 实际运行的端口
- ✅ 添加日志显示加载的 URL

**Commits**：
- `7dcbdec` - fix: resolve Electron 404 error by detecting correct dev server port

#### 修复窗口拖拽问题

**问题描述**：
- 窗口使用 `hiddenInset` 标题栏样式
- 没有可拖拽区域，无法移动窗口

**修复方案**：
- ✅ 移除 `titleBarStyle: 'hiddenInset'`
- ✅ 使用默认标题栏提供原生体验
- ✅ 显式设置 `frame: true` 确保标准窗口框架

**Commits**：
- `d5cc8c8` - fix: enable window dragging by using default titlebar

### 📝 文档更新

- ✅ 新增 `ELECTRON.md` - 桌面应用完整使用文档
- ✅ 更新 `README.md` - 添加桌面应用使用说明
- ✅ 更新 `.gitignore` - 添加 Electron 构建产物

### 🎯 可用的文件系统工具

现在支持完整的文件操作：
- ✅ `list_directory` - 列出目录内容
- ✅ `read_file` - 读取文件
- ✅ `write_file` - 写入文件
- ✅ `create_directory` - 创建目录
- ✅ `delete_file` - 删除文件
- ✅ `move_file` - 移动/重命名文件 **← 新增**
- ✅ `search_files` - 搜索文件

---

## [1.0.2] - 2026-01-19

### 🎉 新功能

#### 改进任务计划为真正的逐步执行

**问题描述**：
- AI 在规划任务后会立即生成所有内容（包括最终结果）
- 虽然显示逐步执行，但实际上是"假装"逐步执行
- 例如：规划"搜索→分析→创建游戏"，但 AI 在第一步就生成了完整游戏代码
- 后续步骤无法基于前一步的实际结果来执行

**改进方案**：
- ✅ 更新规划提示词，明确要求 AI **只规划不执行**
- ✅ 添加清晰示例说明 AI 应在规划后停止
- ✅ 改进步骤执行提示，包含之前步骤的结果上下文
- ✅ 强调每次只执行当前步骤，不执行后续步骤
- ✅ 将前一步的执行结果传递给下一步，实现真正的上下文依赖

**执行流程**：
1. **第一次调用**：AI 只创建任务计划，不生成任何具体内容
2. **后续调用**：每次只执行一个步骤，基于前面步骤的实际结果
3. **步骤间传递**：每个步骤可以使用前面步骤的结果

**示例（创建贪吃蛇游戏）**：
- 步骤 1：搜索游戏功能规范 [fetch_url] → 获取实际的功能列表
- 步骤 2：分析功能需求 → 基于步骤 1 的搜索结果进行分析
- 步骤 3：创建游戏文件 [write_file] → 基于步骤 2 的分析结果创建代码

**影响的文件**：
- `lib/task-planner.ts` - 更新规划提示词
- `hooks/useCowork.ts` - 改进步骤执行逻辑，传递上下文

**Commits**：
- `6d8f3da` - feat: improve task planning to enforce step-by-step execution

#### 添加任务执行错误处理机制

**问题描述**：
- 当任务执行过程中某个步骤出错时，系统继续执行后续步骤
- 用户看到错误提示（如"⚠️ 响应数据格式异常"）但任务仍在继续
- 没有明确的失败状态显示
- 缺少重试、跳过或终止的选项

**改进方案**：
- ✅ 添加 `failed` 状态到 `ProgressStep` 类型定义
- ✅ 步骤失败时立即停止执行后续步骤
- ✅ 显示清晰的错误消息给用户
- ✅ 更新进度条显示失败状态（红色 X 图标）
- ✅ 更新聊天框任务计划显示失败状态
- ✅ 记录错误详情到控制台便于调试

**错误处理流程**：
1. 工具执行失败时，标记步骤为 `failed`
2. 向用户显示包含错误详情的消息
3. 更新进度条和任务计划显示失败状态
4. 停止执行后续步骤
5. 重置 AI 响应状态

**UI 改进**：
- **右侧进度条**：失败步骤显示红色圆圈和 X 图标
- **任务计划**：失败步骤显示红色文字和 X 图标
- **聊天消息**：清晰的错误消息说明失败原因

**影响的文件**：
- `types/index.ts` - 添加 failed 状态类型
- `hooks/useCowork.ts` - 实现错误处理逻辑
- `components/RightSidebar.tsx` - 显示失败状态

**Commits**：
- `008d83d` - feat: add error handling to stop task execution on step failure

### 🐛 Bug 修复

#### 修复 fetch_url 工具数据验证问题

**问题描述**：
- `fetch_url` 工具在响应数据格式异常时仍然返回 `success: true`
- 只有 `formatResult` 显示警告 "⚠️ 响应数据格式异常"，但执行状态仍为成功
- 导致任务继续执行，即使数据获取实际失败
- 用户看到警告但任务显示为成功，造成混淆

**根本原因**：
- `execute` 函数只检查 HTTP 请求是否成功（网络层面）
- 没有验证响应数据的有效性
- 即使数据为空或格式无效，仍返回成功状态

**修复方案**：
- ✅ 在 `execute()` 函数中添加数据验证逻辑
- ✅ 解包嵌套的响应结构后检查数据有效性
- ✅ 数据为空或无效时返回 `success: false`
- ✅ 提供清晰的错误消息："响应数据格式异常：数据为空或格式无效"

**修复效果**：
现在当 `fetch_url` 获取到无效数据时：
1. 工具执行返回 `success: false`
2. 显示清晰的错误消息
3. 触发错误处理流程，停止任务执行
4. 用户在进度条和任务计划中看到明确的失败状态

**影响的文件**：
- `lib/tools/web/fetch-url.ts` - 添加数据验证逻辑

**Commits**：
- `9c68a4d` - fix: fetch_url tool should return failure when response data is invalid

#### 修复大文件创建失败问题

**问题描述**：
- AI 生成的大文件（如游戏代码）被截断，无法创建完整文件
- `max_tokens` 限制为 2000，不足以生成完整代码
- 代码生成不完整导致文件功能异常

**修复方案**：
- ✅ 将 `max_tokens` 从 2000 提升到 8000
- ✅ 简化文件创建机制，要求 AI 直接在工具参数中传递完整内容
- ✅ 更新系统提示词，提供清晰的文件创建指南

**影响的文件**：
- `app/api/chat/route.ts` - 提升 max_tokens 限制
- `hooks/useCowork.ts` - 简化文件创建提示词

**Commits**：
- `2261249` - fix: increase max_tokens from 2000 to 8000
- `f3f7df5` - fix: simplify file creation to require content in tool parameters

#### 修复任务计划状态不同步问题

**问题描述**：
- 右侧进度条显示任务执行进度，但聊天框内的任务列表不更新
- 任务完成后看不到勾选状态
- 无法在聊天记录中查看任务执行历史

**修复方案**：
- ✅ 添加 `updateMessageTaskPlan` 函数动态更新消息中的任务计划
- ✅ 修改 `addMessage` 返回消息 ID 以便后续更新
- ✅ 在任务执行过程中实时同步状态（pending → in_progress → completed）

**影响的文件**：
- `hooks/useCowork.ts` - 实现任务计划状态同步逻辑

**Commits**：
- `595a9b3` - feat: sync task plan status between progress bar and chat message

#### 修复重复执行问题

**问题描述**：
- 点击发送按钮触发两次 AI 调用
- AI 响应内容重复出现
- "我来帮你xx，让我先规划一下步骤：" 出现两次

**根本原因**：
1. React 18 StrictMode 在开发模式下故意双重执行组件
2. 组件重渲染导致 `handleSendMessage` 被多次调用
3. 缺少防重复调用机制

**修复方案**：
- ✅ 在 `getRealAIResponse` 中使用 `isProcessingRef` 防止 API 层重复调用
- ✅ 在 `handleSendMessage` 中添加 500ms 防抖检查防止 UI 层重复发送
- ✅ 使用 `useCallback` 包装 `handleSendMessage` 稳定函数引用
- ✅ **禁用 React StrictMode** 解决开发模式双重执行问题

**影响的文件**：
- `hooks/useCowork.ts` - 添加 isProcessingRef 防护
- `app/page.tsx` - 添加防抖检查和 useCallback
- `next.config.js` - 禁用 reactStrictMode

**Commits**：
- `fb64059` - fix: prevent duplicate AI response calls
- `7727788` - fix: prevent duplicate message sends with debouncing
- `10b767b` - fix: disable React StrictMode to prevent double execution

#### 修复 Artifact 内容注入竞态条件

**问题描述**：
- 代码块提取后创建 Artifact，但内容注入时找不到
- `artifactMap` 为空导致文件写入失败
- 工具调用代码块被误识别为文件内容

**修复方案**：
- ✅ 直接使用 `artifactMap` 而不依赖异步更新的 state
- ✅ 跳过 `tool:xxx` 格式的工具调用代码块
- ✅ 添加详细的调试日志追踪提取和注入过程

**影响的文件**：
- `hooks/useCowork.ts` - 修复竞态条件和代码块过滤

**Commits**：
- `7341cde` - fix: resolve race condition in artifact content injection
- `4dd6e45` - fix: exclude tool call blocks from artifact extraction

### 🔧 配置更改

#### 配置 workspace 目录为 gitignore

**变更内容**：
- ✅ 添加 `/workspace/*` 到 .gitignore
- ✅ 保留 workspace 目录结构（通过 .gitkeep）
- ✅ 从 git 中移除所有已跟踪的 workspace 文件
- ✅ 确保用户数据文件不被提交到代码仓库

**影响的文件**：
- `.gitignore` - 添加 workspace 忽略规则
- `workspace/.gitkeep` - 保留空目录结构

**Commits**：
- `6c7574b` - chore: add workspace to gitignore and remove tracked files

### 📝 调试日志增强

**新增功能**：
- ✅ 添加 AI 响应内容长度和预览日志
- ✅ 添加工具调用参数详细信息日志
- ✅ 添加代码块提取过程的完整日志
- ✅ 添加 Artifact 注入过程的追踪日志

**Commits**：
- `f22a8c5` - debug: add tool call parameter logging
- `6266eae` - debug: add response content logging before extraction
- `7b366ac` - debug: add comprehensive logging for code block extraction

---

## [1.0.1] - 2026-01-16

### 🐛 Bug 修复

#### 修复聊天触发两次的问题

**问题描述**：
- 发送消息时会触发两次 AI 响应
- 初始化时会创建重复的消息
- 在 React StrictMode 下表现更明显

**根本原因**：
1. React 18 StrictMode 在开发环境下会双重调用 effects
2. `useEffect` 没有防护机制防止重复执行
3. `useCallback` 的依赖项导致函数频繁重新创建

**修复方案**：
- ✅ 在 `app/page.tsx` 中使用 `useRef` 防止初始化重复执行
- ✅ 优化 `hooks/useCowork.ts` 中的 `simulateAIResponse` 依赖
- ✅ 移除不必要的依赖项，使用空依赖数组

**影响的文件**：
- `app/page.tsx` - 添加 `useRef` 初始化保护
- `hooks/useCowork.ts` - 优化 `simulateAIResponse` 的依赖

**测试验证**：
- ✅ 初始化只执行一次
- ✅ 消息发送只触发一次响应
- ✅ 在 StrictMode 下工作正常

### 📝 文档更新

- 新增 `FIXES.md` - 详细的问题修复说明
- 新增 `TEST_GUIDE.md` - 完整的测试指南
- 新增 `CHANGELOG.md` - 版本更新日志

---

## [1.0.0] - 2026-01-16

### 🎉 初始版本

#### 核心功能

- ✅ 任务管理系统
  - 创建新任务
  - 任务列表展示
  - 任务切换
  - 任务标题编辑

- ✅ 聊天界面
  - 用户消息发送
  - AI 响应显示
  - 命令执行展示
  - 消息历史记录

- ✅ 进度追踪
  - 可视化步骤指示器
  - 实时状态更新
  - 三种状态：完成/进行中/待处理

- ✅ 上下文管理
  - Artifacts（生成文件）展示
  - Working Files（工作文件）列表
  - Selected Folders（选中文件夹）
  - Connectors（连接器）

#### 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **状态管理**: React Hooks

#### UI/UX 特性

- 三栏布局设计
- 响应式界面
- 平滑动画效果
- 自动调整的输入框
- 键盘快捷键支持
- 现代化视觉设计

#### 项目结构

```
cowork/
├── app/                    # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/             # React 组件
│   ├── LeftSidebar.tsx
│   ├── ChatArea.tsx
│   └── RightSidebar.tsx
├── hooks/                  # 自定义 Hooks
│   └── useCowork.ts
├── types/                  # TypeScript 类型
│   └── index.ts
└── 配置文件
```

#### 模拟 AI 功能

- 文件搜索响应
- 文件整理建议
- 文件创建功能
- 通用对话响应

---

## 版本说明

### 语义化版本

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 图例

- 🎉 新功能
- 🐛 Bug 修复
- 📝 文档更新
- 🔧 配置更改
- ⚡ 性能优化
- 🎨 UI/样式更新
- ♻️ 代码重构
- 🔒 安全修复
