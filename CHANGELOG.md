# 更新日志

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
