# 📚 文档索引

## 🎯 我想...

### 快速开始
- **启动项目** → [START.md](./START.md)
- **了解项目** → [README.md](./README.md)

### 配置 AI
- **3 分钟快速配置** → [QUICK_AI_SETUP.md](./QUICK_AI_SETUP.md) ⭐ 推荐新手
- **详细配置指南** → [AI_SETUP.md](./AI_SETUP.md)
- **配置位置总结** → [AI_CONFIG_SUMMARY.md](./AI_CONFIG_SUMMARY.md)
- **集成开发指南** → [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md)

### 测试和调试
- **测试指南** → [TEST_GUIDE.md](./TEST_GUIDE.md)
- **问题修复** → [FIXES.md](./FIXES.md)

### 项目信息
- **更新日志** → [CHANGELOG.md](./CHANGELOG.md)
- **环境变量示例** → [.env.local.example](./.env.local.example)

---

## 📖 文档说明

### START.md
**用途**: 快速启动指南  
**内容**:
- 启动开发服务器
- 安装依赖
- 测试关键词
- 自定义配置
- 常见问题

**适合**: 所有用户

---

### README.md
**用途**: 项目完整文档  
**内容**:
- 项目概述
- 功能特性
- 技术栈
- 项目结构
- 安装和运行
- 自定义指南

**适合**: 想全面了解项目的用户

---

### QUICK_AI_SETUP.md ⭐
**用途**: AI 快速配置（3 分钟）  
**内容**:
- 最简配置步骤
- 如何获取 API Key
- 国内替代方案
- 测试配置
- 常见错误解决

**适合**: 想快速对接 AI 的用户

---

### AI_SETUP.md
**用途**: AI 详细配置指南  
**内容**:
- 支持的 AI 服务
- 详细配置步骤
- 代码位置说明
- 高级配置
- 安全建议
- 完整的常见问题

**适合**: 需要深入了解 AI 配置的用户

---

### AI_CONFIG_SUMMARY.md
**用途**: AI 配置位置总结  
**内容**:
- 配置位置一览
- 数据流程图
- 自定义配置点
- 文件结构
- 快速定位表
- 调试技巧

**适合**: 开发者，需要修改代码的用户

---

### AI_INTEGRATION_GUIDE.md
**用途**: AI 集成开发指南  
**内容**:
- 配置流程图
- 核心代码解析
- 自定义示例
- 安全最佳实践
- 监控和日志
- 学习资源

**适合**: 高级开发者，需要深度定制的用户

---

### TEST_GUIDE.md
**用途**: 测试指南  
**内容**:
- 验证修复
- 功能测试清单
- 特殊关键词测试
- UI 测试
- 性能测试
- 调试技巧

**适合**: 测试人员，质量保证

---

### FIXES.md
**用途**: 问题修复说明  
**内容**:
- 已修复的问题
- 问题原因分析
- 修复方案
- 验证方法
- React StrictMode 说明

**适合**: 遇到问题的用户

---

### CHANGELOG.md
**用途**: 版本更新日志  
**内容**:
- 版本历史
- 功能更新
- Bug 修复
- 文档更新

**适合**: 想了解项目演进的用户

---

## 🗂️ 核心代码文件

### lib/ai-service.ts
**作用**: AI 服务封装  
**包含**:
- `AIService` 类 - OpenAI 兼容 API
- `ClaudeService` 类 - Anthropic Claude
- 流式响应支持
- 错误处理

**修改场景**:
- 添加新的 AI 服务
- 修改 API 参数
- 添加重试逻辑
- 自定义错误处理

---

### hooks/useCowork.ts
**作用**: 状态管理和 AI 交互  
**包含**:
- 应用状态管理
- `simulateAIResponse()` - 模拟 AI
- `getRealAIResponse()` - 真实 AI
- 任务管理
- 消息管理

**修改场景**:
- 添加系统提示词
- 处理特殊命令
- 添加上下文增强
- 自定义 AI 行为

---

### app/page.tsx
**作用**: 主页面逻辑  
**包含**:
- 组件集成
- 真实/模拟 AI 切换
- 消息发送处理
- 初始化逻辑

**修改场景**:
- 修改页面布局
- 添加新功能
- 修改初始化行为

---

### components/
**作用**: React 组件  
**包含**:
- `LeftSidebar.tsx` - 任务列表
- `ChatArea.tsx` - 聊天界面
- `RightSidebar.tsx` - 上下文面板

**修改场景**:
- 修改 UI 样式
- 添加新组件
- 调整布局

---

## 🎯 快速查找

### 按场景查找

| 场景 | 文档 |
|------|------|
| 第一次使用 | [START.md](./START.md) |
| 配置 AI（新手） | [QUICK_AI_SETUP.md](./QUICK_AI_SETUP.md) |
| 配置 AI（详细） | [AI_SETUP.md](./AI_SETUP.md) |
| 修改代码 | [AI_CONFIG_SUMMARY.md](./AI_CONFIG_SUMMARY.md) |
| 深度定制 | [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md) |
| 遇到问题 | [FIXES.md](./FIXES.md) + [TEST_GUIDE.md](./TEST_GUIDE.md) |
| 了解更新 | [CHANGELOG.md](./CHANGELOG.md) |

---

### 按角色查找

| 角色 | 推荐文档 |
|------|---------|
| 普通用户 | START.md, QUICK_AI_SETUP.md |
| 开发者 | AI_CONFIG_SUMMARY.md, AI_INTEGRATION_GUIDE.md |
| 测试人员 | TEST_GUIDE.md, FIXES.md |
| 项目经理 | README.md, CHANGELOG.md |

---

## 💡 学习路径

### 初级用户
1. [START.md](./START.md) - 启动项目
2. [QUICK_AI_SETUP.md](./QUICK_AI_SETUP.md) - 配置 AI
3. [TEST_GUIDE.md](./TEST_GUIDE.md) - 测试功能

### 中级用户
1. [README.md](./README.md) - 了解项目
2. [AI_SETUP.md](./AI_SETUP.md) - 详细配置
3. [AI_CONFIG_SUMMARY.md](./AI_CONFIG_SUMMARY.md) - 代码位置

### 高级用户
1. [AI_CONFIG_SUMMARY.md](./AI_CONFIG_SUMMARY.md) - 配置总结
2. [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md) - 集成指南
3. 直接修改源代码

---

## 🔍 搜索技巧

### 想找...

- **如何获取 API Key** → QUICK_AI_SETUP.md 或 AI_SETUP.md
- **配置文件在哪** → AI_CONFIG_SUMMARY.md
- **代码怎么改** → AI_INTEGRATION_GUIDE.md
- **为什么触发两次** → FIXES.md
- **如何测试** → TEST_GUIDE.md
- **支持哪些 AI** → AI_SETUP.md
- **如何自定义** → AI_INTEGRATION_GUIDE.md
- **遇到错误** → QUICK_AI_SETUP.md (常见错误) 或 AI_SETUP.md (常见问题)

---

## 📞 获取帮助

1. **查看相关文档** - 使用上面的索引
2. **检查错误信息** - 浏览器控制台 (F12)
3. **查看日志** - 开发服务器输出
4. **参考示例** - AI_INTEGRATION_GUIDE.md 中的示例代码

---

**提示**: 建议按顺序阅读文档，从 START.md 开始！
